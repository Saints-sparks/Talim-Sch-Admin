export const API_BASE_URL = 'https://talimbe-v2-li38.onrender.com';

export const API_URLS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    INTROSPECT: '/auth/introspect',
    LOGOUT: '/auth/logout'
  },
  SCHOOL: {
    GET_CLASS: '/classes/:classId',
    GET_CLASSES: '/classes',
    CREATE_CLASS: '/classes',
    EDIT_CLASS: '/classes/:classId'
  },
  STUDENT: {
    CREATE: '/students'
  },
  STUDENTS: {
    GET_STUDENTS: '/users/students',
    CREATE_STUDENT: '/users/students',
    UPDATE_STUDENT: '/users/students/:studentId',
    DELETE_STUDENT: '/users/students/:studentId',
    GET_STUDENTS_BY_CLASS: '/students/by-class/:classId',
  },
  NOTIFICATION: {
    CREATE_ANNOUNCEMENT: '/notifications/announcements',
    GET_ANNOUNCEMENTS_BY_SENDER: '/notifications/announcements/sender/:senderId?page=:page&limit=:limit',
  },
  FILES: {
    UPLOAD_IMAGE: '/upload/image'
  },
  ACADEMIC: {
    CREATE_ACADEMIC_YEAR: '/academic-year-term/academic-year',
    GET_ACADEMIC_YEARS: '/academic-year-term/academic-year/school',
    CREATE_TERM: '/academic-year-term/term',
    GET_TERMS: '/academic-year-term/term/school',
    SET_CURRENT_TERM: '/academic-year-term/term/:termId/set-current',
  },
  TIMETABLE: {
    CREATE_TIMETABLE_ENTRY: '/timetable/entry',
    GET_TIMETABLE: '/timetable?page=:page&limit=:limit',
    GET_TIMETABLE_BY_DAY: '/timetable/day/:day',
    UPDATE_TIMETABLE_ENTRY: '/timetable/entry/:entryId',
    DELETE_TIMETABLE_ENTRY: '/timetable/entry/:entryId'
  },
  COMPLAINTS: {
    CREATE_COMPLAINT: '/complaints',
    GET_COMPLAINTS: '/complaints/by-user',
    GET_COMPLAINT_BY_TICKET: '/complaints/:ticket'
  }
};

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  LOGIN: `${API_BASE_URL}${API_URLS.AUTH.LOGIN}`,
  INTROSPECT: `${API_BASE_URL}${API_URLS.AUTH.INTROSPECT}`,
  LOGOUT: `${API_BASE_URL}${API_URLS.AUTH.LOGOUT}`,
  REGISTER: `${API_BASE_URL}${API_URLS.AUTH.REGISTER}`,
  GET_CLASS: (classId: string) => `${API_BASE_URL}${API_URLS.SCHOOL.GET_CLASS.replace(':classId', classId)}`,
  GET_CLASSES: `${API_BASE_URL}${API_URLS.SCHOOL.GET_CLASSES}`,
  CREATE_CLASS: `${API_BASE_URL}${API_URLS.SCHOOL.CREATE_CLASS}`,
  EDIT_CLASS: (classId: string) => `${API_BASE_URL}${API_URLS.SCHOOL.EDIT_CLASS.replace(':classId', classId)}`,
  CREATE_ANNOUNCEMENT: `${API_BASE_URL}${API_URLS.NOTIFICATION.CREATE_ANNOUNCEMENT}`,
  CREATE_STUDENT: `${API_BASE_URL}${API_URLS.STUDENT.CREATE}`,
  UPLOAD_IMAGE: `${API_BASE_URL}${API_URLS.FILES.UPLOAD_IMAGE}`,
  GET_ANNOUNCEMENTS_BY_SENDER: (senderId: string, page: number, limit: number) => 
    `${API_BASE_URL}${API_URLS.NOTIFICATION.GET_ANNOUNCEMENTS_BY_SENDER.replace(':senderId', senderId).replace(':page', page.toString()).replace(':limit', limit.toString())}`,
  CREATE_ACADEMIC_YEAR: `${API_BASE_URL}${API_URLS.ACADEMIC.CREATE_ACADEMIC_YEAR}`,
  GET_ACADEMIC_YEARS: `${API_BASE_URL}${API_URLS.ACADEMIC.GET_ACADEMIC_YEARS}`,
  CREATE_TERM: `${API_BASE_URL}${API_URLS.ACADEMIC.CREATE_TERM}`,
  GET_TERMS: `${API_BASE_URL}${API_URLS.ACADEMIC.GET_TERMS}`,
  SET_CURRENT_TERM: (termId: string) => `${API_BASE_URL}${API_URLS.ACADEMIC.SET_CURRENT_TERM.replace(':termId', termId)}`,
  CREATE_TIMETABLE_ENTRY: `${API_BASE_URL}${API_URLS.TIMETABLE.CREATE_TIMETABLE_ENTRY}`,
  GET_TIMETABLE: (page: number, limit: number) => `${API_BASE_URL}${API_URLS.TIMETABLE.GET_TIMETABLE.replace(':page', page.toString()).replace(':limit', limit.toString())}`,
  GET_TIMETABLE_BY_DAY: (day: string) => `${API_BASE_URL}${API_URLS.TIMETABLE.GET_TIMETABLE_BY_DAY.replace(':day', day)}`,
  UPDATE_TIMETABLE_ENTRY: (entryId: string) => `${API_BASE_URL}${API_URLS.TIMETABLE.UPDATE_TIMETABLE_ENTRY.replace(':entryId', entryId)}`,
  DELETE_TIMETABLE_ENTRY: (entryId: string) => `${API_BASE_URL}${API_URLS.TIMETABLE.DELETE_TIMETABLE_ENTRY.replace(':entryId', entryId)}`,
  CREATE_COMPLAINT: `${API_BASE_URL}${API_URLS.COMPLAINTS.CREATE_COMPLAINT}`,
  GET_COMPLAINTS: `${API_BASE_URL}${API_URLS.COMPLAINTS.GET_COMPLAINTS}`,
  GET_COMPLAINT_BY_TICKET: (ticket: string) => `${API_BASE_URL}${API_URLS.COMPLAINTS.GET_COMPLAINT_BY_TICKET.replace(':ticket', ticket)}`,
  GET_STUDENTS: `${API_BASE_URL}${API_URLS.STUDENTS.GET_STUDENTS}`,
  CREATE_STUDENT_NEW: `${API_BASE_URL}${API_URLS.STUDENTS.CREATE_STUDENT}`,
  UPDATE_STUDENT: (studentId: string) => `${API_BASE_URL}${API_URLS.STUDENTS.UPDATE_STUDENT.replace(':studentId', studentId)}`,
  DELETE_STUDENT: (studentId: string) => `${API_BASE_URL}${API_URLS.STUDENTS.DELETE_STUDENT.replace(':studentId', studentId)}`,
  GET_STUDENTS_BY_CLASS: (classId: string) => `${API_BASE_URL}${API_URLS.STUDENTS.GET_STUDENTS_BY_CLASS.replace(':classId', classId)}`,
} as const;