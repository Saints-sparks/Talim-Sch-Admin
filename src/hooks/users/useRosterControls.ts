/**
 * The filter/pagination state the people rosters share.
 *
 * Keeping it here means the student and teacher pages agree on the rules that
 * are easy to get wrong: the search box is debounced, and every filter change
 * returns to page one so the list can never land on a page that no longer
 * exists.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/users/useDebouncedValue";

/** Status values the roster filters use; `""` means "any status". */
export type RosterStatusFilter = "" | "active" | "inactive";

/**
 * Everything a roster page needs to drive its filters and pagination.
 *
 * @typeParam S - The status values the page's filter offers (`""` is "any").
 */
export interface RosterControls<S extends string = RosterStatusFilter> {
  /** Raw search text, bound to the input. */
  search: string;
  /** Search text after the debounce — use this for filtering and query keys. */
  debouncedSearch: string;
  /** Sets the search text and returns to page one. */
  setSearch: (value: string) => void;
  /** Selected status. */
  status: S;
  /** Sets the status and returns to page one. */
  setStatus: (value: S) => void;
  /** Selected class id, or `null` for all classes. */
  classId: string | null;
  /** Sets the class and returns to page one. */
  setClassId: (value: string | null) => void;
  /** 1-based page number. */
  page: number;
  /** Moves to a page. */
  setPage: (value: number) => void;
  /** Rows per page. */
  pageSize: number;
  /** Changes the page size and returns to page one. */
  setPageSize: (value: number) => void;
  /** True when a search term or status is narrowing the list. */
  isFiltering: boolean;
  /** True when any filter at all is set, including the class filter. */
  hasAnyFilter: boolean;
  /** Clears every filter and returns to page one. */
  reset: () => void;
}

/**
 * Filter and pagination state for a roster page.
 *
 * @typeParam S - The status values the page's filter offers; the people
 *   rosters use `RosterStatusFilter`, the students roster its own (graduated,
 *   withdrawn ...). `""` always means "any status".
 * @param initialPageSize - Rows per page before the user changes it. Default 9.
 * @returns The controls, ready to bind to `RosterFilters` and `RosterPagination`.
 */
export function useRosterControls<S extends string = RosterStatusFilter>(
  initialPageSize = 9
): RosterControls<S> {
  const [search, setSearchState] = useState("");
  const [status, setStatusState] = useState<S>("" as S);
  const [classId, setClassIdState] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const debouncedSearch = useDebouncedValue(search, 300);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setStatus = useCallback((value: S) => {
    setStatusState(value);
    setPage(1);
  }, []);

  const setClassId = useCallback((value: string | null) => {
    setClassIdState(value);
    setPage(1);
  }, []);

  const setPageSize = useCallback((value: number) => {
    setPageSizeState(value);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setSearchState("");
    setStatusState("" as S);
    setClassIdState(null);
    setPage(1);
  }, []);

  const isFiltering = debouncedSearch.trim() !== "" || status !== "";

  return useMemo(
    () => ({
      search,
      debouncedSearch,
      setSearch,
      status,
      setStatus,
      classId,
      setClassId,
      page,
      setPage,
      pageSize,
      setPageSize,
      isFiltering,
      hasAnyFilter: isFiltering || classId !== null,
      reset,
    }),
    [
      search,
      debouncedSearch,
      setSearch,
      status,
      setStatus,
      classId,
      setClassId,
      page,
      pageSize,
      setPageSize,
      isFiltering,
      reset,
    ]
  );
}
