/**
 * The school calendar's rules, free of React: the event form's checks and
 * payloads, the term window the list shows, and grouping by month.
 *
 * The checks mirror `CreateCalendarEventDto` and `CalendarEventService`:
 * a title of 1–120 characters, one of three types, real `YYYY-MM-DD` days with
 * the end on or after the start, and an `HH:mm` "ends at" for an early close
 * only.
 */
import type { CalendarEvent, CalendarEventType } from "@/app/services/calendar-events.service";
import type { CreateCalendarEventPayload, UpdateCalendarEventPayload } from "@/types/apiPayloads";

/** What the dialog holds. */
export interface CalendarFormValues {
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  endsAt: string;
}

/** Messages per field. */
export type CalendarFormErrors = Partial<Record<keyof CalendarFormValues, string>>;

/** The three kinds of event, with their labels, in the order the form lists them. */
export const EVENT_TYPES: { value: CalendarEventType; label: string; hint: string }[] = [
  { value: "holiday", label: "Holiday", hint: "No lessons on these days." },
  { value: "event", label: "Event", hint: "Shown on teachers' calendars; lessons go ahead." },
  { value: "early_close", label: "Early close", hint: "Lessons starting at or after the closing time are cancelled." },
];

/** The label for an event type. */
export function eventTypeLabel(type: CalendarEventType): string {
  return EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Whether a string is a real calendar day (`2026-02-30` is not).
 *
 * @param value - The string.
 * @returns True for a real `YYYY-MM-DD` day.
 */
export function isRealDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * An empty form, starting on `day`.
 *
 * @param day - The default start and end day, `YYYY-MM-DD`.
 * @returns The values.
 */
export function emptyCalendarForm(day = ""): CalendarFormValues {
  return { title: "", type: "holiday", startDate: day, endDate: day, endsAt: "" };
}

/**
 * The form for an existing event.
 *
 * @param event - The event.
 * @returns The values.
 */
export function toCalendarForm(event: CalendarEvent): CalendarFormValues {
  return {
    title: event.title,
    type: event.type,
    startDate: event.startDate,
    endDate: event.endDate,
    endsAt: event.endsAt ?? "",
  };
}

/**
 * Checks the form.
 *
 * @param values - The form.
 * @returns A message per invalid field; empty when it may be sent.
 */
export function validateCalendarForm(values: CalendarFormValues): CalendarFormErrors {
  const errors: CalendarFormErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = "Give the event a title.";
  else if (title.length > 120) errors.title = "Keep the title to 120 characters or fewer.";

  if (!EVENT_TYPES.some((t) => t.value === values.type)) errors.type = "Choose a type.";

  if (!values.startDate) errors.startDate = "Choose the first day.";
  else if (!isRealDay(values.startDate)) errors.startDate = "Enter a real date.";

  if (values.endDate) {
    if (!isRealDay(values.endDate)) errors.endDate = "Enter a real date.";
    else if (isRealDay(values.startDate) && values.endDate < values.startDate) {
      errors.endDate = "The last day can't be before the first day.";
    }
  }

  if (values.type === "early_close") {
    if (!values.endsAt) errors.endsAt = "Set the time school closes.";
    else if (!HHMM.test(values.endsAt)) errors.endsAt = "Use a 24-hour time such as 12:30.";
  }
  return errors;
}

/**
 * The `POST /calendar-events` body. `endDate` defaults to the start; `endsAt`
 * is only sent for an early close.
 *
 * @param values - A valid form.
 * @param termId - The term the event falls in, when known.
 * @returns The body.
 */
export function toCreateEventPayload(values: CalendarFormValues, termId?: string): CreateCalendarEventPayload {
  return {
    title: values.title.trim(),
    type: values.type,
    startDate: values.startDate,
    endDate: values.endDate || values.startDate,
    ...(values.type === "early_close" ? { endsAt: values.endsAt } : {}),
    ...(termId ? { termId } : {}),
  };
}

/**
 * The `PATCH /calendar-events/:id` body: every field, so the saved event is
 * exactly the form. `endsAt` goes only with an early close (the API clears it
 * for the other types), and `termId` is never sent as null.
 *
 * @param values - A valid form.
 * @param termId - The term the event falls in, when known.
 * @returns The body.
 */
export function toUpdateEventPayload(values: CalendarFormValues, termId?: string): UpdateCalendarEventPayload {
  return toCreateEventPayload(values, termId);
}

/** A term, reduced to what the calendar needs. */
export interface TermWindow {
  id: string;
  name: string;
  /** `YYYY-MM-DD`. */
  start: string;
  /** `YYYY-MM-DD`, inclusive. */
  end: string;
  isCurrent: boolean;
}

/**
 * The term containing `day`, if any.
 *
 * @param terms - The school's terms.
 * @param day - `YYYY-MM-DD`.
 * @returns The term's id, or undefined.
 */
export function termIdFor(terms: readonly TermWindow[], day: string): string | undefined {
  return terms.find((t) => t.start <= day && day <= t.end)?.id;
}

/** Events that start in one month. */
export interface MonthGroup {
  /** `YYYY-MM`. */
  key: string;
  /** "October 2026". */
  label: string;
  events: CalendarEvent[];
}

/**
 * Groups events by the month they start in, months and events in date order.
 *
 * @param events - The events.
 * @returns One group per month that has an event.
 */
export function groupByMonth(events: readonly CalendarEvent[]): MonthGroup[] {
  const sorted = [...events].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate) || a.title.localeCompare(b.title)
  );
  const groups = new Map<string, CalendarEvent[]>();
  sorted.forEach((e) => {
    const key = e.startDate.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  });
  return Array.from(groups.entries()).map(([key, list]) => ({
    key,
    label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    events: list,
  }));
}

/**
 * A short date range: "Mon 6 Oct", or "Mon 6 – Wed 8 Oct" / "Mon 29 Sep – Fri 3 Oct".
 *
 * @param start - `YYYY-MM-DD`.
 * @param end - `YYYY-MM-DD`, inclusive.
 * @returns The label.
 */
export function formatEventRange(start: string, end: string): string {
  const fmt = (day: string, withMonth: boolean) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      ...(withMonth ? { month: "short" } : {}),
      timeZone: "UTC",
    });
  if (!end || end === start) return fmt(start, true);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return `${fmt(start, !sameMonth)} – ${fmt(end, true)}`;
}

/**
 * Number of days an event covers, inclusive.
 *
 * @param start - `YYYY-MM-DD`.
 * @param end - `YYYY-MM-DD`.
 * @returns At least 1.
 */
export function eventDayCount(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.max(1, Math.round(ms / 86_400_000) + 1) : 1;
}
