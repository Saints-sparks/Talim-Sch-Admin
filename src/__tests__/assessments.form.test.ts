import {
  isWithinAssessmentPeriod,
  validateAssessmentForm,
} from "@/components/assessment/assessment.form";
import {
  EMPTY_FILTERS,
  filterAssessments,
  hasActiveFilters,
} from "@/components/assessment/AssessmentFilters";
import { pageWindow } from "@/components/assessment/AssessmentPagination";
import type { AssessmentForm } from "@/components/assessment/AssessmentForm.types";

/** A fixed "now" so the date rules are deterministic. */
const NOW = new Date("2026-03-15T10:00:00Z");

const validForm: AssessmentForm = {
  name: "First Term Exam",
  description: "",
  termId: "term-1",
  startDate: "2026-04-01",
  endDate: "2026-04-10",
  status: "pending",
};

describe("isWithinAssessmentPeriod", () => {
  it("is true on a day inside the window", () => {
    expect(isWithinAssessmentPeriod("2026-03-10", "2026-03-20", NOW)).toBe(true);
  });

  it("includes both end days", () => {
    expect(isWithinAssessmentPeriod("2026-03-15", "2026-03-15", NOW)).toBe(true);
  });

  it("is false before and after the window", () => {
    expect(isWithinAssessmentPeriod("2026-04-01", "2026-04-10", NOW)).toBe(false);
    expect(isWithinAssessmentPeriod("2026-01-01", "2026-01-10", NOW)).toBe(false);
  });

  it("is false when a date is missing or unparseable", () => {
    expect(isWithinAssessmentPeriod("", "2026-03-20", NOW)).toBe(false);
    expect(isWithinAssessmentPeriod("not-a-date", "2026-03-20", NOW)).toBe(false);
  });
});

describe("validateAssessmentForm", () => {
  it("accepts a complete new assessment", () => {
    expect(validateAssessmentForm(validForm, { isEditing: false }, NOW)).toEqual({});
  });

  it("requires the fields the DTO requires", () => {
    const errors = validateAssessmentForm(
      { ...validForm, name: "  ", termId: "", startDate: "", endDate: "" },
      { isEditing: false },
      NOW,
    );
    expect(errors.name).toBe("Assessment name is required");
    expect(errors.termId).toBe("Term selection is required");
    expect(errors.startDate).toBe("Start date is required");
    expect(errors.endDate).toBe("End date is required");
  });

  it("refuses a new assessment that starts in the past", () => {
    const errors = validateAssessmentForm(
      { ...validForm, startDate: "2026-03-01", endDate: "2026-03-05" },
      { isEditing: false },
      NOW,
    );
    expect(errors.startDate).toBe("Start date cannot be in the past");
  });

  it("still allows editing an assessment that is already under way", () => {
    const errors = validateAssessmentForm(
      { ...validForm, startDate: "2026-03-01", endDate: "2026-03-20", status: "active" },
      { isEditing: true },
      NOW,
    );
    expect(errors).toEqual({});
  });

  it("requires the end date to follow the start date", () => {
    const errors = validateAssessmentForm(
      { ...validForm, startDate: "2026-04-10", endDate: "2026-04-10" },
      { isEditing: false },
      NOW,
    );
    expect(errors.endDate).toBe("End date must be after start date");
  });

  it("refuses 'active' outside the assessment period", () => {
    const errors = validateAssessmentForm(
      { ...validForm, status: "active" },
      { isEditing: true },
      NOW,
    );
    expect(errors.status).toBe(
      "Assessment can only be set to 'Active' during its scheduled period",
    );
  });
});

describe("assessment filters", () => {
  const rows = [
    {
      name: "Maths Exam",
      description: "Algebra",
      status: "active" as const,
      termId: { _id: "t1" },
    },
    {
      name: "English Test",
      description: "Essays",
      status: "pending" as const,
      termId: { _id: "t2" },
    },
  ];

  it("returns everything when nothing is set", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(filterAssessments(rows, EMPTY_FILTERS)).toHaveLength(2);
  });

  it("matches the name and the description, case-insensitively", () => {
    expect(filterAssessments(rows, { ...EMPTY_FILTERS, search: "maths" })).toHaveLength(1);
    expect(filterAssessments(rows, { ...EMPTY_FILTERS, search: "ESSAYS" })).toHaveLength(1);
  });

  it("narrows by term and status", () => {
    expect(filterAssessments(rows, { ...EMPTY_FILTERS, termId: "t2" })[0].name).toBe(
      "English Test",
    );
    expect(filterAssessments(rows, { ...EMPTY_FILTERS, status: "active" })[0].name).toBe(
      "Maths Exam",
    );
  });
});

describe("pageWindow", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });

  it("centres on the current page in the middle of a long list", () => {
    expect(pageWindow(7, 20)).toEqual([5, 6, 7, 8, 9]);
  });

  it("clamps at both ends instead of running past them", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(20, 20)).toEqual([16, 17, 18, 19, 20]);
  });

  it("returns nothing when there are no pages", () => {
    expect(pageWindow(1, 0)).toEqual([]);
  });
});
