/**
 * The School Day & Bells form as a whole: its values, the checks beyond the
 * bell schedule, and the `PATCH /settings/academic` body.
 */
import type {
  AcademicSettings,
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
}

/** Messages for the fields outside the bell schedule. */
export type SchoolDayFieldErrors = Partial<
  Record<"timezone" | "schoolDays" | "registerCloseTime" | "registerEditUntil", string>
>;

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
  };
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
 *
 * @param values - The form.
 * @returns The body.
 */
export function toAcademicPayload(values: SchoolDayValues): UpdateAcademicSettingsDto {
  return {
    timezone: values.timezone,
    schoolDays: values.schoolDays,
    registerCloseTime: values.registerCloseTime,
    registerEditUntil: values.registerEditUntil,
    periods: toPeriodsPayload(values.periods),
  };
}

/**
 * Whether the form differs from what is saved.
 *
 * @param values - The form.
 * @param settings - The saved settings.
 * @returns True when a save would change something.
 */
export function isSchoolDayDirty(values: SchoolDayValues, settings: AcademicSettings): boolean {
  const saved = toAcademicPayload(toSchoolDayValues(settings));
  return JSON.stringify(toAcademicPayload(values)) !== JSON.stringify(saved);
}
