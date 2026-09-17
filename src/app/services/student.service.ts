/**
 * Students — the roster the School Admin "Users → Students" area reads and
 * writes, plus the handful of class helpers the student pages share.
 *
 * Every call goes through the typed `api` facade, so failures arrive as
 * `ApiError` with a stable `code` the pages branch on. `getClasses` is a
 * re-export of the canonical implementation in `school.service`; it stays
 * exported here only because a dozen pages still import it from this module.
 */
import { API_ENDPOINTS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import { getClasses as getSchoolClasses } from "@/app/services/school.service";

interface StudentUser {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  userAvatar: string;
  [key: string]: string | number | boolean;
}

interface AssignedCourse {
  _id: string;
  courseCode: string;
  title: string;
  description: string;
  teacherId: string | null;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  classId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  schoolId?: string;
  id: string;
}

/** A class as the `/classes` endpoint returns it to the student and class pages. */
export interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
  classCapacity: string;
  classDescription: string;
  schoolId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        physicalAddress: string;
        location: {
          country: string;
          state: string;
          _id: string;
        };
        schoolPrefix: string;
        primaryContacts: Array<{
          name: string;
          phone: string;
          email: string;
          role: string;
          _id: string;
        }>;
        active: boolean;
        logo: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
      };
  assignedCourses: AssignedCourse[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  classTeacherId?: {
    _id: string;
    userId: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      id: string;
    };
    assignedClasses: string[];
    assignedCourses: string[];
    isFormTeacher: boolean;
    isActive: boolean;
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
  };
  // The class endpoints return extra populated fields (students, courses,
  // subjects) whose shape differs per route, and the /classes pages — owned by
  // another track — read them directly. Narrowing this to `unknown` breaks
  // those callers, so the escape hatch stays until the class helpers move out
  // of this service.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface UpdateClassData {
  name: string;
  gradeLevel?: string;
  classDescription: string;
  classCapacity: string;
}

interface ParentContact {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  relationship: string;
  [key: string]: string;
}

/** A student row as the paginated roster endpoints return it. */
export interface Student {
  _id: string;
  userId: StudentUser;
  classId: Class;
  admissionNumber?: string;
  schoolId?: string;
  gradeLevel: string;
  parentId: string;
  parentContact: ParentContact;
  isActive: boolean;
  enrollmentDate?: string;
  assignedSubjects?: string[];
  attendance?: string;
  [key: string]: string | boolean | string[] | StudentUser | Class | ParentContact | undefined;
}

/** A single student, as `GET /students/:id` returns it (populated refs). */
export interface StudentById {
  _id: string;
  admissionNumber?: string;
  schoolId?: string;
  userId: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender?: string;
    userAvatar?: string;
  };
  classId?: {
    _id: string;
    name: string;
  };
  gradeLevel: string;
  parentId: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  parentContact: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: string;
    _id: string;
  };
  isActive: boolean;
  enrollmentDate?: string;
  assignedSubjects?: string[];
  attendance?: string;
}

/** Pagination envelope every roster endpoint answers with. */
export interface PaginationMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

/** A page of students. */
export interface GetStudentsResponse {
  data: Student[];
  meta: PaginationMeta;
}

/**
 * Body for `POST /auth/register` when enrolling a student.
 *
 * `password` is deliberately absent: the API generates a temporary one and
 * emails a set-password link, and returns it as `temporaryPassword`.
 */
export interface RegisterStudentPayload {
  email: string;
  role: "student";
  schoolId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/** What `POST /auth/register` answers with. */
export interface RegisterStudentResponse {
  message: string;
  userId: string;
  /** Present only when the server generated the password. */
  temporaryPassword?: string;
  passwordResetEmailSent?: boolean;
}

/** The relationships the backend's `ParentRelationship` enum accepts. */
export type ParentRelationship = "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER";

/** Body for `POST /students` (backend `CreateStudentDto`). */
export interface CreateStudentProfilePayload {
  userId: string;
  classId: string;
  gradeLevel: string;
  parentContact: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: ParentRelationship;
  };
  /** The student's password, so the onboarding email quotes the real one. */
  password?: string;
  admissionNumber?: string;
}

