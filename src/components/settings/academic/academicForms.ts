import type { AcademicYear, Term } from "@/app/services/academic.service";

/** The add-academic-year form as typed. */
export interface YearForm {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

/** The add-term form as typed. */
export interface TermForm {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  academicYearId: string;
}

/** A blank add-year form. */
export const EMPTY_YEAR: YearForm = { year: "", startDate: "", endDate: "", isCurrent: false };

/** A blank add-term form. */
export const EMPTY_TERM: TermForm = {
  name: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  academicYearId: "",
};

/**
 * Formats an ISO date for the tables.
 *
 * @param d - ISO date string.
 * @returns e.g. "01 Sep 2025", or an em dash when absent.
 */
export function formatSetupDate(d: string): string {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

/**
 * Checks the add-year form, mirroring what the server would refuse.
 *
 * @param form - The form as typed.
 * @param existing - The years the school already has.
 * @returns The first problem to show, or `null` when the form can be sent.
 */
export function validateYearForm(form: YearForm, existing: ReadonlyArray<{ year: string }>): string | null {
  const year = form.year.trim();
  if (!year) return "Academic year is required";
  if (!form.startDate || !form.endDate) return "Dates are required";
  if (new Date(form.startDate) >= new Date(form.endDate)) return "End date must be after start date";
  if (existing.some((y) => y.year === year)) return "Academic year already exists";
  return null;
}

/**
 * Checks the add-term form.
 *
 * @param form - The form as typed.
 * @returns The first problem to show, or `null` when the form can be sent.
 */
export function validateTermForm(form: TermForm): string | null {
  if (!form.name.trim()) return "Term name is required";
  if (!form.academicYearId) return "Academic year is required";
  if (!form.startDate || !form.endDate) return "Dates are required";
  if (new Date(form.startDate) >= new Date(form.endDate)) return "End date must be after start date";
  return null;
}

/**
 * Builds the create-year request from a validated form.
 *
 * @param form - The validated form.
 * @returns The payload with trimmed label and ISO dates.
 */
export function toYearPayload(form: YearForm): AcademicYear {
  return {
    year: form.year.trim(),
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    isCurrent: form.isCurrent,
  };
}

/**
 * Builds the create-term request from a validated form.
 *
 * @param form - The validated form.
 * @returns The payload with a trimmed name (dates stay as the date inputs gave them).
 */
export function toTermPayload(form: TermForm): Omit<Term, "schoolId"> {
  return { ...form, name: form.name.trim() };
}
