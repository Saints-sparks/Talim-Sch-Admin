/**
 * Announcement data for the announcements page.
 *
 * The list is server-filtered and server-paginated: the status tab and the
 * search box go into the query string, so the pagination counts match what is
 * on screen and switching tabs does not re-filter a single page in the
 * browser. Each distinct filter is its own cache entry, so going back to a tab
 * is instant and the page never refetches on every mount.
 *
 * Creating an announcement invalidates the whole `announcements` key, which
 * drops every page and the stats card in one go.
 */
"use client";

import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/context/AuthContext";
import {
  createAnnouncement,
  getAnnouncementStatsBySender,
  getAnnouncementsBySender,
  type Announcement,
  type AnnouncementQuery,
  type AnnouncementResponse,
  type AnnouncementStats,
  type CreateAnnouncementResponse,
} from "@/app/services/announcement.service";

/** Stats shown before the real numbers land, so the cards never render `undefined`. */
export const emptyAnnouncementStats: AnnouncementStats = {
  totalAnnouncements: 0,
  published: 0,
  scheduled: 0,
  drafts: 0,
  archived: 0,
  readRate: 0,
  parentEngagement: 0,
  studentEngagement: 0,
  dailyViews: [],
  weeklyChange: { totalAnnouncements: 0, published: 0, scheduled: 0, drafts: 0 },
};

/**
 * The signed-in administrator's user id — announcements are keyed by sender.
 *
 * @returns The user id, or `""` while the session is still loading.
 */
export function useSenderId(): string {
  return useAuth().user?.userId ?? "";
}

/**
 * Delays a fast-changing value, so typing in the search box costs one request
 * instead of one per keystroke.
 *
 * @param value - The live value.
 * @param delayMs - How long the value must hold still. Default 350 ms.
 * @returns The value as it was `delayMs` ago.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * One page of the administrator's own announcements.
 *
 * @param query - Page, page size, status tab and search term.
 * @returns Query result; `data` is undefined until the first page lands.
 */
export function useAnnouncements(query: AnnouncementQuery): UseQueryResult<AnnouncementResponse> {
  const schoolId = useSchoolId();
  const senderId = useSenderId();

  return useQuery({
    queryKey: queryKeys.announcements.list(schoolId ?? "none", { senderId, ...query }),
    queryFn: () => getAnnouncementsBySender(senderId, query),
    enabled: Boolean(schoolId && senderId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/**
 * Counters and engagement rates for the administrator's announcements.
 *
 * @returns Query result; `data` falls back to zeroed stats while loading.
 */
export function useAnnouncementStats(): UseQueryResult<AnnouncementStats> {
  const schoolId = useSchoolId();
  const senderId = useSenderId();

  return useQuery({
    queryKey: [...queryKeys.announcements.list(schoolId ?? "none", { senderId }), "stats"],
    queryFn: () => getAnnouncementStatsBySender(senderId),
    enabled: Boolean(schoolId && senderId),
    staleTime: staleTimes.list,
  });
}

/**
 * Publishes, schedules or drafts an announcement.
 *
 * @returns Mutation whose success drops every cached announcement page and
 *   the stats card.
 */
export function useCreateAnnouncement(): UseMutationResult<CreateAnnouncementResponse, Error, Announcement> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.announcements.all }),
  });
}
