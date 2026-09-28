/**
 * The school calendar: events in a date range, and the writes that change it.
 * Every write refreshes every cached range of the school, since one event can
 * sit in several.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
  type CalendarEvent,
} from "@/app/services/calendar-events.service";
import type { CreateCalendarEventPayload, UpdateCalendarEventPayload } from "@/types/apiPayloads";

/**
 * Events overlapping `[from, to]`.
 *
 * @param from - First day, `YYYY-MM-DD` ("" for no bound).
 * @param to - Last day, `YYYY-MM-DD` ("" for no bound).
 * @param options.enabled - Set false to wait (e.g. terms still loading).
 * @returns Query result.
 */
export function useCalendarEvents(
  from: string,
  to: string,
  options: { enabled?: boolean } = {}
): UseQueryResult<CalendarEvent[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.calendarEvents.range(schoolId ?? "none", from, to),
    queryFn: () => listCalendarEvents({ from: from || undefined, to: to || undefined }),
    enabled: Boolean(schoolId) && options.enabled !== false,
    staleTime: staleTimes.list,
  });
}

/**
 * Create, update and delete, each toasting its outcome. The promises reject
 * with the `ApiError` so a form can point at the field the API refused.
 *
 * @returns The three actions and their pending flags.
 */
export function useCalendarEventActions() {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const invalidate = () =>
    client.invalidateQueries({ queryKey: queryKeys.calendarEvents.school(schoolId ?? "none") });

  const create = useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) => createCalendarEvent(payload),
    onSuccess: (event) => {
      toast.success(`${event.title} added to the calendar`);
      void invalidate();
    },
    onError: (err) => {
      logger.error("calendar", "create failed", err);
      toast.error(getErrorMessage(err, "Failed to add the event"));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCalendarEventPayload }) =>
      updateCalendarEvent(id, payload),
    onSuccess: () => {
      toast.success("Event updated");
      void invalidate();
    },
    onError: (err) => {
      logger.error("calendar", "update failed", err);
      toast.error(getErrorMessage(err, "Failed to update the event"));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      toast.success("Event deleted");
      void invalidate();
    },
    onError: (err) => {
      logger.error("calendar", "delete failed", err);
      toast.error(getErrorMessage(err, "Failed to delete the event"));
    },
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    saving: create.isPending || update.isPending,
    deleting: remove.isPending,
  };
}
