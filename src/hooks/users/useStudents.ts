/**
 * Cached student roster and the mutations that change it.
 *
 * The roster pages read through these instead of fetching in `useEffect`, so a
 * page revisit reuses the cached page for `staleTimes.list` and every mutation
 * says exactly which lists it invalidated.
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
  createStudentProfile,
  getStudentAttendanceKpis,
  getStudentTranscript,
  issueParentLinkCode,
  issueStudentTranscript,
  registerStudent,
  studentService,
  updateStudent,
  updateStudentStatus,
  type CreateStudentProfilePayload,
  type CreatedStudent,
  type GetStudentsResponse,
  type ParentLinkCode,
  type RegisterStudentPayload,
  type StudentAttendanceKpis,
  type StudentById,
  type StudentTranscript,
  type TranscriptIssue,
  type UpdateStudentPayload,
} from "@/app/services/student.service";

/** Which slice of the roster a list query wants. */
export interface StudentRosterParams {
  /** 1-based page number. */
  page: number;
  /** Rows per page. */
  limit: number;
  /** Restrict to one class, or `null` for the whole school. */
  classId?: string | null;
}

/**
 * One server-side page of the roster — the whole school, or one class.
 *
 * @param params - Page, page size and optional class filter.
 * @returns Query result holding the page and its `meta`.
 */
export function useStudentRoster(params: StudentRosterParams): UseQueryResult<GetStudentsResponse> {
  const schoolId = useSchoolId();
  const { page, limit, classId = null } = params;

  return useQuery({
    queryKey: queryKeys.students.list(schoolId ?? "none", { page, limit, classId }),
    queryFn: () =>
      classId
        ? studentService.getStudentsByClass(classId, page, limit)
        : studentService.getStudents(page, limit),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    // Keeps the previous page on screen while the next one loads, so the grid
    // does not collapse to a skeleton and jump on every page change.
    placeholderData: (previous) => previous,
  });
}

/**
 * One student's full record.
 *
 * @param studentId - The student to load, or `undefined` before the route param resolves.
 * @returns Query result holding the student.
 */
export function useStudent(studentId: string | undefined): UseQueryResult<StudentById> {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: queryKeys.students.detail(schoolId ?? "none", studentId ?? "none"),
    queryFn: () => studentService.getStudentById(studentId as string),
    enabled: Boolean(schoolId && studentId),
    staleTime: staleTimes.list,
  });
}

/**
 * A student's attendance totals, fetched only once the attendance tab is open.
 *
 * @param studentId - The student to report on.
 * @param enabled - False until the tab is selected, so the profile page does not
 *   pay for attendance nobody asked for.
 * @returns Query result holding the attendance figures.
 */
export function useStudentAttendance(
  studentId: string | undefined,
  enabled: boolean
): UseQueryResult<StudentAttendanceKpis> {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: [...queryKeys.students.detail(schoolId ?? "none", studentId ?? "none"), "attendance"],
    queryFn: () => getStudentAttendanceKpis(studentId as string),
    enabled: Boolean(enabled && schoolId && studentId),
    staleTime: staleTimes.list,
    retry: false,
  });
}

/** The account an earlier attempt already created for this student. */
export interface CreatedStudentAccount {
  /** The new user id. */
  userId: string;
  /** The server-generated password, forwarded so the onboarding email quotes it. */
  temporaryPassword?: string;
}

/** What `useCreateStudent` needs to enrol one student. */
export interface CreateStudentInput {
  /** Account fields for `POST /auth/register` (no password — the API makes one). */
  account: RegisterStudentPayload;
  /** Class, grade level and parent contact for `POST /students`. */
  profile: Omit<CreateStudentProfilePayload, "userId" | "password">;
  /**
   * The account made by an earlier attempt whose student record failed.
   * Registration is skipped, so the retry cannot hit a `CONFLICT` on the email
   * it already created.
   */
  existingAccount?: CreatedStudentAccount;
  /** Called the moment the account exists, before the student record is written. */
  onAccountCreated?: (account: CreatedStudentAccount) => void;
}

/**
 * Enrols a student: creates the account, then the student record. The
 * server-generated temporary password is forwarded to the second call so the
 * onboarding email quotes the password the student can actually sign in with.
 * Invalidates the student, parent and class lists.
 *
 * @returns Mutation that resolves to the created student (with `parentLink`
 *   when the API says the parent already had an account).
 */
