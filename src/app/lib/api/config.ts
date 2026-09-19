// The API origin comes from the environment so each deployment (local, preview,
// production) points at its own backend. Next.js inlines NEXT_PUBLIC_* at build
// time, so a missing value fails the build here rather than at runtime.
const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!configuredApiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local for local development, or set it in the deployment's environment variables."
  );
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");

/**
 * Turns a relative API path into a full URL, for the few callers that cannot
 * go through `apiClient` (an XMLHttpRequest that reports upload progress).
 *
 * @param path - A path from {@link API_URLS}, starting with "/".
 * @returns The absolute URL.
 */
export const absoluteUrl = (path: string): string => `${API_BASE_URL}${path}`;

export const API_URLS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    INTROSPECT: "/auth/introspect",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_RESET_CODE: "/auth/verify-reset-code",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
    GET_PROFILE: "/auth/profile/:userId",
    UPDATE_PROFILE: "/auth/profile/update",
    UPDATE_AVATAR: "/auth/profile/avatar",
    COMPLETE_ONBOARDING: "/auth/onboarding/complete",
  },
  SCHOOL: {
    GET_CLASS: "/classes",
    GET_CLASSES: "/classes",
    CREATE_CLASS: "/classes",
    EDIT_CLASS: "/classes/:classId",
    UPDATE_COURSES: "/classes/:classId/courses",
    UPDATE_SCHOOL: "/schools/update/:id",
    GET_PARENT: "/parents/school/:schoolId",
  },
  STUDENT: {
    CREATE: "/students",
  },
  STUDENTS: {
    GET_STUDENT: "/students",
    GET_STUDENTS: "/users/students",
    CREATE_STUDENT: "/users/students",
    UPDATE_STUDENT: "/users/students/:studentId",
    DELETE_STUDENT: "/users/students/:studentId",
    GET_STUDENTS_BY_CLASS: "/students/by-class/:classId",
  },
  SUBJECTS: {
    GET_SUBJECTS_BY_SCHOOL: "/subjects-courses/by-school",
    CREATE_SUBJECT: "/subjects-courses/subjects",
    UPDATE_SUBJECT: "/subjects-courses/subjects/:subjectId",
    DELETE_SUBJECT: "/subjects-courses/subjects/:subjectId",
  },
  COURSES: {
    CREATE_COURSE: "/subjects-courses/courses",
    GET_COURSE: "/courses",
    GET_COURSES: "/courses",
    UPDATE_COURSE: "/courses",
    GET_COURSES_BY_SUBJECT: "/subjects-courses/courses/subject",
    GET_COURSES_BY_SCHOOL: "/subjects-courses/courses/school",
    GET_COURSES_BY_CLASS: "/subjects-courses/courses/class",
    DELETE_COURSE: "/subjects-courses/",
    GET_COURSE_BY_ID: "",
  },
  TEACHERS: {
    GET_TEACHER: "/teachers",
    GET_TEACHERS: "/users/teachers",
    CREATE_TEACHER: "/teachers/",
    UPDATE_TEACHER_BY_COURSE: "/teachers/:userId/class-course-assignments",
    DELETE_TEACHER: "/users/teachers/:userId",
    DEACTIVATE_TEACHER: "/users/teachers/:userId",
    REGISTER_TEACHER: "/teachers/:userId",
    GET_TEACHER_BY_ID: "/teachers/:userId",
  },
  NOTIFICATION: {
    CREATE_ANNOUNCEMENT: "/notifications/announcements",
    GET_ANNOUNCEMENTS_BY_SENDER: "/notifications/announcements/sender/:senderId",
    GET_ANNOUNCEMENT_STATS_BY_SENDER:
      "/notifications/announcements/sender/:senderId/stats",
  },
  FILES: {
    UPLOAD_IMAGE: "/upload/image",
    UPLOAD_FILE: "/upload/file",
  },
  ACADEMIC: {
    CREATE_ACADEMIC_YEAR: "/academic-year-term/academic-year",
    GET_ACADEMIC_YEARS: "/academic-year-term/academic-year/school",
    CREATE_TERM: "/academic-year-term/term",
    GET_TERMS: "/academic-year-term/term/school",
    SET_CURRENT_TERM: "/academic-year-term/term/:termId/set-current",
  },
  TIMETABLE: {
    CREATE_TIMETABLE_ENTRY: "/timetable",
    GET_TIMETABLE: "/timetable?page=:page&limit=:limit",
    GET_TIMETABLE_BY_DAY: "/timetable/day/:day",
    UPDATE_TIMETABLE_ENTRY: "/timetable/:entryId",
    DELETE_TIMETABLE_ENTRY: "/timetable/:entryId",
    GET_TIMETABLE_BY_CLASS: "/timetable/class/",
  },
  COMPLAINTS: {
    CREATE_COMPLAINT: "/complaints",
    /** School staff: every complaint raised from their school. */
    GET_COMPLAINTS_BY_SCHOOL: "/complaints/by-school",
    /** Anyone: the complaints they raised themselves. */
    GET_COMPLAINTS_BY_USER: "/complaints/by-user",
    /** One complaint, by its id or its ticket number. */
    GET_COMPLAINT_BY_TICKET: "/complaints/:ticket",
  },
  LEAVE_REQUESTS: {
    GET_LEAVE_REQUESTS: "/leave-requests/school-admin/all",
    GET_LEAVE_REQUEST_BY_ID: "/leave-requests/school-admin/:requestId",
  },
  ASSESSMENTS: {
    CREATE_ASSESSMENT: "/assessments",
    GET_ASSESSMENTS_BY_SCHOOL: "/assessments/school/:schoolId",
    GET_ASSESSMENTS_BY_TERM: "/assessments/term/:termId",
    GET_ASSESSMENT_BY_ID: "/assessments/:id",
    UPDATE_ASSESSMENT: "/assessments/:id",
    DELETE_ASSESSMENT: "/assessments/:id",
  },
};

