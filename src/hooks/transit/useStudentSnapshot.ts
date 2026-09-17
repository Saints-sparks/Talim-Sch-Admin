/** A student's academic snapshot and the school search, both used by the wizards. */
"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { transitKeys } from "@/hooks/transit/keys";
import {
  getStudentSnapshot,
  searchSchools,
  type SearchSchoolResult,
  type StudentSnapshot,
} from "@/app/services/transit.service";

/** Shortest search text that is worth a request. */
const MIN_SEARCH_LENGTH = 2;

/**
 * A student's live academic snapshot.
 *
 * Only fetched for a student this school may see — its own, or one another
 * school has released. Pass `enabled: false` anywhere the record has not been
 * released, so the page never asks for data it is not entitled to.
 *
 * @param studentId - The student id, or `null` when none is chosen.
 * @param enabled - Whether this school may read the record.
 * @returns Query result.
 */
export function useStudentSnapshot(
  studentId: string | null,
  enabled = true
): UseQueryResult<StudentSnapshot> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.snapshot(schoolId ?? "none", studentId ?? "none"),
    queryFn: () => getStudentSnapshot(studentId as string),
    enabled: Boolean(schoolId && studentId && enabled),
    staleTime: staleTimes.list,
    retry: false,
  });
}

/**
 * Searches Talim schools by name.
 *
 * @param query - The search text; anything shorter than two characters is ignored.
 * @returns Query result; `data` is `[]` for a query that is too short.
 */
export function useSchoolSearch(query: string): UseQueryResult<SearchSchoolResult[]> {
  const trimmed = query.trim();
  return useQuery({
    queryKey: transitKeys.schoolSearch(trimmed),
    queryFn: () => searchSchools(trimmed),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    staleTime: staleTimes.reference,
  });
}
