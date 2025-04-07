import nookies from 'nookies';
import { API_BASE_URL, API_ENDPOINTS } from '../lib/api/config';

export interface LoginCredentials {
  email: string;
  password: string;
  deviceToken?: string;
  platform?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId: string | null;
  phoneNumber: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface TokenIntrospectResponse {
  active: boolean;
  exp: number;
  iat: number;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...credentials,
          deviceToken: credentials.deviceToken || 'web',
          platform: credentials.platform || 'web',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to login');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  introspectToken: async (token: string): Promise<TokenIntrospectResponse> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.INTROSPECT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate token');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token introspection error:', error);
      throw error;
    }
  },

  async logout() {
    const cookies = nookies.get(null);
    const accessToken = cookies.access_token;

    if (!accessToken) {
      throw new Error('No access token found');
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept': '*/*',
        },
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear cookies
      nookies.destroy(null, 'access_token');
      nookies.destroy(null, 'refresh_token');
      
      // Clear localStorage
      localStorage.removeItem('user');

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
}; 