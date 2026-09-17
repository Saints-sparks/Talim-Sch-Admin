/**
 * Cached reference data — the lists nearly every page needs (classes, academic
 * years, terms, subjects, courses).
 *
 * These change a few times a term, so they are fetched once and shared between
 * pages instead of being refetched by every `useEffect` that needs a dropdown.
 * Keys carry the school id, so signing into another school never reuses them.
 *
 * Mutations that change these lists must invalidate them — use
 * `useInvalidateReference()` rather than refetching by hand.
 */
"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { getClasses, type Class } from "@/app/services/school.service";
import {
  getAcademicYears,
  getTerms,
  type AcademicYearResponse,
  type TermResponse,
} from "@/app/services/academic.service";
import { getCoursesBySchool, getSubjectsWithCourses, type Course, type Subject } from "@/app/services/subjects.service";

/**
 * The school's classes.
 *
 * @returns Query result; `data` is `[]` until it loads.
 */
export function useClasses(): UseQueryResult<Class[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.classes.list(schoolId ?? "none"),
    queryFn: getClasses,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * The school's academic years, newest first as the API returns them.
 *
 * @returns Query result.
 */
export function useAcademicYears(): UseQueryResult<AcademicYearResponse[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.academic.years(schoolId ?? "none"),
    queryFn: getAcademicYears,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * The school's terms.
 *
 * @returns Query result.
 */
export function useTerms(): UseQueryResult<TermResponse[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.academic.terms(schoolId ?? "none"),
    queryFn: getTerms,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * Every course in the school.
 *
 * @returns Query result.
 */
export function useCourses(): UseQueryResult<Course[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.courses.bySchool(schoolId ?? "none"),
    queryFn: getCoursesBySchool,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * Subjects with their courses attached.
 *
 * @returns Query result.
 */
export function useSubjects(): UseQueryResult<Subject[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.subjects.list(schoolId ?? "none"),
    queryFn: getSubjectsWithCourses,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * Invalidators for the reference lists — call the matching one after a
 * mutation so every page showing that list picks the change up.
 *
 * @returns An object of invalidate functions.
 */
export function useInvalidateReference() {
  const client = useQueryClient();
  const invalidate = (key: readonly unknown[]) => client.invalidateQueries({ queryKey: key });
  return {
    /** After creating, renaming or deleting a class. */
    classes: () => invalidate(queryKeys.classes.all),
    /** After changing academic years or the current one. */
    academicYears: () => invalidate(queryKeys.academic.all),
    /** After creating a term or switching the current term. */
    terms: () => invalidate(queryKeys.academic.all),
    /** After creating or editing a course. */
    courses: () => invalidate(queryKeys.courses.all),
    /** After creating or editing a subject. */
    subjects: () => invalidate(queryKeys.subjects.all),
  };
}
