/**
 * Cached teacher roster and the mutations that change it.
 *
 * The list endpoint returns accounts without profile fields, so the roster
 * query stitches the two together in `teacherService.getTeacherRoster`. Caching
 * it here matters: that stitching costs one request per teacher on the page,
 * and before this it ran on every mount of the teachers page.
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  createTeacherProfile,
  registerTeacher,
  teacherService,
  teacherUpdates,
  type CreateTeacherProfilePayload,
  type GetTeachersResponse,
  type RegisterTeacherPayload,
  type Teacher,
  type TeacherAssignmentsPayload,
  type TeacherAvailabilityPayload,
  type TeacherById,
  type TeacherEmploymentPayload,
  type TeacherPersonalDetailsPayload,
  type TeacherQualificationsPayload,
} from "@/app/services/teacher.service";

/** Which slice of the teacher roster a list query wants. */
export interface TeacherRosterParams {
  /** 1-based page number. */
  page: number;
  /** Rows per page. */
  limit: number;
}

/**
 * One page of the teacher roster, each row carrying its profile fields.
 *
 * @param params - Page and page size.
 * @returns Query result holding the page and its `meta`.
 */
export function useTeacherRoster(params: TeacherRosterParams): UseQueryResult<GetTeachersResponse> {
  const schoolId = useSchoolId();
  const { page, limit } = params;

  return useQuery({
    queryKey: queryKeys.teachers.list(schoolId ?? "none", { page, limit }),
    queryFn: () => teacherService.getTeacherRoster(page, limit),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/**
 * One teacher's profile, falling back to a placeholder built from their
 * account when no profile has been created yet.
 *
 * @param userId - The teacher's user id, or `undefined` before the route param resolves.
 * @returns Query result holding the profile.
 */
export function useTeacherProfile(userId: string | undefined): UseQueryResult<TeacherById> {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: queryKeys.teachers.detail(schoolId ?? "none", userId ?? "none"),
    queryFn: () => teacherService.getTeacherProfileOrFallback(userId as string),
    enabled: Boolean(schoolId && userId),
    staleTime: staleTimes.list,
  });
}

/** What `useCreateTeacher` needs to add one teacher. */
export interface CreateTeacherInput {
  /** Account fields for `POST /auth/register` (no password — the API makes one). */
  account: RegisterTeacherPayload;
  /** Profile fields for `POST /teachers/:userId`. */
  profile: CreateTeacherProfilePayload;
}

/**
 * Adds a teacher: creates the account (the API generates the temporary
 * password and emails the set-password link), then the teacher profile.
 *
 * @returns Mutation that resolves to the created profile.
 */
export function useCreateTeacher(): UseMutationResult<TeacherById, Error, CreateTeacherInput> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ account, profile }: CreateTeacherInput) => {
      const { userId } = await registerTeacher(account);
      return createTeacherProfile(userId, profile);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.teachers.all }),
  });
}

/** Arguments for `useUpdateTeacherStatus`. */
export interface UpdateTeacherStatusInput {
  /** The teacher's user id. */
  userId: string;
  /** `true` to activate, `false` to deactivate. */
  isActive: boolean;
}

/**
 * Activates or deactivates a teacher.
 *
 * @returns Mutation that resolves to the updated teacher.
 */
export function useUpdateTeacherStatus(): UseMutationResult<Teacher, Error, UpdateTeacherStatusInput> {
  const client = useQueryClient();
  const schoolId = useSchoolId();

  return useMutation({
    mutationFn: ({ userId, isActive }: UpdateTeacherStatusInput) =>
      teacherService.updateTeacherStatus(userId, isActive),
    onSuccess: (_data, { userId }) => {
      client.invalidateQueries({ queryKey: queryKeys.teachers.detail(schoolId ?? "none", userId) });
      client.invalidateQueries({ queryKey: queryKeys.teachers.all });
    },
  });
}

/** The parts of a teacher record, each written by its own endpoint. */
export type TeacherSection =
  | "personal"
  | "qualifications"
  | "employment"
  | "assignments"
  | "availability";

/** One section of a teacher's record and the body to write to it. */
export type SaveTeacherSectionInput =
  | { userId: string; section: "personal"; payload: TeacherPersonalDetailsPayload }
  | { userId: string; section: "qualifications"; payload: TeacherQualificationsPayload }
  | { userId: string; section: "employment"; payload: TeacherEmploymentPayload }
  | { userId: string; section: "assignments"; payload: TeacherAssignmentsPayload }
  | { userId: string; section: "availability"; payload: TeacherAvailabilityPayload };

/**
 * Saves one section of a teacher's record. The editor has a separate Update
 * button per tab because the API splits the record across five endpoints.
 *
 * @returns Mutation that writes the given section and refreshes the profile.
 */
export function useSaveTeacherSection(): UseMutationResult<unknown, Error, SaveTeacherSectionInput> {
  const client = useQueryClient();
  const schoolId = useSchoolId();

  return useMutation({
    mutationFn: (input: SaveTeacherSectionInput) => {
      switch (input.section) {
        case "personal":
          return teacherUpdates.personalDetails(input.userId, input.payload);
        case "qualifications":
          return teacherUpdates.qualifications(input.userId, input.payload);
        case "employment":
          return teacherUpdates.employment(input.userId, input.payload);
        case "assignments":
          return teacherUpdates.assignments(input.userId, input.payload);
        case "availability":
          return teacherUpdates.availability(input.userId, input.payload);
      }
    },
    onSuccess: (_data, { userId }) => {
      client.invalidateQueries({ queryKey: queryKeys.teachers.detail(schoolId ?? "none", userId) });
      client.invalidateQueries({ queryKey: queryKeys.teachers.all });
    },
  });
}

/**
 * Invalidates every cached teacher list and profile — for editors that write
 * through several endpoints at once and then need the roster to catch up.
 *
 * @returns A function that invalidates the teacher caches.
 */
export function useInvalidateTeachers(): () => void {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: queryKeys.teachers.all });
  };
}
