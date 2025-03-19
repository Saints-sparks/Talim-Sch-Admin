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
  }
};

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}${API_URLS.AUTH.LOGIN}`,
  INTROSPECT: `${API_BASE_URL}/auth/introspect`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REGISTER: `${API_BASE_URL}${API_URLS.AUTH.REGISTER}`,
  GET_CLASSES: `${API_BASE_URL}${API_URLS.SCHOOL.GET_CLASSES}`,
  CREATE_STUDENT: `${API_BASE_URL}${API_URLS.STUDENT.CREATE}`,
  // Add other endpoints as needed
} as const;