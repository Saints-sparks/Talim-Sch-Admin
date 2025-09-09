import exp from "constants";
import { Geist_Mono } from "next/font/google";

//export const API_BASE_URL = 'https://talimbe-v2-li38.onrender.com';

export const API_BASE_URL = "http://localhost:5005";

// export const API_BASE_URL = "https://talim-be-dev.onrender.com";

export const API_URLS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    INTROSPECT: "/auth/introspect",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  SCHOOL: {
    GET_CLASS: "/classes",
    GET_CLASSES: "/classes",
    CREATE_CLASS: "/classes",
    EDIT_CLASS: "/classes/:classId",
    UPDATE_COURSES: "/classes/:classId/courses",
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
  },
  COURSES: {
    CREATE_COURSE: "/subjects-courses/courses",
    GET_COURSE: "/courses",
    GET_COURSES: "/courses",
    UPDATE_COURSE: "/courses",
    GET_COURSES_BY_SUBJECT: "/subjects-courses/courses/subject",
    GET_COURSES_BY_SCHOOL: "/subjects-courses/courses/school",
    DELETE_COURSE: "",
    GET_COURSE_BY_ID: "",
  },
  TEACHERS: {
    GET_TEACHER: "/teachers",
    GET_TEACHERS: "/users/teachers",
    CREATE_TEACHER: "/teachers/",
    UPDATE_TEACHER: "/users/teachers",
    UPDATE_TEACHER_BY_COURSE: "/teachers/:userId/class-course-assignments",
    DELETE_TEACHER: "/users/teachers/:userId",
    DEACTIVATE_TEACHER: "/users/teachers/:userId",
    REGISTER_TEACHER: "/teachers/:userId",
    GET_TEACHER_BY_ID: "/teachers/:userId",
  },
  NOTIFICATION: {
    CREATE_ANNOUNCEMENT: "/notifications/announcements",
    GET_ANNOUNCEMENTS_BY_SENDER:
      "/notifications/announcements/sender/:senderId?page=:page&limit=:limit",
  },
  FILES: {
    UPLOAD_IMAGE: "/upload/image",
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
    UPDATE_TIMETABLE_ENTRY: "/timetable/entry/:entryId",
    DELETE_TIMETABLE_ENTRY: "/timetable/entry/:entryId",
    GET_TIMETABLE_BY_CLASS: "/timetable/class/",
  },
  COMPLAINTS: {
    CREATE_COMPLAINT: "/complaints",
    GET_COMPLAINTS: "/complaints/by-user",
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

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  LOGIN: `${API_BASE_URL}${API_URLS.AUTH.LOGIN}`,
  INTROSPECT: `${API_BASE_URL}${API_URLS.AUTH.INTROSPECT}`,
  LOGOUT: `${API_BASE_URL}${API_URLS.AUTH.LOGOUT}`,
  FORGOT_PASSWORD: `${API_BASE_URL}${API_URLS.AUTH.FORGOT_PASSWORD}`,
  RESET_PASSWORD: `${API_BASE_URL}${API_URLS.AUTH.RESET_PASSWORD}`,
  REGISTER: `${API_BASE_URL}${API_URLS.AUTH.REGISTER}`,
  GET_CLASS: `${API_BASE_URL}/classes`,
  GET_CLASSES: `${API_BASE_URL}${API_URLS.SCHOOL.GET_CLASSES}`,
  CREATE_CLASS: `${API_BASE_URL}${API_URLS.SCHOOL.CREATE_CLASS}`,
  GET_SUBJECTS_BY_SCHOOL: `${API_BASE_URL}${API_URLS.SUBJECTS.GET_SUBJECTS_BY_SCHOOL}`,
  CREATE_SUBJECT: `${API_BASE_URL}${API_URLS.SUBJECTS.CREATE_SUBJECT}`,
  UPDATE_COURSES_BY_CLASS: (classId: string) =>
    `${API_BASE_URL}${API_URLS.SCHOOL.UPDATE_COURSES.replace(
      ":classId",
      classId
    )}`,
  EDIT_CLASS: (classId: string) =>
    `${API_BASE_URL}${API_URLS.SCHOOL.EDIT_CLASS.replace(":classId", classId)}`,
  CREATE_ANNOUNCEMENT: `${API_BASE_URL}${API_URLS.NOTIFICATION.CREATE_ANNOUNCEMENT}`,
  CREATE_STUDENT: `${API_BASE_URL}${API_URLS.STUDENT.CREATE}`,
  UPLOAD_IMAGE: `${API_BASE_URL}${API_URLS.FILES.UPLOAD_IMAGE}`,
  GET_ANNOUNCEMENTS_BY_SENDER: (
    senderId: string,
    page: number,
    limit: number
  ) =>
    `${API_BASE_URL}${API_URLS.NOTIFICATION.GET_ANNOUNCEMENTS_BY_SENDER.replace(
      ":senderId",
      senderId
    )
      .replace(":page", page.toString())
      .replace(":limit", limit.toString())}`,
  CREATE_ACADEMIC_YEAR: `${API_BASE_URL}${API_URLS.ACADEMIC.CREATE_ACADEMIC_YEAR}`,
  GET_ACADEMIC_YEARS: `${API_BASE_URL}${API_URLS.ACADEMIC.GET_ACADEMIC_YEARS}`,
  CREATE_TERM: `${API_BASE_URL}${API_URLS.ACADEMIC.CREATE_TERM}`,
  GET_TERMS: `${API_BASE_URL}${API_URLS.ACADEMIC.GET_TERMS}`,
  SET_CURRENT_TERM: (termId: string) =>
    `${API_BASE_URL}${API_URLS.ACADEMIC.SET_CURRENT_TERM.replace(
      ":termId",
      termId
    )}`,
  CREATE_TIMETABLE_ENTRY: `${API_BASE_URL}${API_URLS.TIMETABLE.CREATE_TIMETABLE_ENTRY}`,
  GET_TIMETABLE: (page: number, limit: number) =>
    `${API_BASE_URL}${API_URLS.TIMETABLE.GET_TIMETABLE.replace(
      ":page",
      page.toString()
    ).replace(":limit", limit.toString())}`,
  GET_TIMETABLE_BY_DAY: (day: string) =>
    `${API_BASE_URL}${API_URLS.TIMETABLE.GET_TIMETABLE_BY_DAY.replace(
      ":day",
      day
    )}`,
  GET_TIMETABLE_BY_CLASS: `${API_BASE_URL}/timetable/class`,
  UPDATE_TIMETABLE_ENTRY: (entryId: string) =>
    `${API_BASE_URL}${API_URLS.TIMETABLE.UPDATE_TIMETABLE_ENTRY.replace(
      ":entryId",
      entryId
    )}`,
  DELETE_TIMETABLE_ENTRY: (entryId: string) =>
    `${API_BASE_URL}${API_URLS.TIMETABLE.DELETE_TIMETABLE_ENTRY.replace(
      ":entryId",
      entryId
    )}`,
  CREATE_COMPLAINT: `${API_BASE_URL}${API_URLS.COMPLAINTS.CREATE_COMPLAINT}`,
  GET_COMPLAINTS: `${API_BASE_URL}${API_URLS.COMPLAINTS.GET_COMPLAINTS}`,
  GET_COMPLAINT_BY_TICKET: (ticket: string) =>
    `${API_BASE_URL}${API_URLS.COMPLAINTS.GET_COMPLAINT_BY_TICKET.replace(
      ":ticket",
      ticket
    )}`,
  GET_STUDENTS: `${API_BASE_URL}${API_URLS.STUDENTS.GET_STUDENTS}`,
  CREATE_STUDENT_NEW: `${API_BASE_URL}${API_URLS.STUDENTS.CREATE_STUDENT}`,
  UPDATE_STUDENT: `${API_BASE_URL}${API_URLS.STUDENTS.UPDATE_STUDENT}`,
  DELETE_STUDENT: `${API_BASE_URL}${API_URLS.STUDENTS.DELETE_STUDENT}`,

  CREATE_TEACHER: `${API_BASE_URL}${API_URLS.TEACHERS.CREATE_TEACHER}`,
  GET_TEACHER: `${API_BASE_URL}${API_URLS.TEACHERS.GET_TEACHER}`,
  GET_TEACHER_BY_ID: (userId: string) =>
    `${API_BASE_URL}${API_URLS.TEACHERS.GET_TEACHER_BY_ID.replace(
      ":teacherId",
      userId
    )}`,
  // GET_TEACHER_BY_ID: (userId: string) => `${API_BASE_URL}${API_URLS.TEACHERS.GET_TEACHER_BY_ID.replace(':teacherId', userId)}`,
  UPDATE_TEACHER_BY_COURSE: (userId: string) =>
    `${API_BASE_URL}${API_URLS.TEACHERS.UPDATE_TEACHER_BY_COURSE.replace(
      ":teacherId",
      userId
    )}`,
  GET_TEACHERS: `${API_BASE_URL}${API_URLS.TEACHERS.GET_TEACHERS}`,
  REGISTER_TEACHER: `${API_BASE_URL}${API_URLS.TEACHERS.REGISTER_TEACHER}`,
  UPDATE_TEACHER: `${API_BASE_URL}${API_URLS.TEACHERS.UPDATE_TEACHER}`,
  DEACTIVATE_TEACHER: `${API_BASE_URL}${API_URLS.TEACHERS.DEACTIVATE_TEACHER}`,
  GET_STUDENT: `${API_BASE_URL}${API_URLS.STUDENTS.GET_STUDENT}`,
  STUDENTS: `${API_BASE_URL}/students`,

  CREATE_COURSE: `${API_BASE_URL}${API_URLS.COURSES.CREATE_COURSE}`,
  GET_COURSES: `${API_BASE_URL}${API_URLS.COURSES.GET_COURSES}`,
  UPDATE_COURSE: `${API_BASE_URL}${API_URLS.COURSES.UPDATE_COURSE}`,
  DELETE_COURSE: `${API_BASE_URL}${API_URLS.COURSES.DELETE_COURSE}`,
  GET_COURSE_BY_ID: `${API_BASE_URL}${API_URLS.COURSES.GET_COURSE_BY_ID}`,
  GET_COURSES_BY_SUBJECT: `${API_BASE_URL}${API_URLS.COURSES.GET_COURSES_BY_SUBJECT}`,
  GET_COURSES_BY_SCHOOL: `${API_BASE_URL}${API_URLS.COURSES.GET_COURSES_BY_SCHOOL}`,
  GET_STUDENTS_BY_CLASS: `${API_BASE_URL}${API_URLS.STUDENTS.GET_STUDENTS_BY_CLASS}`,
  GET_STUDENTS_BY_CLASS_ID: (classId: string) =>
    `${API_BASE_URL}${API_URLS.STUDENTS.GET_STUDENTS_BY_CLASS.replace(
      ":classId",
      classId
    )}`,

  GET_LEAVE_REQUESTS: `${API_BASE_URL}${API_URLS.LEAVE_REQUESTS.GET_LEAVE_REQUESTS}`,
} as const;
