/**
 * The term-results queue's rules and wording (Round 3, §21–§23).
 */
import {
  STATUS_TABS,
  activeTermId,
  awaitsOffice,
  basisLabel,
  cellUnit,
  changedPrincipalRemarks,
  formatCell,
  formatPercent,
  formatWhen,
  missingRemarksLabel,
  notPublishedMessage,
  officeConflictMessage,
  ordinal,
  personName,
  positionLabel,
  remarkValue,
  remarksLocked,
  remarksLockedNote,
  studentsMissingRemarks,
  termOptions,
  validateRemark,
  validateReturnReason,
} from "@/components/termResults/termResults.model";
import { gradingConflict, type TermRemarkRow } from "@/types/gradingContract";
import { ApiError } from "@/lib/apiError";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";

/** A remark not written is '' (Round 3 as built, §22), never null. */
function remarkRow(id: string, teacher: string, principal: string): TermRemarkRow {
  return {
    student: { id, name: `Student ${id}`, admissionNumber: null },
    position: null,
    average: null,
    publishedCount: 0,
    subjectCount: 0,
    classTeacherRemark: teacher,
    principalRemark: principal,
  };
}

describe("queue wording", () => {
  it("has the three tabs in order", () => {
    expect(STATUS_TABS.map((t) => t.label)).toEqual(["Submitted", "Returned", "Published"]);
  });

  it("names the basis from its label, with a fallback for an assessment the API no longer finds", () => {
    expect(basisLabel({ key: "total", label: "Term total" })).toBe("Term total");
    expect(basisLabel({ key: "a1", label: "First CA" })).toBe("First CA");
    expect(basisLabel({ key: "a1", label: "" })).toBe("Single assessment");
  });

  it("names a person, or says 'Unknown' when none is recorded", () => {
    expect(personName({ id: "u1", name: "Tolu Teacher" })).toBe("Tolu Teacher");
    expect(personName({ id: "u1", name: "" })).toBe("Unknown");
    expect(personName(null)).toBe("Unknown");
  });

  it("says how many class teacher remarks are missing", () => {
    expect(missingRemarksLabel(0)).toBe("All in");
    expect(missingRemarksLabel(3)).toBe("3 missing");
  });

  it("formats dates defensively", () => {
    expect(formatWhen(null)).toBe("—");
    expect(formatWhen("nonsense")).toBe("—");
    expect(formatWhen("2026-09-28T10:00:00Z")).toMatch(/2026/);
  });
});

describe("term picker", () => {
  const terms = [
    { _id: "t1", name: "First Term", academicYearId: "y1", isCurrent: false },
    { _id: "t2", name: "Second Term", academicYearId: "y1", isCurrent: true },
  ] as TermResponse[];
  const years = [{ _id: "y1", year: "2026/2027" }] as AcademicYearResponse[];

  it("labels terms with their year and opens on the current one", () => {
    const options = termOptions(terms, years);
    expect(options.map((o) => o.label)).toEqual([
      "2026/2027 · First Term",
      "2026/2027 · Second Term",
    ]);
    expect(activeTermId(options, "")).toBe("t2");
    expect(activeTermId(options, "t1")).toBe("t1");
    expect(activeTermId(options, "gone")).toBe("t2");
    expect(activeTermId([], "")).toBe("");
  });
});

describe("broadsheet cells", () => {
  it("shows percents on a term-total basis and scores on an assessment basis", () => {
    const total = { key: "total", label: "Term total", maxPerSubject: null };
    const ca = { key: "a1", label: "CA 1", maxPerSubject: 40 };
    expect(formatCell(72.5, total)).toBe("72.5%");
    expect(formatCell(31, ca)).toBe("31");
    expect(formatCell(null, ca)).toBe("—");
    expect(cellUnit(total)).toBe("Subject totals (%)");
    expect(cellUnit(ca)).toBe("Scores out of 40");
    expect(formatPercent(null)).toBe("—");
  });

  it("writes positions as ordinals, ties included", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "23rd",
      "101st",
    ]);
    expect(positionLabel({ rank: 1, of: 30 })).toBe("1st of 30");
    expect(positionLabel(null)).toBe("—");
  });
});

