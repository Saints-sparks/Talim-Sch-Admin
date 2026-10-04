"use client";

/**
 * Cached queries and mutations for the class screens.
 *
 * The class *list* is shared reference data — use `useClasses()` from
 * `@/hooks/queries/reference` for it. What lives here is the single-class
 * detail (which carries the populated teacher and courses the list does not)
 * and the three writes, each of which invalidates every list the change is
 * visible in.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useInvalidateReference } from "@/hooks/queries/reference";
import {
  assignTeacherToClass,
  createClass,
  getClass,
  updateClass,
} from "@/app/services/student.service";
import type { ClassDetail, ClassPayload } from "@/components/classes/class.model";

/**
 * One class with its teacher and courses.
 *
 * @param classId - The class to load; the query stays idle without one.
 * @returns Query result; `data` is undefined until it loads.
 */
export function useClassDetail(classId: string | undefined): UseQueryResult<ClassDetail> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.classes.detail(schoolId ?? "none", classId ?? "none"),
    // The service returns the populated class; `ClassDetail` names the fields
    // these screens read from it.
    queryFn: () => getClass(classId as string) as unknown as Promise<ClassDetail>,
    enabled: Boolean(schoolId && classId),
    staleTime: staleTimes.list,
  });
}

/**
 * Create a class, edit one, and assign its class teacher.
 *
 * Assigning a teacher is an authorization change, not just a label: the server
 * detaches the previous class teacher — which is what grants them grading and
 * attendance access to the class — so the teacher caches are invalidated
 * alongside the class ones.
 *
 * @param classId - The class the update and assign mutations act on.
 * @returns The three mutations, each with `mutateAsync` and `isPending`.
 */
export function useClassMutations(classId?: string) {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const reference = useInvalidateReference();

  const invalidateClass = async () => {
    await Promise.all([
      reference.classes(),
      classId
        ? client.invalidateQueries({
            queryKey: queryKeys.classes.detail(schoolId ?? "none", classId),
          })
        : Promise.resolve(),
    ]);
  };

  return {
    create: useMutation({
      mutationFn: (payload: ClassPayload) => createClass(payload),
      onSuccess: () => reference.classes(),
    }),
    update: useMutation({
      mutationFn: (payload: ClassPayload) => updateClass(classId as string, payload),
      onSuccess: invalidateClass,
    }),
    assignTeacher: useMutation({
      /** @param teacherUserId - The teacher's *user* id; the API resolves the profile. */
      mutationFn: (teacherUserId: string) =>
        assignTeacherToClass(classId as string, teacherUserId),
      onSuccess: async () => {
        await Promise.all([
          invalidateClass(),
          client.invalidateQueries({ queryKey: queryKeys.teachers.all }),
        ]);
      },
    }),
  };
}

/** What {@link useAssignClassTeacher} takes. */
export interface AssignClassTeacherInput {
  /** The class whose class teacher changes. */
  classId: string;
  /** The teacher's *user* id; the API resolves the profile. */
  teacherUserId: string;
}

/**
 * Makes a teacher the class teacher of a class from anywhere (the teacher
 * editor as well as the class editor). It goes through
 * `PUT /classes/:id/assign-teacher`, which writes `Class.classTeacherId`: since
 * A6 that is the only thing that grants class-teacher (register) access.
 * Invalidates the class list, that class's detail and the teacher caches.
 *
 * @returns Mutation taking `{ classId, teacherUserId }`, resolving to the updated class.
 */
export function useAssignClassTeacher() {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const reference = useInvalidateReference();
  return useMutation({
    mutationFn: ({ classId, teacherUserId }: AssignClassTeacherInput) =>
      assignTeacherToClass(classId, teacherUserId),
    onSuccess: async (_updated, { classId }) => {
      await Promise.all([
        reference.classes(),
        client.invalidateQueries({ queryKey: queryKeys.classes.detail(schoolId ?? "none", classId) }),
        client.invalidateQueries({ queryKey: queryKeys.teachers.all }),
      ]);
    },
  });
}
