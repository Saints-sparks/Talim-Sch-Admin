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

/** A class as it appears on a teacher's profile. */
export interface Class {
  _id?: string;
  name: string;
  schoolId?: string;
  classCapacity?: number;
  classDescription?: string;
  assignedCourses?: string[];
}

/** A course as it appears on a teacher's profile. */
export interface Course {
  _id: string;
  courseCode: string;
  title: string;
  description: string;
  schoolId?: string;
  teacherId?: string;
  classId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * A row in the teacher roster: the user account, plus whatever profile fields
 * the roster has stitched onto it.
 */
export interface Teacher {
  _id: string;
  userId?: TeacherUser | string;
  staffNumber?: string;
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
  assignedClasses?: Class[];
  assignedCourses?: Course[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  classIds?: string[];
  __v?: number;
  schoolId?: string;
  /** False when the account exists but no teacher profile has been created yet. */
  hasTeacherProfile?: boolean;
}

/** A teacher profile as `GET /teachers/:userId` returns it, with refs populated. */
export interface TeacherById {
  _id: string;
  staffNumber?: string;
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
  assignedClasses: {
    _id: string;
    name: string;
    classCapacity: number;
    classDescription: string;
    assignedCourses: string[];
  }[];
  /** Classes where this teacher is the form teacher. */
  classTeacherClasses?: {
    _id: string;
    name: string;
    classCapacity: number;
    classDescription: string;
    assignedCourses: string[];
  }[];
  assignedCourses: {
    _id: string;
    courseCode: string;
    title: string;
    description: string;
    classId: string;
    subjectId: string;
  }[];
  isFormTeacher: boolean;
  highestAcademicQualification: string;
  yearsOfExperience: number;
  specialization: string;
  employmentType: string;
  employmentRole: string;
  availabilityDays: string[];
  availableTime: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  /** False for a placeholder built from the account when no profile exists. */
  hasTeacherProfile?: boolean;
}

/** Pagination envelope the teacher list answers with. */
export interface TeacherPaginationMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

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
export interface RegisterTeacherPayload {
  email: string;
  role: "teacher";
  schoolId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  /** ISO date, optional. */
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
}

/** What `POST /auth/register` answers with. */
export interface RegisterTeacherResponse {
  message: string;
  userId: string;
  temporaryPassword?: string;
  passwordResetEmailSent?: boolean;
}

/** The qualifications the backend's `AcademicQualification` enum accepts. */
export type AcademicQualification = "Undergraduate" | "Graduate" | "Postgraduate" | "Doctorate";

/**
 * Body for `POST /teachers/:userId` (backend `CreateTeacherDto`).
 *
 * The backend rejects any property not on the DTO, so `userId`, `dateOfBirth`
 * and `gender` must not appear here — they belong to the account, not the
 * profile.
 */
export interface CreateTeacherProfilePayload {
  highestAcademicQualification: AcademicQualification;
  yearsOfExperience: number;
  specialization: string;
  employmentType: "Fulltime" | "Parttime";
  employmentRole: "Academic" | "NonAcademic";
  availabilityDays: string[];
  availableTime: string;
  isFormTeacher?: boolean;
  assignedClasses?: string[];
  assignedCourses?: string[];
}

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
    createdAt: user.createdAt?.toString() || "",
    updatedAt: user.updatedAt?.toString() || "",
    __v: user.__v || 0,
    hasTeacherProfile: false,
  };
}

/** The user id to address a teacher by — their account id, however it is populated. */
export const teacherUserId = (teacher: Teacher): string =>
  (typeof teacher.userId === "object" ? teacher.userId?._id : undefined) || teacher._id;

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
   * A page of teacher accounts with their profiles stitched on, so the roster
   * can show staff numbers and class assignments.
   *
   * A teacher whose profile request fails keeps their account row and is
   * marked `hasTeacherProfile: false` rather than disappearing from the list.
   *
   * @param page - 1-based page number.
   * @param limit - Rows per page; capped at the API's maximum of 500.
   * @returns The enriched page and its `meta`.
   */
  async getTeacherRoster(page = 1, limit = 10): Promise<GetTeachersResponse> {
    const response = await this.getTeachers(page, limit);
    const rows = response.data ?? [];

    const profiles = await Promise.allSettled(
      rows.map((teacher) => this.getTeacherById(teacherUserId(teacher))),
    );

    const data = rows.map((teacher, index) => {
      const settled = profiles[index];
      if (settled.status !== "fulfilled") return { ...teacher, hasTeacherProfile: false };
      const profile = settled.value;
      return {
        ...teacher,
        assignedClasses: profile.classTeacherClasses || profile.assignedClasses || [],
        assignedCourses: profile.assignedCourses || [],
        isFormTeacher: profile.isFormTeacher,
        staffNumber: profile.staffNumber,
        hasTeacherProfile: true,
      } as Teacher;
    });

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
    return api.patch<TeacherById>(
      `${API_ENDPOINTS.BASE_URL}/teachers/${encodeURIComponent(teacherId)}/class-course-assignments`,
      { assignedCourses },
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
   * Updates a teacher's profile fields.
   *
   * @param teacherId - The teacher's user id.
   * @param payload - Profile fields to change.
   * @returns The updated teacher.
   */
  async updateTeacher(teacherId: string, payload: Partial<CreateTeacherProfilePayload>): Promise<Teacher> {
    return api.put<Teacher>(`${API_ENDPOINTS.UPDATE_TEACHER}/${encodeURIComponent(teacherId)}`, payload);
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
    return api.put<Teacher>(
      `${API_ENDPOINTS.BASE_URL}/users/teachers/${encodeURIComponent(teacherId)}/status`,
      { isActive },
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

/** Body for `PATCH /teachers/:userId/personal-details` (backend UpdateTeacherPersonalDetailsDto). */
export interface TeacherPersonalDetailsPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: "male" | "female" | "other";
  /** ISO date. */
  dateOfBirth?: string;
}

/** Body for `PATCH /teachers/:userId/qualification-details` (UpdateTeacherAcademicDetailsDto). */
export interface TeacherQualificationsPayload {
  highestAcademicQualification?: AcademicQualification;
  yearsOfExperience?: number;
  specialization?: string;
}

/** Body for `PUT /teachers/:userId/employment` (UpdateTeacherEmploymentDto). */
export interface TeacherEmploymentPayload {
  employmentType?: "Fulltime" | "Parttime";
  employmentRole?: "Academic" | "NonAcademic";
}

/** Body for `PATCH /teachers/:userId/availability` (UpdateTeacherAvailabilityDto). */
export interface TeacherAvailabilityPayload {
  availabilityDays?: string[];
  availableTime?: string;
}

/**
 * Body for `PATCH /teachers/:userId/class-course-assignments`. Omitted fields are
 * left unchanged; a provided array REPLACES the teacher's current list, so send
 * the full intended list. Every id must belong to the school.
 */
export interface TeacherAssignmentsPayload {
  assignedClasses?: string[];
  assignedCourses?: string[];
  isFormTeacher?: boolean;
}

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