describe("state rules", () => {
  it("lets the office act only on a submitted result", () => {
    expect(awaitsOffice({ status: "submitted" })).toBe(true);
    expect(awaitsOffice({ status: "returned" })).toBe(false);
    expect(awaitsOffice({ status: "published" })).toBe(false);
  });

  it("locks the remarks once published", () => {
    expect(remarksLocked({ status: "submitted" })).toBe(false);
    expect(remarksLocked({ status: "returned" })).toBe(false);
    expect(remarksLocked({ status: "published" })).toBe(true);
    expect(
      remarksLockedNote({
        class: { id: "c", name: "Grade 5A" },
        term: { id: "t", name: "First Term" },
      })
    ).toBe("Remarks are locked: Grade 5A's results for First Term are published.");
  });

  it("needs a reason to return results", () => {
    expect(validateReturnReason("")).toMatch(/Give a reason/);
    expect(validateReturnReason("   ")).toMatch(/Give a reason/);
    expect(validateReturnReason("x".repeat(501))).toMatch(/500 characters/);
    expect(validateReturnReason("Maths remark missing")).toBeUndefined();
  });

  it("caps a remark at 500 characters", () => {
    expect(validateRemark("x".repeat(500))).toBeUndefined();
    expect(validateRemark("x".repeat(501))).toMatch(/500 characters/);
  });
});

describe("principal remarks", () => {
  const rows = [
    remarkRow("s1", "Good work", "Well done"),
    remarkRow("s2", "", ""),
    remarkRow("s3", " ", ""),
  ];

  it("shows the edit, else the saved remark", () => {
    expect(remarkValue(rows[0], {})).toBe("Well done");
    expect(remarkValue(rows[0], { s1: "Excellent" })).toBe("Excellent");
    expect(remarkValue(rows[1], {})).toBe("");
  });

  it("sends only the remarks that changed, trimmed, and an emptied one as ''", () => {
    expect(changedPrincipalRemarks(rows, {})).toEqual([]);
    expect(changedPrincipalRemarks(rows, { s1: "Well done " })).toEqual([]);
    expect(changedPrincipalRemarks(rows, { s1: "", s2: " Keep going ", s3: "" })).toEqual([
      { studentId: "s1", principalRemark: "" },
      { studentId: "s2", principalRemark: "Keep going" },
    ]);
  });

  it("lists the students without a class teacher remark", () => {
    expect(studentsMissingRemarks(rows)).toEqual(["Student s2", "Student s3"]);
  });
});

describe("409s from the office actions", () => {
  /** A 409 as the API sends it: the machine-readable fields sit at the top level. */
  const conflict = (meta: Record<string, unknown>) =>
    new ApiError("CONFLICT", "Conflict", 409, [], undefined, meta);

  it("reads the top-level fields of a 409 only", () => {
    expect(gradingConflict(conflict({ code: "ALREADY_PUBLISHED", status: "published" }))).toEqual({
      code: "ALREADY_PUBLISHED",
      status: "published",
    });
    expect(gradingConflict(conflict({ waitingOn: [{ courseId: "e", title: "English" }] }))).toEqual(
      { waitingOn: [{ courseId: "e", title: "English" }] }
    );
    expect(gradingConflict(new ApiError("NOT_FOUND", "Gone", 404))).toBeNull();
    expect(gradingConflict(new Error("x"))).toBeNull();
  });

  it("says another member of staff got there first", () => {
    expect(
      officeConflictMessage({ code: "ALREADY_PUBLISHED", status: "published" }, "Grade 5A")
    ).toBe("Grade 5A results are already published.");
    expect(officeConflictMessage({ code: "RETURNED", status: "returned" }, "Grade 5A")).toBe(
      "Grade 5A results were already returned to the class teacher."
    );
    expect(officeConflictMessage({}, "Grade 5A")).toBeUndefined();
    expect(officeConflictMessage(null, "Grade 5A")).toBeUndefined();
  });

  it("names the subjects no longer published", () => {
    const english = { courseId: "e", title: "English" };
    const maths = { courseId: "m", title: "Mathematics" };
    const art = { courseId: "a", title: "Art" };
    expect(officeConflictMessage({ waitingOn: [english] }, "Grade 5A")).toBe(
      "English is no longer published. Return the results, or wait until its teacher publishes again."
    );
    expect(notPublishedMessage([art, english, maths])).toBe(
      "Art, English and Mathematics are no longer published. Return the results, or wait until their teachers publish again."
    );
    expect(notPublishedMessage([])).toMatch(/^A subject is no longer published/);
  });
});
