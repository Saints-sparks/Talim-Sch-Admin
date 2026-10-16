/**
 * Calendar dates: values that name a day rather than a moment.
 *
 * The API stores date-only values (session and term dates, enrollment start
 * and end, fee due dates, leave dates, dates of birth, assessment dates,
 * transcript school dates, `leftAt`, calendar event days) as UTC midnight,
 * e.g. `2025-09-15T00:00:00.000Z`. Formatting that in the viewer's time zone
 * turns 15 September into 14 September anywhere west of Greenwich, so these
 * helpers read the calendar day the server meant and format it in UTC.
 *
 * Instants (message times, "created at", "last seen", notification times) are
 * real moments and stay in the viewer's local time; they do not go through
 * here. See the backend's `docs/history-records-and-transcripts.md` §8.4.
 */

/** A value that may hold a calendar date. */
export type CalendarDateInput = string | Date | null | undefined;

/** `01 Sep 2025`: the default look of a calendar date across the app. */
const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

/** A `YYYY-MM-DD` prefix, with or without a time after it. */
const DAY_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

/**
 * Reads a calendar date as UTC midnight of the day it names.
 *
 * A string starting `YYYY-MM-DD` is read from that prefix, so a bare date from
 * a date input and a stored `…T00:00:00.000Z` both give the same day. Anything
 * else is parsed by `Date` and its UTC day is kept.
 *
 * @param value - An ISO date or timestamp, a `Date`, or nothing.
 * @returns UTC midnight of that day, or `null` when there is no usable date.
 */
export function parseCalendarDate(value: CalendarDateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const match = DAY_PREFIX.exec(value.trim());
    if (match) {
      const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Options for {@link formatCalendarDate}. */
export interface CalendarDateFormat {
  /** What to show when there is no usable date. Defaults to `—`. */
  fallback?: string;
  /** Which parts to show. Defaults to `01 Sep 2025` (day, short month, year). */
  format?: Intl.DateTimeFormatOptions;
  /** The locale. Defaults to `en-GB`. */
  locale?: string;
}

/**
 * Formats a calendar date as the same day for every viewer, whatever their
 * time zone.
 *
 * @param value - An ISO date or timestamp, a `Date`, or nothing.
 * @param options - Fallback, parts and locale.
 * @returns e.g. `15 Sept 2025` for `2025-09-15T00:00:00.000Z`, or the fallback.
 */
export function formatCalendarDate(
  value: CalendarDateInput,
  options: CalendarDateFormat = {}
): string {
  const date = parseCalendarDate(value);
  if (!date) return options.fallback ?? "—";
  return date.toLocaleDateString(options.locale ?? "en-GB", {
    ...(options.format ?? DEFAULT_FORMAT),
    timeZone: "UTC",
  });
}

/**
 * The year a calendar date falls in.
 *
 * @param value - An ISO date or timestamp, a `Date`, or nothing.
 * @returns The year, or `null` when there is no usable date.
 */
export function calendarYear(value: CalendarDateInput): number | null {
  return parseCalendarDate(value)?.getUTCFullYear() ?? null;
}

/**
 * The `YYYY-MM-DD` a date input expects, for a stored calendar date.
 *
 * @param value - An ISO date or timestamp, a `Date`, or nothing.
 * @returns The day, or `""` when there is no usable date.
 */
export function toDateInputValue(value: CalendarDateInput): string {
  const date = parseCalendarDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

/**
 * Today in the viewer's own calendar, as a date input's `YYYY-MM-DD`: the day
 * on the wall where they sit, which is what "today" means in a date picker.
 *
 * @param now - The moment to read; defaults to now.
 * @returns e.g. `2026-10-15`.
 */
export function todayInputValue(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