/** Personal fields of `UpdateStudentDto.userInfo`. */
export interface UpdateStudentUserInfo {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  userAvatar?: string;
}

/** Body for `PUT /students/:id` (backend `UpdateStudentDto`). */
export interface UpdateStudentPayload {
  userInfo?: UpdateStudentUserInfo;
  classId?: string;
  gradeLevel?: string;
  parentContact?: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: ParentRelationship;
  };
  isActive?: boolean;
}

/**
 * Creates the student's login account.
 *
 * @param payload - Account fields; no password, the API generates one.
 * @returns The new user id and the generated temporary password.
 * @throws `ApiError` — `CONFLICT` when the email already has an account.
 */
export const registerStudent = async (
  payload: RegisterStudentPayload,
): Promise<RegisterStudentResponse> => api.post<RegisterStudentResponse>(API_ENDPOINTS.REGISTER, payload);

/**
 * Creates the student record for an account made by `registerStudent`, links
 * (or creates) the parent, and triggers the onboarding emails.
 *
 * @param payload - Class, grade level and parent contact.
 * @returns The created student.
 * @throws `ApiError` — `VALIDATION_FAILED` when a field fails the DTO.
 */
export const createStudentProfile = async (payload: CreateStudentProfilePayload): Promise<StudentById> =>
  api.post<StudentById>(API_ENDPOINTS.CREATE_STUDENT, payload);

/**
 * The school's classes.
 *
 * Re-exported from `school.service`, which owns the one implementation. New
 * code should import `useClasses()` from `@/hooks/queries/reference` instead.
 *
 * @returns Every class in the signed-in school.
 */
export const getClasses = async (): Promise<Class[]> =>
  (await getSchoolClasses()) as unknown as Class[];

/**
 * Creates a class.
 *
 * @param payload - The class to create.
 * @returns The created class.
 */
export const createClass = async (payload: Omit<Class, "_id">): Promise<Class> =>
  api.post<Class>(API_ENDPOINTS.CREATE_CLASS, payload);

/**
 * One class by id. Falls back to scanning the class list when the API has no
 * single-class route for this deployment.
 *
 * @param classId - The class to load.
 * @returns The class.
 * @throws `ApiError` or `Error` when the class is in neither place.
 */
// The /classes pages assign this straight into their own richer `ClassDetails`
// type; keeping the loose return preserves that until the class helpers move.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getClass = async (classId: string): Promise<any> => {
  try {
    return await api.get<Class>(`${API_ENDPOINTS.GET_CLASS}/${encodeURIComponent(classId)}`);
  } catch {
    const all = await getClasses();
    const found = all.find((c) => c._id === classId);
    if (!found) throw new Error(`Class with ID ${classId} not found`);
    return found;
  }
};

/**
 * Updates a student's record.
 *
 * @param studentId - The student to update.
 * @param data - Fields to change (backend `UpdateStudentDto`).
 * @returns The updated student.
 * @throws `ApiError` — `VALIDATION_FAILED`, `NOT_FOUND` or `FORBIDDEN`.
 */
export const updateStudent = async (studentId: string, data: UpdateStudentPayload): Promise<StudentById> =>
  api.put<StudentById>(`${API_ENDPOINTS.STUDENTS}/${encodeURIComponent(studentId)}`, data);