export function useCreateStudent(): UseMutationResult<CreatedStudent, Error, CreateStudentInput> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({
      account,
      profile,
      existingAccount,
      onAccountCreated,
    }: CreateStudentInput) => {
      let created = existingAccount;
      if (!created) {
        const registration = await registerStudent(account);
        created = {
          userId: registration.userId,
          temporaryPassword: registration.temporaryPassword,
        };
        onAccountCreated?.(created);
      }
      return createStudentProfile({
        ...profile,
        userId: created.userId,
        ...(created.temporaryPassword ? { password: created.temporaryPassword } : {}),
      });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.students.all });
      client.invalidateQueries({ queryKey: queryKeys.parents.all });
      client.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

/** Arguments for `useUpdateStudent`. */
export interface UpdateStudentInput {
  /** The student to update. */
  studentId: string;
  /** Fields to change. */
  payload: UpdateStudentPayload;
}

/**
 * Saves edits to a student's record.
 *
 * @returns Mutation that resolves to the updated student.
 */
export function useUpdateStudent(): UseMutationResult<StudentById, Error, UpdateStudentInput> {
  const client = useQueryClient();
  const schoolId = useSchoolId();

  return useMutation({
    mutationFn: ({ studentId, payload }: UpdateStudentInput) => updateStudent(studentId, payload),
    onSuccess: (_data, { studentId }) => {
      client.invalidateQueries({
        queryKey: queryKeys.students.detail(schoolId ?? "none", studentId),
      });
      client.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

/** Arguments for `useUpdateStudentStatus`. */
export interface UpdateStudentStatusInput {
  /** The student to activate or deactivate. */
  studentId: string;
  /** `true` to activate, `false` to deactivate. */
  isActive: boolean;
}

/**
 * Activates or deactivates a student.
 *
 * @returns Mutation that resolves to the API's confirmation message.
 */
export function useUpdateStudentStatus(): UseMutationResult<
  { message: string },
  Error,
  UpdateStudentStatusInput
> {
  const client = useQueryClient();
  const schoolId = useSchoolId();

  return useMutation({
    mutationFn: ({ studentId, isActive }: UpdateStudentStatusInput) =>
      updateStudentStatus(studentId, isActive),
    onSuccess: (_data, { studentId }) => {
      client.invalidateQueries({
        queryKey: queryKeys.students.detail(schoolId ?? "none", studentId),
      });
      client.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

/**
 * Issues a parent link code for a student (A11). Nothing cached changes: the
 * code is shown once and only its hash is stored, so there is nothing to
 * invalidate.
 *
 * @returns Mutation taking the student record id, resolving to `{ code, expiresAt }`.
 */
export function useIssueParentLinkCode(): UseMutationResult<ParentLinkCode, Error, string> {
  return useMutation({
    mutationFn: (studentId: string) => issueParentLinkCode(studentId),
  });
}

/**
 * The query key of a student's transcript (this school's part).
 *
 * @param schoolId - The signed-in school.
 * @param studentId - The student record id.
 * @returns The key.
 */
export function studentTranscriptKey(schoolId: string, studentId: string) {
  return [...queryKeys.students.detail(schoolId, studentId), "transcript"] as const;
}

/**
 * This school's part of a student's transcript. The profile reads it for the
 * Records tab and for the student's status (the profile endpoint does not
 * carry `status`), and on its own for a student who has moved to another
 * Talim school, whose profile this school can no longer open.
 *
 * @param studentId - The student record id, or `undefined` before the route param resolves.
 * @returns Query result holding the transcript.
 */
export function useStudentTranscript(
  studentId: string | undefined
): UseQueryResult<StudentTranscript> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: studentTranscriptKey(schoolId ?? "none", studentId ?? "none"),
    queryFn: () => getStudentTranscript(studentId as string),
    enabled: Boolean(schoolId && studentId),
    staleTime: staleTimes.list,
    retry: false,
  });
}

/**
 * Issues a student's transcript with a verification code (idempotent on the
 * server, so issuing twice shows the same code). Nothing cached changes.
 *
 * @returns Mutation taking the student record id.
 */
export function useIssueTranscript(): UseMutationResult<TranscriptIssue, Error, string> {
  return useMutation({
    mutationFn: (studentId: string) => issueStudentTranscript(studentId),
  });
}
