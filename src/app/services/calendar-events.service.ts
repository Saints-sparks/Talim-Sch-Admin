/**
 * School calendar API (`/calendar-events`): holidays, events and early closes.
 *
 * Any signed-in member of the school may read; school admins and sub-admins
 * write (no extra permission). A holiday cancels every lesson of its days, an
 * early close cancels lessons starting at or after `endsAt`; teachers see both
 * on their Today and Timetable screens.
 *
 * Dates are `YYYY-MM-DD` school days, `endDate` inclusive. Every function
 * throws `ApiError`; other schools' ids answer `NOT_FOUND`.
 */
import { api } from "@/lib/apiClient";
import type { Schema } from "@/types/apiContract";
import type { CreateCalendarEventPayload, UpdateCalendarEventPayload } from "@/types/apiPayloads";

/** One event as the API returns it. */
export type CalendarEvent = Schema<"CalendarEventDto">;
/** `holiday`, `event` or `early_close`. */
export type CalendarEventType = CalendarEvent["type"];

const BASE = "/calendar-events";

/**
 * Events overlapping `[from, to]`, by start date.
 *
 * @param range.from - First day, `YYYY-MM-DD`; omit for no lower bound.
 * @param range.to - Last day (inclusive); omit for no upper bound.
 * @returns The events (an empty list when there are none).
 * @throws `ApiError` when the request fails.
 */
export const listCalendarEvents = async (range: { from?: string; to?: string } = {}): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  const qs = params.toString();
  const body = await api.get<CalendarEvent[] | null>(qs ? `${BASE}?${qs}` : BASE);
  return Array.isArray(body) ? body : [];
};

/**
 * Adds an event.
 *
 * @param payload - Title, type, days and (for an early close) `endsAt`.
 * @returns The created event.
 * @throws `ApiError` — `VALIDATION_FAILED` for a bad day, an end before the
 *   start, or an early close without `endsAt`.
 */
export const createCalendarEvent = async (payload: CreateCalendarEventPayload): Promise<CalendarEvent> =>
  api.post<CalendarEvent>(BASE, payload);

/**
 * Changes an event.
 *
 * @param id - The event.
 * @param payload - Fields to change.
 * @returns The saved event.
 * @throws `ApiError` — as {@link createCalendarEvent}, or `NOT_FOUND`.
 */
export const updateCalendarEvent = async (id: string, payload: UpdateCalendarEventPayload): Promise<CalendarEvent> =>
  api.patch<CalendarEvent>(`${BASE}/${encodeURIComponent(id)}`, payload);

/**
 * Deletes an event.
 *
 * @param id - The event.
 * @throws `ApiError` — `NOT_FOUND` when it is already gone.
 */
export const deleteCalendarEvent = async (id: string): Promise<void> => {
  await api.delete<unknown>(`${BASE}/${encodeURIComponent(id)}`);
};
