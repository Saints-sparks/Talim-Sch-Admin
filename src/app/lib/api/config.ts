export const API_BASE_URL = 'http://localhost:5000';

export const API_URLS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  },
  SCHOOL: {
    GET_CLASSES: '/classes'
  },
  STUDENT: {
    CREATE: '/students'
  },
  NOTIFICATION: {
    CREATE_ANNOUNCEMENT: '/notifications/announcements',
    GET_ANNOUNCEMENTS_BY_SENDER: '/notifications/announcements/sender/:senderId?page=:page&limit=:limit',
  },
  FILES: {
    UPLOAD_IMAGE: '/upload/image'
  }
};

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}${API_URLS.AUTH.LOGIN}`,
  INTROSPECT: `${API_BASE_URL}/auth/introspect`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REGISTER: `${API_BASE_URL}${API_URLS.AUTH.REGISTER}`,
  GET_CLASSES: `${API_BASE_URL}${API_URLS.SCHOOL.GET_CLASSES}`,
  CREATE_ANNOUNCEMENT: `${API_BASE_URL}${API_URLS.NOTIFICATION.CREATE_ANNOUNCEMENT}`,
  CREATE_STUDENT: `${API_BASE_URL}${API_URLS.STUDENT.CREATE}`,
  UPLOAD_IMAGE: `${API_BASE_URL}${API_URLS.FILES.UPLOAD_IMAGE}`,
  GET_ANNOUNCEMENTS_BY_SENDER: `${API_BASE_URL}${API_URLS.NOTIFICATION.GET_ANNOUNCEMENTS_BY_SENDER}`,
  // Add other endpoints as needed
} as const;