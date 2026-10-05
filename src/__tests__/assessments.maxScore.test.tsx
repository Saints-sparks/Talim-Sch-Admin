/** @jest-environment jsdom */
/**
 * The assessment max score (Round 3, §15): required, a whole number 1–1000,
 * sent on create, sent on edit only when it changed, shown on the list as
 * "out of X", and a 409 on an edit that changed it explained on the field:
 * `PUBLISHED` (scores already published) or `SCORES_ABOVE_MAX` (a recorded
 * score is above the new value), read from the top level of the 409 body.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import AssessmentCreateModal from "@/components/assessment/AssessmentCreateModal";
import AssessmentList, { maxScoreLabel } from "@/components/assessment/AssessmentList";
import {
  describeAssessmentSaveError,
  maxScoreChanged,
  parseMaxScore,
  toAssessmentForm,
  toCreateAssessmentPayload,
  toUpdateAssessmentPayload,
  validateAssessmentForm,
  validateMaxScore,
} from "@/components/assessment/assessment.form";
import type { Assessment, AssessmentForm, Term } from "@/components/assessment/AssessmentForm.types";
import { ApiError } from "@/lib/apiError";

const NOW = new Date("2026-03-15T10:00:00Z");

const term: Term = {
  _id: "term-1",
  id: "term-1",
  session: "2025/2026",
  name: "First Term",
  startDate: "2026-01-01",
  endDate: "2026-04-30",
  schoolId: "s1",
  academicYearId: "y1",
  isCurrent: true,
  createdAt: "",
  updatedAt: "",
};

const saved: Assessment = {
  _id: "a1",
  name: "CA 1",
  description: "",
  termId: { _id: "term-1", name: "First Term", startDate: "2026-01-01", endDate: "2026-04-30" },
  schoolId: "s1",
  startDate: "2026-04-01T00:00:00.000Z",
  endDate: "2026-04-10T00:00:00.000Z",
  status: "pending",
  maxScore: 40,
  createdBy: { _id: "u1", name: "Admin", email: "a@x.test" },
  createdAt: "",
  updatedAt: "",
};

const form: AssessmentForm = {
  name: "CA 1",
  description: "",
  termId: "term-1",
  startDate: "2026-04-01",
  endDate: "2026-04-10",
  status: "pending",
  maxScore: "40",
};

describe("validateMaxScore", () => {
  it("requires a value", () => {
    expect(validateMaxScore("")).toBe("Max score is required");
    expect(validateMaxScore("   ")).toBe("Max score is required");
  });

  it("takes plain numbers only", () => {
    for (const text of ["abc", "-5", "1e2", "0x10", "12,5"]) {
      expect(validateMaxScore(text)).toBe("Max score must be a number");
    }
  });

  it("keeps it a whole number between 1 and 1000", () => {
    expect(validateMaxScore("0")).toBe("Max score must be between 1 and 1000");
    expect(validateMaxScore("0.5")).toBe("Max score must be between 1 and 1000");
    expect(validateMaxScore("1001")).toBe("Max score must be between 1 and 1000");
    expect(validateMaxScore("12.5")).toBe("Max score must be a whole number");
    for (const ok of ["1", "20", "100", "1000", "40.0", " 60 "]) expect(validateMaxScore(ok)).toBeUndefined();
  });

  it("is part of the form check", () => {
    expect(validateAssessmentForm({ ...form, maxScore: "" }, { isEditing: false }, NOW).maxScore).toBe(
      "Max score is required",
    );
    expect(validateAssessmentForm(form, { isEditing: false }, NOW)).toEqual({});
  });

  it("parses what it accepts", () => {
    expect(parseMaxScore(" 12.5 ")).toBe(12.5);
    expect(parseMaxScore("abc")).toBeNull();
  });
});

describe("payloads", () => {
  it("starts a new form blank and an edit from the saved max score", () => {
    expect(toAssessmentForm(null).maxScore).toBe("");
    expect(toAssessmentForm(saved)).toMatchObject({ maxScore: "40", startDate: "2026-04-01", termId: "term-1" });
  });

  it("sends the max score as a number on create", () => {
    expect(toCreateAssessmentPayload({ ...form, maxScore: "30" })).toMatchObject({ maxScore: 30, status: "pending" });
  });

  it("sends the max score on edit only when it changed", () => {
    expect(maxScoreChanged(form, saved)).toBe(false);
    expect(toUpdateAssessmentPayload({ ...form, name: "CA one" }, saved)).not.toHaveProperty("maxScore");
    expect(maxScoreChanged({ ...form, maxScore: "50" }, saved)).toBe(true);
    expect(toUpdateAssessmentPayload({ ...form, maxScore: "50" }, saved)).toMatchObject({ maxScore: 50 });
  });
});

describe("describeAssessmentSaveError", () => {
  /** A 409 as the API sends it: `code` and friends at the top level, `error.code` CONFLICT. */
  const conflictWith = (meta: Record<string, unknown>) =>
    new ApiError("CONFLICT", "Scores are published", 409, [], undefined, meta);
  const conflict = conflictWith({ code: "PUBLISHED" });

  it("explains a 409 PUBLISHED on a changed max score on the field, with the value to go back to", () => {
    const problem = describeAssessmentSaveError(conflict, { isEditing: true, maxScoreChanged: true, savedMaxScore: 40 });
    expect(problem).toEqual({
      field: "maxScore",
      message:
        "Scores for this assessment are already published, so its max score can't change. Put it back to 40 to save your other changes.",
    });
  });

  it("explains a 409 SCORES_ABOVE_MAX with the highest score recorded", () => {
    const problem = describeAssessmentSaveError(conflictWith({ code: "SCORES_ABOVE_MAX", highestScore: 38.5 }), {
      isEditing: true,
      maxScoreChanged: true,
      savedMaxScore: 40,
    });
    expect(problem).toEqual({
      field: "maxScore",
      message:
        "A score of 38.5 is already recorded for this assessment, so the max score can't be below 38.5. Use 39 or more, or put it back to 40.",
    });
  });

  it("puts a 400 about the max score on the field", () => {
    const invalid = new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
      { field: "maxScore", reason: "maxScore must be an integer number" },
    ]);
    expect(describeAssessmentSaveError(invalid, { isEditing: false, maxScoreChanged: false })).toEqual({
      field: "maxScore",
      message: "maxScore must be an integer number",
    });
  });

  it("leaves any other failure to the form", () => {
    expect(describeAssessmentSaveError(conflict, { isEditing: true, maxScoreChanged: false })).toEqual({
      message: "Scores are published",
    });
    expect(
      describeAssessmentSaveError(new ApiError("VALIDATION_FAILED", "Bad dates", 400), {
        isEditing: true,
        maxScoreChanged: true,
      }),
    ).toEqual({ message: "Bad dates" });
    expect(describeAssessmentSaveError(new Error(""), { isEditing: false, maxScoreChanged: false }).message).toBe(
      "Failed to create assessment.",
    );
  });
});

