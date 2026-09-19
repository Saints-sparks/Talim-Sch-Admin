/** @jest-environment jsdom */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test-utils/render";
import { toast } from "@/components/CustomToast";
import type { StudentEnrollment } from "@/app/services/transit.service";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import {
  bulkDecisionDrafts,
  canContinueSetup,
  enrollmentName,
  patchDecision,
  readyDecisions,
  stepLabels,
  toggleDecision,
  toRequestDecisions,
} from "@/components/transit/promotions/wizard/promotionWizard";
import { CreatePromotionRunModal } from "@/components/transit/promotions/CreatePromotionRunModal";

const mutateAsync = jest.fn();
let rosterData: StudentEnrollment[] = [];

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/transit/useEnrollments", () => ({
  useEnrollments: () => ({ data: rosterData, isLoading: false, isError: false, error: null }),
}));
jest.mock("@/hooks/transit/usePromotionRuns", () => ({
  useCreatePromotionRun: () => ({ mutateAsync, isPending: false }),
}));

const ada = {
  _id: "e1",
  studentId: { _id: "s1", firstName: "Ada", lastName: "Okafor" },
  classId: { _id: "c1", name: "JSS1" },
} as unknown as StudentEnrollment;
const bayo = {
  _id: "e2",
  studentId: { _id: "s2", firstName: "Bayo", lastName: "Ade" },
  classId: { _id: "c1", name: "JSS1" },
} as unknown as StudentEnrollment;

const CLASSES = [
  { _id: "c1", name: "JSS1" },
  { _id: "c2", name: "JSS2" },
];
const YEARS = [
  { _id: "y1", year: "2024/2025" },
  { _id: "y2", year: "2025/2026" },
] as AcademicYearResponse[];
const TERMS = [{ _id: "t1", name: "First Term", academicYearId: "y2" }] as TermResponse[];

describe("promotion wizard logic", () => {
  it("names a student from the populated enrollment", () => {
    expect(enrollmentName(ada)).toBe("Ada Okafor");
  });

  it("names the second step by mode", () => {
    expect(stepLabels("individual")).toEqual(["Setup", "Students", "Review", "Submit"]);
    expect(stepLabels("bulk")[1]).toBe("Bulk Class");
  });

  it("needs two different years to continue", () => {
    expect(canContinueSetup("", "y2")).toBe(false);
    expect(canContinueSetup("y1", "y1")).toBe(false);
    expect(canContinueSetup("y1", "y2")).toBe(true);
  });

  it("adds a blank decision on tick, ignores a repeat tick and removes it on untick", () => {
    const added = toggleDecision([], ada, true);
    expect(added).toEqual([
      { studentId: "s1", studentName: "Ada Okafor", fromClassId: "c1", toClassId: "", repeatClass: false },
    ]);
    expect(toggleDecision(added, ada, true)).toBe(added);
    expect(toggleDecision(added, ada, false)).toEqual([]);
  });

  it("patches only the named student's decision", () => {
    const both = toggleDecision(toggleDecision([], ada, true), bayo, true);
    const next = patchDecision(both, "s2", { toClassId: "c2" });
    expect(next.map((d) => d.toClassId)).toEqual(["", "c2"]);
  });

  it("builds one named decision per enrolled student for a whole class", () => {
    expect(bulkDecisionDrafts([ada, bayo], "c1", "c2")).toEqual([
      { studentId: "s1", studentName: "Ada Okafor", fromClassId: "c1", toClassId: "c2", repeatClass: false },
      { studentId: "s2", studentName: "Bayo Ade", fromClassId: "c1", toClassId: "c2", repeatClass: false },
    ]);
  });

  it("keeps only complete decisions and strips the display name for the request", () => {
    const drafts = [
      { studentId: "s1", studentName: "Ada", fromClassId: "c1", toClassId: "c2", repeatClass: false },
      { studentId: "s2", studentName: "Bayo", fromClassId: "c1", toClassId: "", repeatClass: false },
    ];
    const ready = readyDecisions(drafts);
    expect(ready).toHaveLength(1);
    expect(toRequestDecisions(ready)).toEqual([
      { studentId: "s1", fromClassId: "c1", toClassId: "c2", repeatClass: false },
    ]);
  });
});

describe("CreatePromotionRunModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rosterData = [ada, bayo];
    mutateAsync.mockResolvedValue({});
  });

  it("walks the individual flow and creates the run", async () => {
    const user = userEvent.setup();
    const onCreated = jest.fn();
    render(
      <CreatePromotionRunModal
        academicYears={YEARS}
        terms={TERMS}
        classes={CLASSES}
        onClose={jest.fn()}
        onCreated={onCreated}
      />,
    );

    const next = () => screen.getByRole("button", { name: /^(Next|Continue to Submit)$/ });
    expect(next()).toBeDisabled();
    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(fromSelect, "y1");
    await user.selectOptions(toSelect, "y2");
    await user.click(next());

    expect(next()).toBeDisabled();
    await user.click(screen.getByLabelText(/Ada Okafor/));
    await user.selectOptions(screen.getByLabelText("Target class for Ada Okafor"), "c2");
    await user.click(next());
    await user.click(next());
    await user.click(screen.getByRole("button", { name: "Submit Run" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({
      fromAcademicYearId: "y1",
      toAcademicYearId: "y2",
      targetTermId: undefined,
      decisions: [{ studentId: "s1", fromClassId: "c1", toClassId: "c2", repeatClass: false }],
    });
    expect(toast.success).toHaveBeenCalledWith("Promotion run created and validated");
  });

  it("refuses to review while no student has a target class", async () => {
    const user = userEvent.setup();
    render(
      <CreatePromotionRunModal
        academicYears={YEARS}
        terms={TERMS}
        classes={CLASSES}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );
    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(fromSelect, "y1");
    await user.selectOptions(toSelect, "y2");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByLabelText(/Bayo Ade/));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(toast.error).toHaveBeenCalledWith("Give at least one student a target class");
    expect(screen.getByText("Active enrollments")).toBeInTheDocument();
  });

  it("previews a whole class in bulk mode", async () => {
    const user = userEvent.setup();
    render(
      <CreatePromotionRunModal
        academicYears={YEARS}
        terms={TERMS}
        classes={CLASSES}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );
    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(fromSelect, "y1");
    await user.selectOptions(toSelect, "y2");
    await user.click(screen.getByRole("button", { name: "Bulk Class Promotion" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    const [source, target] = screen.getAllByRole("combobox");
    await user.selectOptions(source, "c1");
    await user.selectOptions(target, "c2");
    expect(await screen.findByText("2 students loaded")).toBeInTheDocument();
    expect(screen.getByLabelText("Target class for Ada Okafor")).toHaveValue("c2");
  });
});
