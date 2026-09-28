/**
 * The assessment form's rules, kept out of the modal so they can be tested
 * without rendering it.
 *
 * They mirror the backend `CreateAssessmentDto` and the service's date checks:
 * a new assessment cannot start in the past, the end must follow the start,
 * "active" is only a legal status while the assessment is actually running,
 * and the max score is a number from 1 to 1000 (Round 3, §15).
 */
import type {
  Assessment,
  AssessmentForm,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from "@/components/assessment/AssessmentForm.types";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { MAX_SCORE_MAX, MAX_SCORE_MIN } from "@/types/gradingContract";

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

  const maxScore = validateMaxScore(form.maxScore);
  if (maxScore) errors.maxScore = maxScore;

  return errors;
}

// ─── Max score (Round 3, §15) ─────────────────────────────────────────────────

/** A plain decimal: digits, optionally a point and more digits. No signs, exponents or hex. */
const DECIMAL = /^\d+(\.\d+)?$/;

/**
 * Reads the max score field.
 *
 * @param value - The input's text.
 * @returns The number, or null when the text is not a plain decimal.
 */
export function parseMaxScore(value: string): number | null {
  const text = value.trim();
  return DECIMAL.test(text) ? Number(text) : null;
}

/**
 * Checks the max score the way `CreateAssessmentDto` does: required, a
 * number, from 1 to 1000.
 *
 * @param value - The input's text.
 * @returns The problem, or undefined when the value is fine.
 */
export function validateMaxScore(value: string): string | undefined {
  if (!value.trim()) return "Max score is required";
  const score = parseMaxScore(value);
  if (score === null) return "Max score must be a number";
  if (score < MAX_SCORE_MIN || score > MAX_SCORE_MAX) {
    return `Max score must be between ${MAX_SCORE_MIN} and ${MAX_SCORE_MAX}`;
  }
  return undefined;
}

/**
 * The form's starting values: blank for a new assessment, the saved ones for
 * an edit.
 *
 * @param editing - The assessment being edited, if any.
 * @returns The form values.
 */
export function toAssessmentForm(editing?: Assessment | null): AssessmentForm {
  if (!editing) {
    return { name: "", description: "", termId: "", startDate: "", endDate: "", status: "pending", maxScore: "" };
  }
  return {
    name: editing.name,
    description: editing.description || "",
    termId: editing.termId._id,
    // The inputs are `type="date"`, which only understands YYYY-MM-DD.
    startDate: editing.startDate.split("T")[0],
    endDate: editing.endDate.split("T")[0],
    status: editing.status,
    maxScore: editing.maxScore === undefined ? "" : String(editing.maxScore),
  };
}

/**
 * Whether an edit changes the saved max score. A new assessment has nothing
 * to change.
 *
 * @param form - The form's values.
 * @param editing - The assessment being edited, if any.
 * @returns True when the update would send a different `maxScore`.
 */
export function maxScoreChanged(form: AssessmentForm, editing?: Assessment | null): boolean {
  if (!editing) return false;
  return parseMaxScore(form.maxScore) !== (editing.maxScore ?? null);
}

/**
 * The `POST /assessments` body.
 *
 * @param form - A valid form, dates already ISO strings.
 * @returns The body.
 */
export function toCreateAssessmentPayload(form: AssessmentForm): CreateAssessmentRequest {
  return {
    name: form.name,
    description: form.description,
    termId: form.termId,
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status ?? "pending",
    maxScore: parseMaxScore(form.maxScore) ?? 0,
  };
}

/**
 * The `PUT /assessments/:id` body. `maxScore` goes only when it changed, so
 * editing the name or dates of an assessment whose scores are published does
 * not trip the API's max-score lock (409).
 *
 * @param form - A valid form, dates already ISO strings.
 * @param editing - The assessment being edited.
 * @returns The body.
 */
export function toUpdateAssessmentPayload(form: AssessmentForm, editing: Assessment): UpdateAssessmentRequest {
  const payload: UpdateAssessmentRequest = {
    name: form.name,
    description: form.description,
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status,
  };
  if (maxScoreChanged(form, editing)) payload.maxScore = parseMaxScore(form.maxScore) ?? undefined;
  return payload;
}

/** What the form shows after a failed save. */
export interface AssessmentSaveProblem {
  message: string;
  /** Set when the problem belongs to one field, which then shows it. */
  field?: "maxScore";
}

/**
 * Explains a failed save. A 409 on an edit that changed the max score means
 * the API refused the change because scores are already published (§15);
 * the whole update was refused, so the message says how to keep the rest.
 *
 * @param error - What the save threw.
 * @param context.isEditing - True for an edit.
 * @param context.maxScoreChanged - True when the edit changed the max score.
 * @param context.savedMaxScore - The max score on record, to suggest going back to.
 * @returns The message, and the field it belongs to.
 */
export function describeAssessmentSaveError(
  error: unknown,
  context: { isEditing: boolean; maxScoreChanged: boolean; savedMaxScore?: number },
): AssessmentSaveProblem {
  const conflict = error instanceof ApiError && (error.status === 409 || error.code === "CONFLICT");
  if (context.isEditing && context.maxScoreChanged && conflict) {
    const back =
      context.savedMaxScore === undefined
        ? "Put the max score back"
        : `Put it back to ${context.savedMaxScore}`;
    return {
      field: "maxScore",
      message: `Scores for this assessment are already published, so its max score can't change. ${back} to save your other changes.`,
    };
  }
  return {
    message: getErrorMessage(
      error,
      context.isEditing ? "Failed to update assessment." : "Failed to create assessment.",
    ),
  };
}
