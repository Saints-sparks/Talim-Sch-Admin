/** Cached enrollment lists, one student's history, and the enroll mutation. */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { transitKeys } from "@/hooks/transit/keys";
import {
  createEnrollment,
  getStudentEnrollmentHistory,
  listEnrollments,
  type CreateEnrollmentPayload,
  type EnrollmentFilters,
  type StudentEnrollment,
} from "@/app/services/transit.service";

/**
 * This school's enrollments, filtered by the API.
 *
 * @param filters - Class, academic year and status; each optional.
 * @returns Query result.
 */
export function useEnrollments(filters: EnrollmentFilters): UseQueryResult<StudentEnrollment[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.enrollmentList(schoolId ?? "none", {
      classId: filters.classId || undefined,
      academicYearId: filters.academicYearId || undefined,
      status: filters.status || undefined,
    }),
    queryFn: () =>
      listEnrollments({
        classId: filters.classId || undefined,
        academicYearId: filters.academicYearId || undefined,
        status: filters.status || undefined,
      }),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/**
 * One student's enrollment history, newest first.
 *
 * @param studentId - The student id.
 * @returns Query result.
 */
export function useEnrollmentHistory(studentId: string): UseQueryResult<StudentEnrollment[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.enrollmentHistory(schoolId ?? "none", studentId),
    queryFn: () => getStudentEnrollmentHistory(studentId),
    enabled: Boolean(schoolId && studentId),
    staleTime: staleTimes.list,
  });
}

/**
 * Opens an active enrollment for a student of this school.
 *
 * Invalidates every enrollment list and the dashboard counters, plus the
 * student's own history when one is on screen.
 *
 * @returns Mutation result; `mutateAsync` takes the enrollment payload.
 */
export function useCreateEnrollment(): UseMutationResult<
  StudentEnrollment,
  unknown,
  CreateEnrollmentPayload
> {
  const schoolId = useSchoolId();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEnrollmentPayload) => createEnrollment(payload),
    onSuccess: (_result, payload) => {
      const school = schoolId ?? "none";
      client.invalidateQueries({ queryKey: transitKeys.enrollments(school) });
      client.invalidateQueries({ queryKey: transitKeys.dashboard(school) });
      client.invalidateQueries({
        queryKey: transitKeys.enrollmentHistory(school, payload.studentId),
      });
    },
  });
}
