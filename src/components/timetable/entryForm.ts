/**
 * The "Add Entry" form's rules, free of React: which periods may be picked,
 * how picking one fills the times, when an edited time turns the slot into a
 * custom one, and the `POST /timetable` fields the form sends.
 *
 * A period is sent as `periodKey` together with its times; once the times no
 * longer match the chosen period the key is dropped, so the API never stores
 * a key that disagrees with the entry's times.
 */
import type { SchoolPeriod } from "@/app/services/school-settings.service";
import type { TimetableDay } from "@/app/services/timetable.service";

/** The dialog's form state. `periodKey` "" means a custom time. */
export interface EntryFormValues {
  courseId: string;
  day: string;
  startTime: string;
  endTime: string;
  periodKey?: string;
  room?: string;
}

/** The fields the dialog hands back, ready for `POST /timetable` (minus the class). */
export interface EntrySubmitValues {
  courseId: string;
  day: TimetableDay;
  startTime: string;
  endTime: string;
  room?: string;
  periodKey?: string;
}

/** An empty form. */
export const EMPTY_ENTRY_FORM: EntryFormValues = {
  courseId: "",
  day: "",
  startTime: "",
  endTime: "",
  periodKey: "",
  room: "",
};

/** Longest room name the API accepts. */
export const ROOM_MAX_LENGTH = 60;

/**
 * The periods a lesson may be placed in: breaks cannot hold lessons.
 *
 * @param periods - The school's bell schedule.
 * @returns Its lesson periods, in time order.
 */
export function lessonPeriods(periods: readonly SchoolPeriod[] | undefined): SchoolPeriod[] {
  return (periods ?? []).filter((p) => !p.isBreak);
}

/**
 * Picks a period (or "Custom time" with `""`).
 *
 * @param values - The form.
 * @param periodKey - The chosen key, or "" for a custom time.
 * @param periods - The school's bell schedule.
 * @returns The form with the period's times filled in; a custom time keeps
 *   whatever times were already there.
 */
export function choosePeriod(
  values: EntryFormValues,
  periodKey: string,
  periods: readonly SchoolPeriod[] | undefined
): EntryFormValues {
  const period = lessonPeriods(periods).find((p) => p.key === periodKey);
  if (!period) return { ...values, periodKey: "" };
  return { ...values, periodKey: period.key, startTime: period.startTime, endTime: period.endTime };
}

/**
 * Changes a start or end time. When the times stop matching the chosen
 * period, the slot becomes a custom one.
 *
 * @param values - The form.
 * @param field - Which time changed.
 * @param value - The new `HH:mm`.
 * @param periods - The school's bell schedule.
 * @returns The new form.
 */
export function editTime(
  values: EntryFormValues,
  field: "startTime" | "endTime",
  value: string,
  periods: readonly SchoolPeriod[] | undefined
): EntryFormValues {
  const next = { ...values, [field]: value };
  if (!next.periodKey) return next;
  const period = lessonPeriods(periods).find((p) => p.key === next.periodKey);
  const stillMatches = period && period.startTime === next.startTime && period.endTime === next.endTime;
  return stillMatches ? next : { ...next, periodKey: "" };
}

/**
 * The period whose times are exactly `start`–`end`, if any. Used to label a
 * custom slot that happens to line up with a period.
 *
 * @param periods - The school's bell schedule.
 * @param start - `HH:mm`.
 * @param end - `HH:mm`.
 * @returns The period, or undefined.
 */
export function periodAt(
  periods: readonly SchoolPeriod[] | undefined,
  start: string,
  end: string
): SchoolPeriod | undefined {
  return lessonPeriods(periods).find((p) => p.startTime === start && p.endTime === end);
}

/**
 * The client-side half of the DTO's validation.
 *
 * @param values - What the form currently holds.
 * @returns A message per invalid field; empty when the form may be sent.
 */
export function validateEntryForm(values: EntryFormValues): Partial<Record<keyof EntryFormValues, string>> {
  const errors: Partial<Record<keyof EntryFormValues, string>> = {};
  if (!values.courseId) errors.courseId = "Choose the course to schedule.";
  if (!values.day) errors.day = "Choose a day.";
  if (!values.startTime) errors.startTime = "Set a start time.";
  if (!values.endTime) errors.endTime = "Set an end time.";
  if (values.startTime && values.endTime && values.endTime <= values.startTime) {
    errors.endTime = "The end time must be after the start time.";
  }
  if ((values.room ?? "").trim().length > ROOM_MAX_LENGTH) {
    errors.room = `Keep the room to ${ROOM_MAX_LENGTH} characters or fewer.`;
  }
  return errors;
}

/**
 * What the dialog submits: the times always, the room when one was typed
 * (trimmed), and the period key only while the times still match it.
 *
 * @param values - A valid form.
 * @returns The fields to send.
 */
export function toEntrySubmit(values: EntryFormValues): EntrySubmitValues {
  const room = (values.room ?? "").trim();
  return {
    courseId: values.courseId,
    day: values.day as TimetableDay,
    startTime: values.startTime,
    endTime: values.endTime,
    ...(room ? { room } : {}),
    ...(values.periodKey ? { periodKey: values.periodKey } : {}),
  };
}
