/**
 * Marking a student as left (graduated, withdrawn, left Talim) and
 * reinstating one (history-records-and-transcripts §4), from the profile.
 */
"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { useSchoolId } from "@/hooks/useSchoolId";
import { transitKeys } from "@/hooks/transit/keys";
import {
  leaveStudent,
  reinstateStudent,
  type LeaveStudentPayload,
  type ReinstateStudentPayload,
  type StudentStatusChange,
} from "@/app/services/transit.service";

/** Arguments for {@link useLeaveStudent}. */
export interface LeaveStudentInput {
  studentId: string;
  payload: LeaveStudentPayload;
}

/** Arguments for {@link useReinstateStudent}. */
export interface ReinstateStudentInput {
  studentId: string;
  payload: ReinstateStudentPayload;
}

/**
 * The words for a refused leave or reinstate: the two 409s by their top-level
 * code, everything else by the server's message.
 *
 * @param err - What the call threw.
 * @param fallback - Used when the error carries no usable message.
 * @returns A sentence for the admin.
 */
export function standingErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.meta.code === "STUDENT_NOT_ACTIVE") {
      return "This student has already left the school. Reload the page to see their current status.";
    }
    if (err.meta.code === "STUDENT_NOT_WITHDRAWN") {
      return "Only a student who withdrew or left Talim can be reinstated. A graduate stays a graduate, and an active student is already on the roster.";
    }
  }
  return getErrorMessage(err, fallback);
}

/**
 * Refreshes what a standing change touches: the student, their transcript,
 * the rosters and the enrollment lists.
 *
 * @returns Called with the student id after a change.
 */
function useStandingInvalidation() {
  const client = useQueryClient();
  const schoolId = useSchoolId() ?? "none";
  return (studentId: string) => {
    void client.invalidateQueries({ queryKey: queryKeys.students.detail(schoolId, studentId) });
    void client.invalidateQueries({ queryKey: queryKeys.students.all });
    void client.invalidateQueries({ queryKey: queryKeys.classes.all });
    void client.invalidateQueries({ queryKey: transitKeys.enrollments(schoolId) });
    void client.invalidateQueries({ queryKey: transitKeys.dashboard(schoolId) });
  };
}

/**
 * Marks a student as graduated, withdrawn or left Talim.
 *
 * @returns Mutation resolving to the student's new standing.
 */
export function useLeaveStudent(): UseMutationResult<
  StudentStatusChange,
  Error,
  LeaveStudentInput
> {
  const refresh = useStandingInvalidation();
  return useMutation({
    mutationFn: ({ studentId, payload }: LeaveStudentInput) => leaveStudent(studentId, payload),
    onSuccess: (_data, { studentId }) => refresh(studentId),
  });
}

/**
 * Puts a withdrawn (or left-Talim) student back on the roster in a class.
 *
 * @returns Mutation resolving to the student's new standing.
 */
export function useReinstateStudent(): UseMutationResult<
  StudentStatusChange,
  Error,
  ReinstateStudentInput
> {
  const refresh = useStandingInvalidation();
  return useMutation({
    mutationFn: ({ studentId, payload }: ReinstateStudentInput) =>
      reinstateStudent(studentId, payload),
    onSuccess: (_data, { studentId }) => refresh(studentId),
  });
}