describe("AssessmentCreateModal max score field", () => {
  it("is required, labelled, and its error is tied to it", async () => {
    const onSubmit = jest.fn();
    render(<AssessmentCreateModal isOpen onClose={jest.fn()} onSubmit={onSubmit} terms={[term]} />);

    const field = screen.getByLabelText(/Max Score/);
    expect(field).toHaveAttribute("aria-required", "true");
    fireEvent.click(screen.getByRole("button", { name: "Create Assessment" }));

    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    const describedBy = (field.getAttribute("aria-describedby") ?? "").split(" ");
    expect(document.getElementById(describedBy[0])).toHaveTextContent("Max score is required");
    expect(document.getElementById("assessment-max-score-hint")).toHaveTextContent(/can.t change once scores/);
  });

  it("shows the published-scores conflict on the field and keeps the draft", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const onSubmit = jest
      .fn()
      .mockRejectedValue(new ApiError("CONFLICT", "Conflict", 409, [], undefined, { code: "PUBLISHED" }));
    const onClose = jest.fn();
    render(
      <AssessmentCreateModal isOpen onClose={onClose} onSubmit={onSubmit} terms={[term]} editingAssessment={saved} />,
    );

    const field = screen.getByLabelText(/Max Score/);
    expect(field).toHaveValue(40);
    fireEvent.change(field, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Assessment" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ maxScore: "50" });
    const describedBy = await waitFor(() => {
      const ids = field.getAttribute("aria-describedby") ?? "";
      expect(ids).toContain("assessment-max-score-error");
      return ids;
    });
    expect(document.getElementById(describedBy.split(" ")[0])).toHaveTextContent(/already published.*back to 40/);
    expect(screen.getByRole("alert")).toHaveTextContent("The assessment was not saved");
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue(50);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the scores-above-max conflict on the field", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const onSubmit = jest.fn().mockRejectedValue(
      new ApiError("CONFLICT", "Conflict", 409, [], undefined, { code: "SCORES_ABOVE_MAX", highestScore: 36 }),
    );
    render(
      <AssessmentCreateModal isOpen onClose={jest.fn()} onSubmit={onSubmit} terms={[term]} editingAssessment={saved} />,
    );
    const field = screen.getByLabelText(/Max Score/);
    fireEvent.change(field, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Assessment" }));

    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(document.getElementById("assessment-max-score-error")).toHaveTextContent(
      "A score of 36 is already recorded for this assessment, so the max score can't be below 36. Use 36 or more, or put it back to 40.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("The assessment was not saved. See the max score below.");
  });
});

describe("AssessmentList", () => {
  it("shows each assessment's max score as 'out of X'", () => {
    expect(maxScoreLabel(40)).toBe("out of 40");
    render(
      <AssessmentList
        assessments={[saved, { ...saved, _id: "a2", name: "Exam", maxScore: undefined }]}
        terms={[term]}
        loading={false}
        canManage={false}
        pagination={{ currentPage: 1, totalPages: 1, totalCount: 2, limit: 10 }}
        onPageChange={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getAllByText("out of 40")).toHaveLength(1);
    expect(screen.getAllByText("Max score:")).toHaveLength(1);
  });
});