/**
 * Flat aliases over {@link API_URLS}, kept because many services address
 * endpoints by a single name. Paths are RELATIVE — `apiClient` prefixes the
 * API origin — so no deployment URL is ever baked into a service. For the rare
 * caller that needs a full URL (a raw XHR upload), use {@link absoluteUrl}.
 */
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  LOGIN: `${API_URLS.AUTH.LOGIN}`,
  INTROSPECT: `${API_URLS.AUTH.INTROSPECT}`,
  LOGOUT: `${API_URLS.AUTH.LOGOUT}`,
  FORGOT_PASSWORD: `${API_URLS.AUTH.FORGOT_PASSWORD}`,
  RESET_PASSWORD: `${API_URLS.AUTH.RESET_PASSWORD}`,
  REGISTER: `${API_URLS.AUTH.REGISTER}`,
  GET_USER_PROFILE: (userId: string) =>
    `${API_URLS.AUTH.GET_PROFILE.replace(":userId", userId)}`,
  UPDATE_USER_PROFILE: `${API_URLS.AUTH.UPDATE_PROFILE}`,
  COMPLETE_ONBOARDING: `${API_URLS.AUTH.COMPLETE_ONBOARDING}`,
  GET_CLASS: `/classes`,
  GET_CLASSES: `${API_URLS.SCHOOL.GET_CLASSES}`,
  CREATE_CLASS: `${API_URLS.SCHOOL.CREATE_CLASS}`,
  GET_SUBJECTS_BY_SCHOOL: `${API_URLS.SUBJECTS.GET_SUBJECTS_BY_SCHOOL}`,
  CREATE_SUBJECT: `${API_URLS.SUBJECTS.CREATE_SUBJECT}`,
  DELETE_SUBJECT: (subjectId: string) =>
    `${API_URLS.SUBJECTS.DELETE_SUBJECT.replace(
      ":subjectId", subjectId )}`,
  UPDATE_COURSES_BY_CLASS: (classId: string) =>
    `${API_URLS.SCHOOL.UPDATE_COURSES.replace(
      ":classId",
      classId
    )}`,
  EDIT_CLASS: (classId: string) =>
    `${API_URLS.SCHOOL.EDIT_CLASS.replace(":classId", classId)}`,
  CREATE_ANNOUNCEMENT: `${API_URLS.NOTIFICATION.CREATE_ANNOUNCEMENT}`,
  CREATE_STUDENT: `${API_URLS.STUDENT.CREATE}`,
  UPLOAD_IMAGE: `${API_URLS.FILES.UPLOAD_IMAGE}`,
  UPLOAD_FILE: `${API_URLS.FILES.UPLOAD_FILE}`,
  GET_ANNOUNCEMENTS_BY_SENDER: (senderId: string) =>
    `${API_URLS.NOTIFICATION.GET_ANNOUNCEMENTS_BY_SENDER.replace(
      ":senderId",
      senderId
    )}`,
  GET_ANNOUNCEMENT_STATS_BY_SENDER: (senderId: string) =>
    `${API_URLS.NOTIFICATION.GET_ANNOUNCEMENT_STATS_BY_SENDER.replace(
      ":senderId",
      senderId
    )}`,
  CREATE_ACADEMIC_YEAR: `${API_URLS.ACADEMIC.CREATE_ACADEMIC_YEAR}`,
  GET_ACADEMIC_YEARS: `${API_URLS.ACADEMIC.GET_ACADEMIC_YEARS}`,
  CREATE_TERM: `${API_URLS.ACADEMIC.CREATE_TERM}`,
  GET_TERMS: `${API_URLS.ACADEMIC.GET_TERMS}`,
  SET_CURRENT_TERM: (termId: string) =>
    `${API_URLS.ACADEMIC.SET_CURRENT_TERM.replace(
      ":termId",
      termId
    )}`,
  CREATE_TIMETABLE_ENTRY: `${API_URLS.TIMETABLE.CREATE_TIMETABLE_ENTRY}`,
  GET_TIMETABLE: (page: number, limit: number) =>
    `${API_URLS.TIMETABLE.GET_TIMETABLE.replace(
      ":page",
      page.toString()
    ).replace(":limit", limit.toString())}`,
  GET_TIMETABLE_BY_DAY: (day: string) =>
    `${API_URLS.TIMETABLE.GET_TIMETABLE_BY_DAY.replace(
      ":day",
      day
    )}`,
  GET_TIMETABLE_BY_CLASS: (classId: string) =>
    `/timetable/class/${classId}`,
  UPDATE_TIMETABLE_ENTRY: (entryId: string) =>
    `${API_URLS.TIMETABLE.UPDATE_TIMETABLE_ENTRY.replace(
      ":entryId",
      entryId
    )}`,
  DELETE_TIMETABLE_ENTRY: (entryId: string) =>
    `${API_URLS.TIMETABLE.DELETE_TIMETABLE_ENTRY.replace(
      ":entryId",
      entryId
    )}`,
  CREATE_COMPLAINT: `${API_URLS.COMPLAINTS.CREATE_COMPLAINT}`,
  GET_COMPLAINTS_BY_SCHOOL: `${API_URLS.COMPLAINTS.GET_COMPLAINTS_BY_SCHOOL}`,
  GET_COMPLAINTS_BY_USER: `${API_URLS.COMPLAINTS.GET_COMPLAINTS_BY_USER}`,
  GET_COMPLAINT_BY_TICKET: (ticket: string) =>
    `${API_URLS.COMPLAINTS.GET_COMPLAINT_BY_TICKET.replace(
      ":ticket",
      ticket
    )}`,
  GET_STUDENTS: `${API_URLS.STUDENTS.GET_STUDENTS}`,
  GET_PARENT: (schoolId: string) => `${API_URLS.SCHOOL.GET_PARENT.replace(":schoolId", schoolId)}`,
  CREATE_STUDENT_NEW: `${API_URLS.STUDENTS.CREATE_STUDENT}`,
  UPDATE_STUDENT: `${API_URLS.STUDENTS.UPDATE_STUDENT}`,
  DELETE_STUDENT: `${API_URLS.STUDENTS.DELETE_STUDENT}`,

  CREATE_TEACHER: `${API_URLS.TEACHERS.CREATE_TEACHER}`,
  GET_TEACHER: `${API_URLS.TEACHERS.GET_TEACHER}`,
  GET_TEACHER_BY_ID: (userId: string) =>
    `${API_URLS.TEACHERS.GET_TEACHER_BY_ID.replace(
      ":teacherId",
      userId
    )}`,
  // GET_TEACHER_BY_ID: (userId: string) => `${API_URLS.TEACHERS.GET_TEACHER_BY_ID.replace(':teacherId', userId)}`,
  UPDATE_TEACHER_BY_COURSE: (userId: string) =>
    `${API_URLS.TEACHERS.UPDATE_TEACHER_BY_COURSE.replace(
      ":teacherId",
      userId
    )}`,
  GET_TEACHERS: `${API_URLS.TEACHERS.GET_TEACHERS}`,
  REGISTER_TEACHER: `${API_URLS.TEACHERS.REGISTER_TEACHER}`,
  DEACTIVATE_TEACHER: `${API_URLS.TEACHERS.DEACTIVATE_TEACHER}`,
  GET_STUDENT: `${API_URLS.STUDENTS.GET_STUDENT}`,
  STUDENTS: `/students`,

  CREATE_COURSE: `${API_URLS.COURSES.CREATE_COURSE}`,
  GET_COURSES: `${API_URLS.COURSES.GET_COURSES}`,
  UPDATE_COURSE: `${API_URLS.COURSES.UPDATE_COURSE}`,
  DELETE_COURSE: `${API_URLS.COURSES.DELETE_COURSE}`,
  GET_COURSE_BY_ID: `${API_URLS.COURSES.GET_COURSE_BY_ID}`,
  GET_COURSES_BY_SUBJECT: `${API_URLS.COURSES.GET_COURSES_BY_SUBJECT}`,
  GET_COURSES_BY_SCHOOL: `${API_URLS.COURSES.GET_COURSES_BY_SCHOOL}`,
  GET_COURSES_BY_CLASS: (classId: string) =>
    `${API_URLS.COURSES.GET_COURSES_BY_CLASS}/${classId}`,
  GET_STUDENTS_BY_CLASS: `${API_URLS.STUDENTS.GET_STUDENTS_BY_CLASS}`,
  GET_STUDENTS_BY_CLASS_ID: (classId: string) =>
    `${API_URLS.STUDENTS.GET_STUDENTS_BY_CLASS.replace(
      ":classId",
      classId
    )}`,

  GET_LEAVE_REQUESTS: `${API_URLS.LEAVE_REQUESTS.GET_LEAVE_REQUESTS}`,
  UPDATE_SCHOOL: (schoolId: string) =>
    `${API_URLS.SCHOOL.UPDATE_SCHOOL.replace(":id", schoolId)}`,

  // Transit
  TRANSIT_DASHBOARD: `/transit/dashboard`,
  TRANSIT_LIST_TRANSFERS: `/transit/transfers`,
  TRANSIT_GET_TRANSFER: (id: string) => `/transit/transfers/${id}`,
  TRANSIT_CREATE_TRANSFER: `/transit/transfers`,
  TRANSIT_SOURCE_APPROVE: (id: string) => `/transit/transfers/${id}/source-approve`,
  TRANSIT_TARGET_APPROVE: (id: string) => `/transit/transfers/${id}/target-approve`,
  TRANSIT_ACCEPT: (id: string) => `/transit/transfers/${id}/accept`,
  TRANSIT_REJECT: (id: string) => `/transit/transfers/${id}/reject`,
  TRANSIT_CANCEL_TRANSFER: (id: string) => `/transit/transfers/${id}/cancel`,
  TRANSIT_STUDENT_SNAPSHOT: (studentId: string) => `/transit/students/${studentId}/snapshot`,
  TRANSIT_LIST_PROMOTIONS: `/transit/promotions`,
  TRANSIT_GET_PROMOTION: (id: string) => `/transit/promotions/${id}`,
  TRANSIT_CREATE_PROMOTION: `/transit/promotions`,
  TRANSIT_VALIDATE_PROMOTION: (id: string) => `/transit/promotions/${id}/validate`,
  TRANSIT_COMMIT_PROMOTION: (id: string) => `/transit/promotions/${id}/commit`,
  TRANSIT_CANCEL_PROMOTION: (id: string) => `/transit/promotions/${id}/cancel`,
  TRANSIT_PRE_CLOSE_SUMMARY: (yearId: string) => `/transit/academic-years/${yearId}/pre-close-summary`,
  TRANSIT_CLOSE_YEAR: (yearId: string) => `/transit/academic-years/${yearId}/close`,
  TRANSIT_CLOSURE_SNAPSHOT: (yearId: string) => `/transit/academic-years/${yearId}/snapshot`,
  SCHOOLS_SEARCH: `/schools/search`,

  // Sub-Admin management
  SUB_ADMINS: `/sub-admins`,
  SUB_ADMIN_BY_ID: (id: string) => `/sub-admins/${id}`,
  SUB_ADMIN_CREATE: `/sub-admins`,
  SUB_ADMIN_PROMOTE_TEACHER: `/sub-admins/promote-teacher`,
  SUB_ADMIN_PERMISSIONS: (id: string) =>
    `/sub-admins/${id}/permissions`,
  SUB_ADMIN_TOGGLE_STATUS: (id: string) =>
    `/sub-admins/${id}/toggle-status`,
  SUB_ADMIN_DEMOTE: (id: string) =>
    `/sub-admins/${id}/demote`,
} as const;
