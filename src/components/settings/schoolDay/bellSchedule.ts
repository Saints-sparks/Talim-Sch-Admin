/**
 * The bell-schedule editor's rules, free of React so they can be tested
 * directly.
 *
 * A period's `key` is what timetable entries point at (`periodKey`), so it is
 * generated once, when a row is added, and never changes afterwards: renaming
 * "Period 1", retiming it, moving it or turning it into a break all keep the
 * key. Rows also carry a local `id` for React; it is never sent.
 *
 * The checks mirror `validatePeriods` in the backend
 * (`src/common/utils/school-periods.ts`): readable times, end after start, no
 * overlap (touching is fine), unique keys. The editor adds two of its own:
 * labels are unique, and rows are listed in time order.
 */
import type { SchoolPeriod, SchoolWeekday } from "@/app/services/school-settings.service";

/** One row of the editor. */
export interface PeriodDraft {
  /** Local row id for React keys and error lookup; never sent. */
  id: string;
  /** Stable key timetable entries point at, e.g. `p1` or `brk`. */
  key: string;
  label: string;
  /** `HH:mm`. */
  startTime: string;
  /** `HH:mm`. */
  endTime: string;
  isBreak: boolean;
}

/** The editable fields of a row. */
export type PeriodField = "label" | "startTime" | "endTime";

/** Messages per row id and field. */
export type PeriodErrors = Record<string, Partial<Record<PeriodField, string>>>;

/** The five days the checkboxes offer, in order. */
export const TEACHING_WEEKDAYS: SchoolWeekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** The API's `HH:mm` pattern (24-hour). */
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Length of a lesson period added with "Add period", in minutes. */
export const DEFAULT_PERIOD_MINUTES = 40;
/** Length of a break added with "Add break", in minutes. */
export const DEFAULT_BREAK_MINUTES = 20;
/** Where the first period of an empty schedule starts. */
export const DEFAULT_DAY_START = "08:00";

