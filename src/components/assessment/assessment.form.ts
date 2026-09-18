/**
 * The assessment form's rules, kept out of the modal so they can be tested
 * without rendering it.
 *
 * They mirror the backend `CreateAssessmentDto` and the service's date checks:
 * a new assessment cannot start in the past, the end must follow the start,
 * and "active" is only a legal status while the assessment is actually running.
 */
import type { AssessmentForm } from "@/components/assessment/AssessmentForm.types";

/** What is wrong with the form, keyed by field; empty when it is valid. */
export type AssessmentFormErrors = Partial<Record<keyof AssessmentForm, string>>;

/** Midnight at the start of the given day. */
function startOfDay(value: Date): Date {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
}

/**
 * Reads a date input's `YYYY-MM-DD` as a local calendar date.
 *
 * `new Date("2026-03-15")` is parsed as UTC midnight, which is the previous
 * day everywhere west of Greenwich — an assessment starting today then read as
 * starting in the past. Building the date from its parts keeps the day the
 * administrator picked.
 *
 * @param value - The input's value.
 * @returns The local date, or an invalid date when the value is unusable.
 */
function parseDateInput(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return new Date(NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Whether today falls inside the assessment's window.
 *
 * @param startDate - Start date, as the date input holds it (`YYYY-MM-DD`).
 * @param endDate - End date.
 * @param now - The moment to compare against; defaults to now.
 * @returns True when the assessment is currently running.
 */
export function isWithinAssessmentPeriod(
  startDate: string,
  endDate: string,
  now: Date = new Date(),
): boolean {
  if (!startDate || !endDate) return false;

  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  end.setHours(23, 59, 59, 999);
  const today = startOfDay(now);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return today >= start && today <= end;
}

/**
 * Checks the form against the rules the server enforces.
 *
 * The "cannot start in the past" rule applies to new assessments only — an
 * assessment already under way must stay editable, which is why it is not
 * applied when editing.
 *
 * @param form - The form's current values.
 * @param options - `isEditing` when an existing assessment is being changed.
 * @param now - The moment to compare dates against; defaults to now.
 * @returns The problems found, keyed by field.
 */
export function validateAssessmentForm(
  form: AssessmentForm,
  options: { isEditing: boolean },
  now: Date = new Date(),
): AssessmentFormErrors {
  const errors: AssessmentFormErrors = {};

  if (!form.name.trim()) errors.name = "Assessment name is required";
  if (!form.termId) errors.termId = "Term selection is required";

  if (!form.startDate) {
    errors.startDate = "Start date is required";
  } else if (!options.isEditing && parseDateInput(form.startDate) < startOfDay(now)) {
    errors.startDate = "Start date cannot be in the past";
  }

  if (!form.endDate) {
    errors.endDate = "End date is required";
  } else if (form.startDate && parseDateInput(form.endDate) <= parseDateInput(form.startDate)) {
    errors.endDate = "End date must be after start date";
  }

  if (form.status === "active" && !isWithinAssessmentPeriod(form.startDate, form.endDate, now)) {
    errors.status = "Assessment can only be set to 'Active' during its scheduled period";
  }

  return errors;
}
