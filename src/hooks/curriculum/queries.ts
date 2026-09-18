/**
 * Cached queries and mutations for the curriculum area (subjects, courses and
 * the curriculum content teachers publish).
 *
 * Subjects, courses and classes themselves come from the shared reference
 * hooks in `@/hooks/queries/reference` — never refetch those here. What lives
 * in this file is the curriculum-only data (KPIs, curriculum entries, the
 * teacher dropdown) plus the mutations, each of which invalidates every list
 * it can have changed.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useInvalidateReference } from "@/hooks/queries/reference";
import {
  createCourse,
  createSubject,
  deleteCourseService,
  deleteSubject,
  getCurriculumContents,
  getCurriculumKpis,
  getTeachers,
  updateCourseService,
  updateSubject,
  type CreateCoursePayload,
  type CurriculumContent,
  type CurriculumKpis,
  type SubjectPayload,
  type Teacher,
  type UpdateCoursePayload,
} from "@/app/services/subjects.service";

/**
 * Keys for the curriculum-only resources.
 *
 * These belong in `src/lib/queryKeys.ts` alongside the rest; they live here
 * until that file gains a `curriculum` entry. They follow the same
 * `[resource, schoolId, …]` shape so a school switch clears them too.
 */
export const curriculumKeys = {
  all: ["curriculum"] as const,
  /** Headline numbers for the curriculum dashboard. */
  kpis: (schoolId: string) => ["curriculum", schoolId, "kpis"] as const,
  /** Curriculum entries, optionally narrowed by course / term / teacher. */
  contents: (schoolId: string, filters?: Record<string, unknown>) =>
    ["curriculum", schoolId, "contents", filters ?? {}] as const,
} as const;

/**
 * Curriculum headline numbers.
 *
 * Needs `manage:curriculum`; call it behind a permission check so a sub-admin
 * without it never sees a failed request. It is not retried on a `FORBIDDEN`.
 *
 * @returns Query result; `data` is undefined until it loads.
 */
export function useCurriculumKpis(enabled = true): UseQueryResult<CurriculumKpis> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: curriculumKeys.kpis(schoolId ?? "none"),
    queryFn: getCurriculumKpis,
    enabled: enabled && Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * Curriculum content published across the school.
 *
 * @param filters - Optional course / term / teacher narrowing.
 * @returns Query result; `data` is `[]` until it loads.
 */
export function useCurriculumContents(
  filters: { course?: string; term?: string; teacherId?: string } = {},
): UseQueryResult<CurriculumContent[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: curriculumKeys.contents(schoolId ?? "none", filters),
    queryFn: () => getCurriculumContents(filters),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * Every teacher in the school, for the "assign a teacher" dropdowns.
 *
 * Shares the teachers cache with the staff directory, so opening a course
 * modal after visiting Users → Teachers costs no request.
 *
 * @returns Query result; `data` is `[]` until it loads.
 */
export function useTeacherOptions(): UseQueryResult<Teacher[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.teachers.list(schoolId ?? "none", { all: true }),
    queryFn: getTeachers,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/** Invalidates everything a subject or course change can be visible in. */
function useInvalidateCurriculum() {
  const client = useQueryClient();
  const reference = useInvalidateReference();
  return async () => {
    await Promise.all([
      reference.subjects(),
      reference.courses(),
      client.invalidateQueries({ queryKey: curriculumKeys.all }),
    ]);
  };
}

/**
 * Create, rename and delete subjects.
 *
 * Every mutation invalidates the subjects and courses caches plus the
 * curriculum KPIs, so the dashboard counters and every subject dropdown in the
 * app follow the change.
 *
 * @returns The three mutations, each with `mutateAsync` and `isPending`.
 */
export function useSubjectMutations() {
  const invalidate = useInvalidateCurriculum();

  return {
    create: useMutation({
      mutationFn: (payload: SubjectPayload) => createSubject(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ subjectId, payload }: { subjectId: string; payload: SubjectPayload }) =>
        updateSubject(subjectId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (subjectId: string) => deleteSubject(subjectId),
      onSuccess: invalidate,
    }),
  };
}

/**
 * Create, edit and delete courses.
 *
 * A course belongs to a class, so these also invalidate the class caches —
 * the class detail page lists the same courses.
 *
 * @returns The three mutations, each with `mutateAsync` and `isPending`.
 */
export function useCourseMutations() {
  const client = useQueryClient();
  const invalidateCurriculum = useInvalidateCurriculum();

  const invalidate = async () => {
    await Promise.all([
      invalidateCurriculum(),
      client.invalidateQueries({ queryKey: queryKeys.classes.all }),
    ]);
  };

  return {
    create: useMutation({
      mutationFn: (payload: CreateCoursePayload) => createCourse(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ courseId, payload }: { courseId: string; payload: UpdateCoursePayload }) =>
        updateCourseService(courseId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (courseId: string) => deleteCourseService(courseId),
      onSuccess: invalidate,
    }),
  };
}
