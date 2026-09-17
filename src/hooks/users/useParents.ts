/**
 * Cached parent directory.
 *
 * `GET /parents/school/:schoolId` searches, filters and sorts server-side, so
 * the whole filter set is part of the query key: changing a filter fetches a
 * new page, and going back to a filter you have already used is instant.
 */
"use client";

import { useEffect, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useDebouncedValue } from "@/hooks/users/useDebouncedValue";
import {
  parentService,
  type GetParentsParams,
  type GetParentsResponse,
  type ParentProfileFields,
} from "@/app/services/parent.service";

/**
 * A page of the school's parents, with the dashboard stats.
 *
 * @param params - Page, page size, search text, status, gender and sort order.
 * @returns Query result holding the page, its `meta` and the stats.
 */
export function useParents(params: GetParentsParams): UseQueryResult<GetParentsResponse> {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: queryKeys.parents.list(schoolId ?? "none", params as Record<string, unknown>),
    queryFn: () => parentService.getParentsDashboard(params),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/** Date of birth and gender for each requested user, keyed by user id. */
export type ProfileFieldsByUserId = Record<string, ParentProfileFields>;

/**
 * Date of birth and gender for the selected parent and their children — fields
 * the list endpoint does not include.
 *
 * The requests run in parallel and each one is allowed to fail on its own, so
 * one unreadable profile never blanks the panel.
 *
 * @param userIds - Users to look up; an empty list fetches nothing.
 * @returns The fields found so far, keyed by user id.
 */
export function useParentProfileFields(userIds: string[]): ProfileFieldsByUserId {
  const [cache, setCache] = useState<ProfileFieldsByUserId>({});
  // Query on a stable string so a new array identity alone does not refetch.
  const key = userIds.join(",");

  useEffect(() => {
    const missing = key.split(",").filter((id) => id && !(id in cache));
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map(async (userId) => [userId, await parentService.getUserProfile(userId)] as const),
    ).then((entries) => {
      if (cancelled) return;
      setCache((current) => {
        const next = { ...current };
        for (const [userId, profile] of entries) next[userId] = profile;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
    // `cache` is deliberately not a dependency: it is written by this effect,
    // and the `missing` check already skips ids that have been fetched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return cache;
}

/** The filter state the parents page sends to the API. */
export interface ParentFilters {
  search: string;
  debouncedSearch: string;
  status: NonNullable<GetParentsParams["status"]>;
  gender: NonNullable<GetParentsParams["gender"]>;
  sortBy: NonNullable<GetParentsParams["sortBy"]>;
  page: number;
}

/** What `useParentFilters` returns. */
export interface ParentFilterControls extends ParentFilters {
  /** Sets the search text; the API call waits for the debounce. */
  setSearch: (value: string) => void;
  /** Sets the status filter and returns to page one. */
  setStatus: (value: ParentFilters["status"]) => void;
  /** Sets the gender filter and returns to page one. */
  setGender: (value: ParentFilters["gender"]) => void;
  /** Sets the sort order and returns to page one. */
  setSortBy: (value: ParentFilters["sortBy"]) => void;
  /** Moves to a page. */
  setPage: (value: number) => void;
}

/**
 * Filter and page state for the parents directory, with the search box
 * debounced so typing does not fire a request per keystroke.
 *
 * @returns The filter values and their setters.
 */
export function useParentFilters(): ParentFilterControls {
  const [search, setSearchState] = useState("");
  const [status, setStatusState] = useState<ParentFilters["status"]>("all");
  const [gender, setGenderState] = useState<ParentFilters["gender"]>("all");
  const [sortBy, setSortByState] = useState<ParentFilters["sortBy"]>("az");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  return {
    search,
    debouncedSearch,
    status,
    gender,
    sortBy,
    page,
    setSearch: (value) => {
      setSearchState(value);
      setPage(1);
    },
    setStatus: (value) => {
      setStatusState(value);
      setPage(1);
    },
    setGender: (value) => {
      setGenderState(value);
      setPage(1);
    },
    setSortBy: (value) => {
      setSortByState(value);
      setPage(1);
    },
    setPage,
  };
}
