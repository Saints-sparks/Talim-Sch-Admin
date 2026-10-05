/**
 * Teachers — the staff directory and the teacher record the School Admin
 * "Users → Teachers" area reads and writes.
 *
 * Two different shapes come back from the API and both are used here:
 * `GET /users/teachers` lists the teachers' *user accounts* (name, email,
 * active flag), while `GET /teachers/:userId` returns the *teacher profile*
 * (staff number, classes, courses, qualifications). The roster stitches the
 * two together because the list endpoint carries no profile fields.
 */
import { API_ENDPOINTS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import type { Schema } from "@/types/apiContract";
import type {
  CreateTeacherProfilePayload,
  RegisterUserPayload,
  TeacherAssignmentsPayload,
  TeacherAvailabilityPayload,
  TeacherEmploymentPayload,
  TeacherPersonalDetailsPayload,
  TeacherQualificationsPayload,
  UpdateTeacherStatusPayload,
} from "@/types/apiPayloads";

// Request payloads are the backend DTOs (`src/types/apiPayloads.ts`); re-exported
// for the callers that already import them from here.
export type {
  CreateTeacherProfilePayload,
  TeacherAssignmentsPayload,
  TeacherAvailabilityPayload,
  TeacherEmploymentPayload,
  TeacherPersonalDetailsPayload,
  TeacherQualificationsPayload,
} from "@/types/apiPayloads";

/** The maximum `limit` the backend's PaginationDto accepts. */
const MAX_PAGE_SIZE = 500;

interface TeacherUser {
  _id: string;
  userId?: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userAvatar?: string;
  schoolId?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

/** A class named by id and name, e.g. in `classTeacherOf`. */
export type ClassRef = Schema<"TeacherClassRefDto">;

/** A class on a teacher's profile, with its size (`classCapacity` is stored as text). */
export type TeacherClass = Schema<"TeacherClassDto">;

/** A course on a teacher's profile: `classId` is populated on the profile, an id on the roster. */
export type TeacherCourse = Schema<"TeacherCourseDto">;

/**
 * The roster fields `GET /users/teachers` attaches to each account row
 * (School Admin gap 5), batched for the page; `null` before the profile is
 * created. `classTeacherClasses` merges the assigned and class-teacher
 * classes; `classTeacherOf` is only the classes whose `Class.classTeacherId`
 * is this teacher (A6).
 */
export type TeacherRosterProfile = Schema<"TeacherRosterProfileDto">;

/**
 * A row in the teacher roster: the user account, plus the profile fields the
 * list sends with it (`teacherProfile`), spread onto the row. Stays
 * hand-written: it is the client's merged row (`TeacherRosterRowDto` plus
 * the spread profile), also used for the status route's answer.
 */
export interface Teacher {
  _id: string;
  userId?: TeacherUser | string;
  staffNumber?: string | null;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  userAvatar?: string;
  highestAcademicQualification?: string;
  yearsOfExperience?: number;
  specialization?: string;
  employmentType?: string;
  employmentRole?: string;
  availabilityDays?: string[];
  availableTime?: string;
  isFormTeacher?: boolean;
  /** From the roster's `teacherProfile.classTeacherClasses`. */
  assignedClasses?: TeacherClass[];
  /** From the roster's `teacherProfile.assignedCourses`. */
  assignedCourses?: TeacherCourse[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  classIds?: string[];
  __v?: number;
  schoolId?: string;
  /** False when the account exists but no teacher profile has been created yet. */
  hasTeacherProfile?: boolean;
  /** Classes this teacher is the class teacher of (A6). */
  classTeacherOf?: ClassRef[];
  /** As `GET /users/teachers` sends it, before the roster spreads it onto the row. */
  teacherProfile?: TeacherRosterProfile | null;
}

/**
 * A teacher profile as `GET /teachers/:userId` returns it
 * (`TeacherProfileResponseDto`): its courses with their periods,
 * `classTeacherClasses` (the classes they lead or are assigned, with student
 * counts) and `classTeacherOf` (only the classes whose `Class.classTeacherId`
 * is theirs: the one source of class-teacher, register, access).
 */
export type TeacherById = Omit<Schema<"TeacherProfileResponseDto">, "userId" | "availableTime" | "classTeacherOf"> & {
  /** Hand-written: the DTO documents an id, but the route populates the account. */
  userId: {
    _id: string;
    userId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isActive: boolean;
    isEmailVerified: boolean;
    schoolId: string;
    isTwoFactorEnabled: boolean;
    devices: unknown[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    id: string;
    dateOfBirth?: string;
    gender?: string;
    userAvatar?: string;
  };
  /** Hand-written: stored as text (e.g. "08:00 AM - 03:00 PM"), while the DTO documents an object. */
  availableTime?: string;
  /** Optional here only for the placeholder, which leaves it out so the class list decides. */
  classTeacherOf?: ClassRef[];
  /** Not sent by `GET /teachers/:userId` (its classes are in `classTeacherClasses`); empty on a placeholder. */
  assignedClasses?: TeacherClass[];
  /** False for a placeholder built from the account when no profile exists. */
  hasTeacherProfile?: boolean;
};

/** Pagination envelope the teacher list answers with. */
export type TeacherPaginationMeta = Schema<"TeacherRosterMetaDto">;

/** A page of teacher accounts. */
export interface GetTeachersResponse {
  data: Teacher[];
  meta: TeacherPaginationMeta;
}

/**
 * Body for `POST /auth/register` when creating a teacher.
 *
 * There is deliberately no `password`: the API generates a temporary one,
 * forces a change at first sign-in and emails a set-password link. Never
 * reintroduce a client-side default here.
 */
export type RegisterTeacherPayload = Omit<RegisterUserPayload, "role" | "password"> & {
  role: "teacher";
  password?: never;
};

/** What `POST /auth/register` answers with. */
export interface RegisterTeacherResponse {
  message: string;
  userId: string;
  temporaryPassword?: string;
  passwordResetEmailSent?: boolean;
}

/** The qualifications the backend's `AcademicQualification` enum accepts. */
export type AcademicQualification = CreateTeacherProfilePayload["highestAcademicQualification"];

/**
 * Creates a teacher's login account.
 *
 * @param payload - Account fields; no password, the API generates one.
 * @returns The new user id.
 * @throws `ApiError` — `CONFLICT` when the email already has an account.
 */
export const registerTeacher = async (payload: RegisterTeacherPayload): Promise<RegisterTeacherResponse> =>
  api.post<RegisterTeacherResponse>(API_ENDPOINTS.REGISTER, payload);

/**
 * Creates the teacher profile for an account made by `registerTeacher`.
 *
 * @param userId - The teacher's user id.
 * @param payload - Qualifications, employment, availability and assignments.
 * @returns The created profile.
 * @throws `Error` when `userId` is missing; `ApiError` for a rejected payload.
 */
export const createTeacherProfile = async (
  userId: string,
  payload: CreateTeacherProfilePayload,
): Promise<TeacherById> => {
  if (!userId) throw new Error("User ID is required to create teacher profile");
  return api.post<TeacherById>(`${API_ENDPOINTS.CREATE_TEACHER}${encodeURIComponent(userId)}`, payload);
};

/** Builds a placeholder profile from an account that has no teacher profile yet. */
function placeholderProfile(user: Teacher): TeacherById {
  return {
    _id: user._id,
    userId: {
      _id: user._id,
      userId: typeof user.userId === "string" ? user.userId : user._id,
      email: user.email || "",
      role: user.role || "teacher",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      isActive: user.isActive,
      isEmailVerified: false,
      schoolId: user.schoolId || "",
      isTwoFactorEnabled: false,
      devices: [],
      createdAt: user.createdAt?.toString() || "",
      updatedAt: user.updatedAt?.toString() || "",
      __v: user.__v || 0,
      id: user._id,
    },
    assignedClasses: [],
    classTeacherClasses: [],
    assignedCourses: [],
    isFormTeacher: false,
    highestAcademicQualification: "",
    yearsOfExperience: 0,
    specialization: "",
    employmentType: "",
    employmentRole: "",
    availabilityDays: [],
    availableTime: "",
    hasTeacherProfile: false,
  };
}

/** The user id to address a teacher by — their account id, however it is populated. */
export const teacherUserId = (teacher: Teacher): string =>
  (typeof teacher.userId === "object" ? teacher.userId?._id : undefined) || teacher._id;

/**
 * Spreads a list row's `teacherProfile` onto it, in the shape the roster
 * cards read.
 *
 * @param teacher - A row of `GET /users/teachers`.
 * @returns The row with its profile fields, or flagged as having no profile.
 */
export function withRosterProfile(teacher: Teacher): Teacher {
  const profile = teacher.teacherProfile;
  if (!profile?.hasTeacherProfile) return { ...teacher, hasTeacherProfile: false };
  return {
    ...teacher,
    assignedClasses: profile.classTeacherClasses ?? [],
    assignedCourses: profile.assignedCourses ?? [],
    isFormTeacher: profile.isFormTeacher,
    staffNumber: profile.staffNumber,
    classTeacherOf: profile.classTeacherOf ?? [],
    hasTeacherProfile: true,
  };
}

export const teacherService = {
  /**
   * A page of the school's teacher accounts.
   *
   * @param page - 1-based page number.
   * @param limit - Rows per page; capped at the API's maximum of 500.
   * @returns The page and its `meta`.
   */
  async getTeachers(page = 1, limit = 10): Promise<GetTeachersResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(Math.min(limit, MAX_PAGE_SIZE)),
    });
    return api.get<GetTeachersResponse>(`${API_ENDPOINTS.GET_TEACHERS}?${query}`);
  },

  /**
   * Every teacher account in the school, in one call.
   *
   * @returns The teacher accounts (up to the API's 500-row ceiling).
   */
  async getAllTeachers(): Promise<Teacher[]> {
    const response = await this.getTeachers(1, MAX_PAGE_SIZE);
    return response.data ?? [];
  },

  /**
   * A page of teacher accounts with their profile fields, so the roster can
   * show staff numbers, classes and courses. One request: `GET /users/teachers`
   * sends each row's `teacherProfile` (batched on the server), so there is no
   * request per teacher.
   *
   * A teacher without a profile (`teacherProfile: null`) keeps their account
   * row and is marked `hasTeacherProfile: false`.
   *
   * @param page - 1-based page number.
   * @param limit - Rows per page; capped at the API's maximum of 500.
   * @returns The page, each row carrying its profile fields, and its `meta`.
   */
  async getTeacherRoster(page = 1, limit = 10): Promise<GetTeachersResponse> {
    const response = await this.getTeachers(page, limit);
    const data = (response.data ?? []).map(withRosterProfile);
    return { data, meta: response.meta ?? { total: data.length, page, lastPage: 1, limit } };
  },

  /**
   * Replaces a teacher's course assignments.
   *
   * Only the courses are sent: the API updates just the fields it is given, and
   * sending `assignedClasses: []` alongside used to wipe the teacher's classes
   * and form-teacher status every time a course was added.
   *
   * @param teacherId - The teacher's user id.
   * @param assignedCourses - The full intended list of course ids.
   * @returns The updated profile.
   */
  async updateTeacherByCourse(teacherId: string, assignedCourses: string[]): Promise<TeacherById> {
    const body: TeacherAssignmentsPayload = { assignedCourses };
    return api.patch<TeacherById>(
      `${API_ENDPOINTS.BASE_URL}/teachers/${encodeURIComponent(teacherId)}/class-course-assignments`,
      body,
    );
  },

  /**
   * One teacher's profile.
   *
   * @param teacherId - The teacher's user id.
   * @returns The profile.
   * @throws `ApiError` — `NOT_FOUND` when no profile has been created yet.
   */
  async getTeacherById(teacherId: string): Promise<TeacherById> {
    return api.get<TeacherById>(`${API_ENDPOINTS.GET_TEACHER}/${encodeURIComponent(teacherId)}`);
  },

  /**
   * A teacher's profile, or a placeholder built from their account when the
   * profile has not been created yet — so the profile page can offer to finish
   * the setup instead of showing "not found".
   *
   * @param userId - The teacher's user id.
   * @returns The profile, with `hasTeacherProfile` saying which it is.
   */
  async getTeacherProfileOrFallback(userId: string): Promise<TeacherById> {
    try {
      const teacherProfile = await this.getTeacherById(userId);
      return { ...teacherProfile, hasTeacherProfile: true };
    } catch (error) {
      const isMissingProfile =
        error instanceof Error && error.message.toLowerCase().includes("not found");
      if (!isMissingProfile) throw error;

      const teachers = await this.getAllTeachers();
      const user = teachers.find((teacher) => teacherUserId(teacher) === userId || teacher._id === userId);
      if (!user) throw error;

      return placeholderProfile(user);
    }
  },

  /**
   * Activates or deactivates a teacher's account.
   *
   * @param teacherId - The teacher's user id.
   * @param isActive - `true` to activate, `false` to deactivate.
   * @returns The updated teacher.
   * @throws `ApiError` — `FORBIDDEN` without `manage:teachers`.
   */
  async updateTeacherStatus(teacherId: string, isActive: boolean): Promise<Teacher> {
    const body: UpdateTeacherStatusPayload = { isActive };
    return api.put<Teacher>(
      `${API_ENDPOINTS.BASE_URL}/users/teachers/${encodeURIComponent(teacherId)}/status`,
      body,
    );
  },

  /**
   * Deactivates a teacher: they keep their records but can no longer sign in.
   *
   * @param teacherId - The teacher's user id.
   * @returns The updated teacher.
   */
  async deactivateTeacher(teacherId: string): Promise<Teacher> {
    return this.updateTeacherStatus(teacherId, false);
  },
};

const teacherPath = (userId: string, suffix: string) => `/teachers/${encodeURIComponent(userId)}/${suffix}`;

/** Typed teacher record updates used by the teacher editor. Errors are `ApiError`s. */
export const teacherUpdates = {
  /**
   * @param userId - The teacher's user id.
   * @param payload - Personal fields to change.
   */
  personalDetails: (userId: string, payload: TeacherPersonalDetailsPayload) =>
    api.patch(teacherPath(userId, "personal-details"), payload),
  /**
   * @param userId - The teacher's user id.
   * @param payload - Qualification fields to change.
   */
  qualifications: (userId: string, payload: TeacherQualificationsPayload) =>
    api.patch(teacherPath(userId, "qualification-details"), payload),
  /**
   * @param userId - The teacher's user id.
   * @param payload - Employment fields to change.
   */
  employment: (userId: string, payload: TeacherEmploymentPayload) => api.put(teacherPath(userId, "employment"), payload),
  /**
   * @param userId - The teacher's user id.
   * @param payload - Availability fields to change.
   */
  availability: (userId: string, payload: TeacherAvailabilityPayload) =>
    api.patch(teacherPath(userId, "availability"), payload),
  /**
   * @param userId - The teacher's user id.
   * @param payload - Full intended class/course lists and form-teacher flag.
   */
  assignments: (userId: string, payload: TeacherAssignmentsPayload) =>
    api.patch(teacherPath(userId, "class-course-assignments"), payload),
};
