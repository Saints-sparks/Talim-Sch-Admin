export const API_BASE_URL = 'http://localhost:5000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  INTROSPECT: `${API_BASE_URL}/auth/introspect`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  // Add other endpoints as needed
} as const; 