/**
 * The lists the manual-payment form needs, loaded in dependency order.
 *
 * Recording a payment means naming a student and the exact fee assignments it
 * settles, both as Mongo ids. Those ids are picked from real lists here rather
 * than typed: a mistyped id records money against the wrong child, and the
 * server has no way to tell.
 *
 * Keys come from the shared `queryKeys` factory, so these share a cache with
 * the students and fees pages instead of refetching the same rows.
 */
"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { studentService, type Student } from "@/app/services/student.service";
import { getFeeAssignments, type FeeAssignment } from "@/app/services/fees.service";

/** Placeholder key segment used while the session has no school yet. */
const NO_SCHOOL = "none";

/** One page is enough for a class roster; the API caps `limit` at 500. */
const ROSTER_LIMIT = 200;

/**
 * The students in one class.
 *
 * Idle until a class is chosen, so the student select is never populated with
 * a partial or wrong-class list.
 *
 * @param classId - The chosen class, or "" while none is.
 * @returns Query result; `data` is the class roster.
 */
export function useStudentsInClass(classId: string): UseQueryResult<Student[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.students.list(schoolId ?? NO_SCHOOL, { classId, limit: ROSTER_LIMIT }),
    queryFn: async () => (await studentService.getStudentsByClass(classId, 1, ROSTER_LIMIT)).data ?? [],
    enabled: Boolean(schoolId) && Boolean(classId),
    staleTime: staleTimes.list,
  });
}

/**
 * The active fee assignments attached to one class — the fees a payment can
 * actually settle.
 *
 * @param classId - The chosen class, or "" while none is.
 * @returns Query result; `data` is the class's active assignments.
 */
export function useClassFeeAssignments(classId: string): UseQueryResult<FeeAssignment[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.fees.assignments(schoolId ?? NO_SCHOOL, { classId, status: "active" }),
    queryFn: async () =>
      (await getFeeAssignments({ classId, status: "active", limit: 100 })).data ?? [],
    enabled: Boolean(schoolId) && Boolean(classId),
    staleTime: staleTimes.list,
  });
}

/**
 * The display name of a referenced document, for a `Ref<T>` that may or may
 * not have been populated by the server.
 *
 * @param ref - Either the id string or the populated object.
 * @param pick - Reads the label off the populated object.
 * @returns The label, or an em dash when only an id came back.
 */
export function refLabel<T>(ref: string | T, pick: (value: T) => string | undefined): string {
  if (typeof ref === "string" || ref === null || ref === undefined) return "—";
  return pick(ref) ?? "—";
}