export const studentService = {
  /**
   * A page of the school's students.
   *
   * @param page - 1-based page number.
   * @param limit - Rows per page (the API caps this at 500).
   * @returns The page and its `meta`.
   */
  async getStudents(page = 1, limit = 10): Promise<GetStudentsResponse> {
    const query = new URLSearchParams({ page: String(page), limit: String(Math.min(limit, 500)) });
    return api.get<GetStudentsResponse>(`${API_ENDPOINTS.GET_STUDENTS}?${query}`);
  },

  /**
   * One student by id.
   *
   * @param studentId - The student to load.
   * @returns The student.
   * @throws `ApiError` — `NOT_FOUND` when no such student is in this school.
   */
  async getStudentById(studentId: string): Promise<StudentById> {
    const body = await api.get<{ data?: StudentById[] } | StudentById>(
      `${API_ENDPOINTS.GET_STUDENT}/${encodeURIComponent(studentId)}`,
    );
    const wrapped = (body as { data?: StudentById[] })?.data;
    return Array.isArray(wrapped) ? wrapped[0] : (body as StudentById);
  },

  /**
   * A page of the students in one class.
   *
   * @param classId - The class to list.
   * @param page - 1-based page number.
   * @param limit - Rows per page (the API caps this at 500).
   * @returns The page and its `meta`.
   */
  async getStudentsByClass(classId: string, page = 1, limit = 10): Promise<GetStudentsResponse> {
    const query = new URLSearchParams({ page: String(page), limit: String(Math.min(limit, 500)) });
    return api.get<GetStudentsResponse>(`${API_ENDPOINTS.GET_STUDENTS_BY_CLASS_ID(classId)}?${query}`);
  },
};

/**
 * Renames a class or changes its capacity/description.
 *
 * @param classId - The class to update.
 * @param updateData - The fields to change.
 * @returns The updated class.
 */
export const updateClass = async (classId: string, updateData: UpdateClassData): Promise<Class> =>
  api.put<Class>(`${API_ENDPOINTS.BASE_URL}/classes/${encodeURIComponent(classId)}`, {
    name: updateData.name,
    ...(updateData.gradeLevel ? { gradeLevel: updateData.gradeLevel } : {}),
    classDescription: updateData.classDescription,
    classCapacity: updateData.classCapacity,
  });

/**
 * Makes a teacher the form teacher of a class.
 *
 * @param classId - The class.
 * @param teacherId - The teacher's user id.
 * @returns The updated class.
 */
export const assignTeacherToClass = async (classId: string, teacherId: string): Promise<Class> =>
  api.put<Class>(`${API_ENDPOINTS.BASE_URL}/classes/${encodeURIComponent(classId)}/assign-teacher`, { teacherId });

/**
 * Deletes a class.
 *
 * @param classId - The class to delete.
 * @returns Nothing.
 */
export const deleteClass = async (classId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.BASE_URL}/classes/${encodeURIComponent(classId)}`);
};

/** Attendance figures for one student over a term or date range. */
export interface StudentAttendanceKpis {
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  dateRange: { startDate: string; endDate: string };
  classInfo: { id: string; name: string };
  termInfo?: { id: string; name: string };
}

/**
 * Attendance totals for one student, for the profile's attendance tab.
 *
 * @param studentId - The student to report on.
 * @returns The attendance figures for the current term.
 * @throws `ApiError` — `NOT_FOUND` when the student has no attendance records.
 */
export const getStudentAttendanceKpis = async (studentId: string): Promise<StudentAttendanceKpis> =>
  api.get<StudentAttendanceKpis>(`${API_ENDPOINTS.BASE_URL}/attendance/student/${encodeURIComponent(studentId)}/kpis`);

/**
 * Activates or deactivates a student.
 *
 * @param studentId - The student to change.
 * @param isActive - `true` to activate, `false` to deactivate.
 * @returns A confirmation message.
 * @throws `ApiError` — `FORBIDDEN` without `manage:students`.
 */
export const updateStudentStatus = async (
  studentId: string,
  isActive: boolean,
): Promise<{ message: string }> => {
  const body = await api.put<{ message?: string } | null>(
    `${API_ENDPOINTS.BASE_URL}/students/${encodeURIComponent(studentId)}/status`,
    { isActive },
  );
  return {
    message: body?.message ?? `Student ${isActive ? "activated" : "deactivated"} successfully`,
  };
};
