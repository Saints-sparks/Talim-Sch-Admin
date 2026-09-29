/**
 * The School Day & Bells form as a whole: its values, the checks beyond the
 * bell schedule, and the `PATCH /settings/academic` body.
 */
import type {
  AcademicSettings,
  OfficeHours,
  SchoolWeekday,
  UpdateAcademicSettingsDto,
} from "@/app/services/school-settings.service";
import {
  HHMM,
  hasPeriodErrors,
  toDrafts,
  toPeriodsPayload,
  validateBellSchedule,
  type PeriodDraft,
  type PeriodErrors,
} from "./bellSchedule";

/** What the form holds. */
export interface SchoolDayValues {
  timezone: string;
  schoolDays: SchoolWeekday[];
  registerCloseTime: string;
  registerEditUntil: string;
  periods: PeriodDraft[];
  /** Office hours (Round 4 §36), `HH:mm`; both empty when there are none. */
  officeHoursStart: string;
  officeHoursEnd: string;
}

/** The fields outside the bell schedule that can carry a message. */
export type SchoolDayField =
  | "timezone"
  | "schoolDays"
  | "registerCloseTime"
  | "registerEditUntil"
  | "officeHoursStart"
  | "officeHoursEnd";

/** Messages for the fields outside the bell schedule. */
export type SchoolDayFieldErrors = Partial<Record<SchoolDayField, string>>;

/** Every message the form can show. */
export interface SchoolDayErrors {
  fields: SchoolDayFieldErrors;
  periods: PeriodErrors;
}

/**
 * The form's starting values.
 *
 * @param settings - The saved settings.
 * @returns Editable values, with local row ids on the periods.
 */
export function toSchoolDayValues(settings: AcademicSettings): SchoolDayValues {
  return {
    timezone: settings.timezone,
    schoolDays: [...settings.schoolDays],
    registerCloseTime: settings.registerCloseTime,
    registerEditUntil: settings.registerEditUntil,
    periods: toDrafts(settings.periods),
    officeHoursStart: settings.officeHours?.start ?? "",
    officeHoursEnd: settings.officeHours?.end ?? "",
  };
}

/**
 * Checks the optional office hours: both empty, or both set with the end
 * after the start.
 *
 * @param start - Opening time as typed (`HH:mm` or empty).
 * @param end - Closing time as typed.
 * @returns A message per field; empty when they are fine.
 */
export function validateOfficeHours(start: string, end: string): SchoolDayFieldErrors {
  const fields: SchoolDayFieldErrors = {};
  if (!start && !end) return fields;
  if (!start) fields.officeHoursStart = "Set when the office opens, or clear both times.";
  else if (!HHMM.test(start)) fields.officeHoursStart = "Enter a time such as 08:00.";
  if (!end) fields.officeHoursEnd = "Set when the office closes, or clear both times.";
  else if (!HHMM.test(end)) fields.officeHoursEnd = "Enter a time such as 16:00.";
  if (!fields.officeHoursStart && !fields.officeHoursEnd && end <= start) {
    fields.officeHoursEnd = "Office hours must end after they start.";
  }
  return fields;
}

/**
 * The office hours to save.
 *
 * @param values - The form.
 * @returns `{ start, end }` when both are set, otherwise null (none).
 */
export function toOfficeHours(values: Pick<SchoolDayValues, "officeHoursStart" | "officeHoursEnd">): OfficeHours | null {
  return values.officeHoursStart && values.officeHoursEnd
    ? { start: values.officeHoursStart, end: values.officeHoursEnd }
    : null;
}

function sameOfficeHours(a: OfficeHours | null | undefined, b: OfficeHours | null | undefined): boolean {
  return (a?.start ?? "") === (b?.start ?? "") && (a?.end ?? "") === (b?.end ?? "");
}

/**
 * Checks the whole form.
 *
 * @param values - The form.
 * @returns Field and period messages; see {@link hasSchoolDayErrors}.
 */
export function validateSchoolDay(values: SchoolDayValues): SchoolDayErrors {
  const fields: SchoolDayFieldErrors = {};
  if (!values.timezone) fields.timezone = "Choose the school's timezone.";
  if (values.schoolDays.length === 0) fields.schoolDays = "Pick at least one school day.";
  if (!HHMM.test(values.registerCloseTime)) fields.registerCloseTime = "Set the time the register closes.";
  if (!HHMM.test(values.registerEditUntil)) {
    fields.registerEditUntil = "Set the time teachers can edit the register until.";
  } else if (HHMM.test(values.registerCloseTime) && values.registerEditUntil < values.registerCloseTime) {
    fields.registerEditUntil = "Editing must stay open until at least the close time.";
  }
  Object.assign(fields, validateOfficeHours(values.officeHoursStart, values.officeHoursEnd));
  return { fields, periods: validateBellSchedule(values.periods) };
}

/**
 * Whether a validation result blocks saving.
 *
 * @param errors - From {@link validateSchoolDay}.
 * @returns True when any field or period has a message.
 */
export function hasSchoolDayErrors(errors: SchoolDayErrors): boolean {
  return Object.keys(errors.fields).length > 0 || hasPeriodErrors(errors.periods);
}

/**
 * The PATCH body: every field, with `periods` replacing the saved list.
 * `officeHours` is sent only when it differs from what is saved (`null`
 * clears it), so the rest still saves against an API without office hours.
 *
 * @param values - The form.
 * @param saved - The saved settings, to tell whether office hours changed.
 * @returns The body.
 */
export function toAcademicPayload(values: SchoolDayValues, saved?: AcademicSettings): UpdateAcademicSettingsDto {
  const body: UpdateAcademicSettingsDto = {
    timezone: values.timezone,
    schoolDays: values.schoolDays,
    registerCloseTime: values.registerCloseTime,
    registerEditUntil: values.registerEditUntil,
    periods: toPeriodsPayload(values.periods),
  };
  const officeHours = toOfficeHours(values);
  if (!sameOfficeHours(officeHours, saved?.officeHours)) body.officeHours = officeHours;
  return body;
}

/**
 * Whether the form differs from what is saved.
 *
 * @param values - The form.
 * @param settings - The saved settings.
 * @returns True when a save would change something.
 */
export function isSchoolDayDirty(values: SchoolDayValues, settings: AcademicSettings): boolean {
  const saved = toAcademicPayload(toSchoolDayValues(settings), settings);
  // A half-typed pair of office hours counts, so Save stays available to explain it.
  const officeHoursTyped =
    values.officeHoursStart !== (settings.officeHours?.start ?? "") ||
    values.officeHoursEnd !== (settings.officeHours?.end ?? "");
  return officeHoursTyped || JSON.stringify(toAcademicPayload(values, settings)) !== JSON.stringify(saved);
}

/**
 * Picks the API's field messages for the fields outside the bell schedule,
 * including `officeHours.start` / `officeHours.end` (or `officeHours` alone,
 * put on the end time).
 *
 * @param fieldErrors - `ApiError.fieldErrors()`.
 * @returns Messages keyed by form field.
 */
export function mapServerFieldErrors(fieldErrors: Record<string, string>): SchoolDayFieldErrors {
  const fields: SchoolDayFieldErrors = {};
  (["timezone", "schoolDays", "registerCloseTime", "registerEditUntil"] as const).forEach((f) => {
    if (fieldErrors[f]) fields[f] = fieldErrors[f];
  });
  if (fieldErrors["officeHours.start"]) fields.officeHoursStart = fieldErrors["officeHours.start"];
  const end = fieldErrors["officeHours.end"] ?? fieldErrors.officeHours;
  if (end) fields.officeHoursEnd = end;
  return fields;
}