let rowCounter = 0;
/** A fresh local row id. */
function nextRowId(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

/**
 * Minutes since midnight for an `HH:mm` time.
 *
 * @param value - The time.
 * @returns The minutes, or null when the time is not `HH:mm`.
 */
export function toMinutes(value: string): number | null {
  if (!HHMM.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/**
 * `HH:mm` for a number of minutes since midnight, capped at 23:59.
 *
 * @param minutes - Minutes since midnight.
 * @returns The time.
 */
export function fromMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Turns the saved periods into editor rows, keeping every key.
 *
 * @param periods - Periods as the API returns them (already in time order).
 * @returns The rows.
 */
export function toDrafts(periods: readonly SchoolPeriod[]): PeriodDraft[] {
  return periods.map((p) => ({
    id: nextRowId(),
    key: p.key,
    label: p.label,
    startTime: p.startTime,
    endTime: p.endTime,
    isBreak: Boolean(p.isBreak),
  }));
}

/**
 * A key no row uses yet: `p1`, `p2`… for periods, `brk`, `brk2`… for breaks.
 * Keys of deleted rows may be reused, since nothing can point at a period
 * that was never saved; saved keys stay on their rows.
 *
 * @param rows - The rows so far.
 * @param isBreak - Whether the new row is a break.
 * @returns The key.
 */
export function generatePeriodKey(rows: readonly Pick<PeriodDraft, "key">[], isBreak: boolean): string {
  const used = new Set(rows.map((r) => r.key));
  if (isBreak) {
    if (!used.has("brk")) return "brk";
    for (let n = 2; ; n += 1) if (!used.has(`brk${n}`)) return `brk${n}`;
  }
  for (let n = 1; ; n += 1) if (!used.has(`p${n}`)) return `p${n}`;
}

/**
 * A label no row uses yet: "Period 3", "Break 2"…
 *
 * @param rows - The rows so far.
 * @param isBreak - Whether the new row is a break.
 * @returns The label.
 */
function nextLabel(rows: readonly PeriodDraft[], isBreak: boolean): string {
  const base = isBreak ? "Break" : "Period";
  const used = new Set(rows.map((r) => r.label.trim().toLowerCase()));
  const count = rows.filter((r) => r.isBreak === isBreak).length;
  if (isBreak && count === 0 && !used.has("break")) return "Break";
  for (let n = count + 1; ; n += 1) {
    const label = `${base} ${n}`;
    if (!used.has(label.toLowerCase())) return label;
  }
}

/**
 * Appends a period or break straight after the last row (or at 08:00 for an
 * empty schedule), with a fresh key and label.
 *
 * @param rows - The rows so far.
 * @param isBreak - Whether to add a break.
 * @returns The new list.
 */
export function addPeriod(rows: readonly PeriodDraft[], isBreak: boolean): PeriodDraft[] {
  const ends = rows.map((r) => toMinutes(r.endTime)).filter((m): m is number => m !== null);
  const start = ends.length ? Math.max(...ends) : (toMinutes(DEFAULT_DAY_START) as number);
  const length = isBreak ? DEFAULT_BREAK_MINUTES : DEFAULT_PERIOD_MINUTES;
  return [
    ...rows,
    {
      id: nextRowId(),
      key: generatePeriodKey(rows, isBreak),
      label: nextLabel(rows, isBreak),
      startTime: fromMinutes(start),
      endTime: fromMinutes(start + length),
      isBreak,
    },
  ];
}

/**
 * Changes one row. The key is never touched.
 *
 * @param rows - The rows.
 * @param id - The row's local id.
 * @param patch - Fields to change.
 * @returns The new list.
 */
export function updatePeriod(
  rows: readonly PeriodDraft[],
  id: string,
  patch: Partial<Pick<PeriodDraft, PeriodField | "isBreak">>
): PeriodDraft[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

/**
 * Removes one row.
 *
 * @param rows - The rows.
 * @param id - The row's local id.
 * @returns The new list.
 */
export function removePeriod(rows: readonly PeriodDraft[], id: string): PeriodDraft[] {
  return rows.filter((r) => r.id !== id);
}

/**
 * Moves a row one place up or down and swaps the two rows' slots in time.
 *
 * The pair keeps the window it had: the row moving earlier starts where the
 * earlier row started, each keeps its own length, and the gap between them is
 * kept — so no other row moves and the list stays in time order. Keys and
 * labels travel with their rows. When either row's times are unreadable the
 * rows are only swapped in the list.
 *
 * @param rows - The rows.
 * @param index - Position of the row to move.
 * @param direction - -1 for up (earlier), 1 for down (later).
 * @returns The new list; the same rows when the move is off either end.
 */
export function movePeriod(rows: readonly PeriodDraft[], index: number, direction: -1 | 1): PeriodDraft[] {
  const other = index + direction;
  if (index < 0 || index >= rows.length || other < 0 || other >= rows.length) return [...rows];
  const firstIndex = Math.min(index, other);
  const first = rows[firstIndex];
  const second = rows[firstIndex + 1];
  const next = [...rows];

  const fs = toMinutes(first.startTime);
  const fe = toMinutes(first.endTime);
  const ss = toMinutes(second.startTime);
  const se = toMinutes(second.endTime);
  if (fs === null || fe === null || ss === null || se === null) {
    next[firstIndex] = second;
    next[firstIndex + 1] = first;
    return next;
  }

  const gap = Math.max(0, ss - fe);
  const secondLength = se - ss;
  const firstLength = fe - fs;
  const movedUp = { ...second, startTime: fromMinutes(fs), endTime: fromMinutes(fs + secondLength) };
  const laterStart = fs + secondLength + gap;
  const movedDown = { ...first, startTime: fromMinutes(laterStart), endTime: fromMinutes(laterStart + firstLength) };
  next[firstIndex] = movedUp;
  next[firstIndex + 1] = movedDown;
  return next;
}

/**
 * The rows in start-time order (stable for equal starts; unreadable times last).
 *
 * @param rows - The rows.
 * @returns A sorted copy.
 */
export function sortByStart(rows: readonly PeriodDraft[]): PeriodDraft[] {
  return rows
    .map((row, index) => ({ row, index, start: toMinutes(row.startTime) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.start - b.start || a.index - b.index)
    .map(({ row }) => row);
}

/**
 * Whether every readable start time is at or after the one above it.
 *
 * @param rows - The rows.
 * @returns True when the list is in time order.
 */
export function isInTimeOrder(rows: readonly PeriodDraft[]): boolean {
  const starts = rows.map((r) => toMinutes(r.startTime)).filter((m): m is number => m !== null);
  return starts.every((m, i) => i === 0 || m >= starts[i - 1]);
}

/**
 * Every problem with the schedule, per row and field.
 *
 * - each label is present, at most 60 characters, and unique (ignoring case);
 * - each time is `HH:mm` and the end is after the start;
 * - a row does not start before the row above it (order);
 * - no row overlaps another (a period may start the minute another ends).
 *
 * @param rows - The rows.
 * @returns Messages keyed by row id; empty when the schedule may be saved.
 */
export function validateBellSchedule(rows: readonly PeriodDraft[]): PeriodErrors {
  const errors: PeriodErrors = {};
  const set = (id: string, field: PeriodField, message: string) => {
    errors[id] = errors[id] ?? {};
    if (!errors[id][field]) errors[id][field] = message;
  };

  const labels = new Map<string, number>();
  rows.forEach((r) => {
    const label = r.label.trim().toLowerCase();
    if (label) labels.set(label, (labels.get(label) ?? 0) + 1);
  });

  const spans: { id: string; label: string; start: number; end: number }[] = [];
  let previousStart: number | null = null;

  rows.forEach((r) => {
    const label = r.label.trim();
    if (!label) set(r.id, "label", "Give this period a name.");
    else if (label.length > 60) set(r.id, "label", "Keep the name to 60 characters or fewer.");
    else if ((labels.get(label.toLowerCase()) ?? 0) > 1) set(r.id, "label", "Another period already has this name.");

    const start = toMinutes(r.startTime);
    const end = toMinutes(r.endTime);
    if (start === null) set(r.id, "startTime", "Set a start time.");
    if (end === null) set(r.id, "endTime", "Set an end time.");
    if (start !== null && end !== null) {
      if (end <= start) set(r.id, "endTime", "The end time must be after the start time.");
      else spans.push({ id: r.id, label: label || "the period above", start, end });
    }
    if (start !== null) {
      if (previousStart !== null && start < previousStart) {
        set(r.id, "startTime", "Starts before the period above. Sort by time or change it.");
      }
      previousStart = start;
    }
  });

  const byStart = [...spans].sort((a, b) => a.start - b.start);
  for (let i = 1; i < byStart.length; i += 1) {
    const prev = byStart[i - 1];
    const cur = byStart[i];
    if (cur.start < prev.end) set(cur.id, "startTime", `Overlaps ${prev.label} (ends ${fromMinutes(prev.end)}).`);
  }
  return errors;
}

/**
 * Whether a validation result holds any problem.
 *
 * @param errors - From {@link validateBellSchedule}.
 * @returns True when at least one field has a message.
 */
export function hasPeriodErrors(errors: PeriodErrors): boolean {
  return Object.values(errors).some((fields) => Object.keys(fields).length > 0);
}

/**
 * The `periods` body for `PATCH /settings/academic`: labels trimmed, keys as
 * they are, local ids dropped.
 *
 * @param rows - The rows.
 * @returns The periods to send.
 */
export function toPeriodsPayload(rows: readonly PeriodDraft[]): SchoolPeriod[] {
  return rows.map((r) => ({
    key: r.key,
    label: r.label.trim(),
    startTime: r.startTime,
    endTime: r.endTime,
    isBreak: r.isBreak,
  }));
}

/**
 * Maps the API's `periods.N.field` validation details onto editor rows.
 *
 * @param rows - The rows that were sent, in the order sent.
 * @param fieldErrors - `ApiError.fieldErrors()`, keyed by dotted path.
 * @returns Messages keyed by row id.
 */
export function mapServerPeriodErrors(
  rows: readonly PeriodDraft[],
  fieldErrors: Record<string, string>
): PeriodErrors {
  const errors: PeriodErrors = {};
  Object.entries(fieldErrors).forEach(([path, message]) => {
    const match = /^periods\.(\d+)\.(\w+)$/.exec(path);
    if (!match) return;
    const row = rows[Number(match[1])];
    if (!row) return;
    const field: PeriodField =
      match[2] === "endTime" ? "endTime" : match[2] === "startTime" ? "startTime" : "label";
    const subject = match[2] === "key" ? "Key" : match[2] === "label" ? "Name" : "Time";
    errors[row.id] = { ...errors[row.id], [field]: `${subject} ${message}` };
  });
  return errors;
}

/** One block of the day preview. */
export interface DaySegment {
  kind: "period" | "break" | "gap";
  label: string;
  startTime: string;
  endTime: string;
  minutes: number;
  /** Share of the whole day, 0–100. */
  percent: number;
}

/**
 * The day as a sequence of periods, breaks and free gaps, for the preview.
 * Rows with unreadable or backwards times are left out.
 *
 * @param rows - The rows.
 * @returns The segments in time order; empty when nothing is readable.
 */
export function previewDay(rows: readonly PeriodDraft[]): DaySegment[] {
  const spans = rows
    .map((r) => ({ r, start: toMinutes(r.startTime), end: toMinutes(r.endTime) }))
    .filter((s): s is { r: PeriodDraft; start: number; end: number } => s.start !== null && s.end !== null && s.end > s.start)
    .sort((a, b) => a.start - b.start);
  if (!spans.length) return [];

  const dayStart = spans[0].start;
  const dayEnd = Math.max(...spans.map((s) => s.end));
  const total = dayEnd - dayStart;
  const segments: DaySegment[] = [];
  let cursor = dayStart;

  const push = (kind: DaySegment["kind"], label: string, start: number, end: number) => {
    if (end <= start) return;
    segments.push({
      kind,
      label,
      startTime: fromMinutes(start),
      endTime: fromMinutes(end),
      minutes: end - start,
      percent: ((end - start) / total) * 100,
    });
  };

  spans.forEach(({ r, start, end }) => {
    if (start > cursor) push("gap", "Free", cursor, start);
    // An overlapping row is drawn from where the previous one ended.
    push(r.isBreak ? "break" : "period", r.label.trim() || (r.isBreak ? "Break" : "Period"), Math.max(start, cursor), end);
    cursor = Math.max(cursor, end);
  });
  return segments;
}

/**
 * Keeps every Saturday/Sunday the school already teaches on while the
 * checkboxes change Monday–Friday, in weekday order.
 *
 * @param current - The school days as loaded.
 * @param day - The weekday toggled.
 * @param checked - Its new state.
 * @returns The new list.
 */
export function toggleSchoolDay(
  current: readonly SchoolWeekday[],
  day: SchoolWeekday,
  checked: boolean
): SchoolWeekday[] {
  const order: SchoolWeekday[] = [...TEACHING_WEEKDAYS, "Saturday", "Sunday"];
  const next = new Set(current);
  if (checked) next.add(day);
  else next.delete(day);
  return order.filter((d) => next.has(d));
}

/**
 * Every IANA timezone the browser knows, with `Africa/Lagos` first. The
 * school's saved zone is included even when the browser does not list it.
 *
 * @param current - The saved timezone, if any.
 * @returns The options, deduplicated.
 */
export function timezoneOptions(current?: string): string[] {
  let zones: string[] = [];
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    zones = intl.supportedValuesOf?.("timeZone") ?? [];
  } catch {
    zones = [];
  }
  if (!zones.length) {
    zones = ["Africa/Accra", "Africa/Cairo", "Africa/Johannesburg", "Africa/Nairobi", "Europe/London", "UTC"];
  }
  const rest = zones.filter((z) => z !== "Africa/Lagos" && z !== current).sort();
  return Array.from(new Set(["Africa/Lagos", ...(current ? [current] : []), ...rest]));
}
