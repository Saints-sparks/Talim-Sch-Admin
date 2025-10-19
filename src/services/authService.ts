import { apiClient } from "@/lib/apiClient";
import { API_BASE_URL, API_URLS } from "@/app/lib/api/config";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  // Add other user properties as needed
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}${API_URLS.AUTH.LOGIN}`,
        credentials
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async refreshToken(): Promise<{
    success: boolean;
    accessToken?: string;
    user?: User;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_URLS.AUTH.REFRESH}`, {
        method: "POST",
        credentials: "include", // Important for httpOnly cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Token refresh failed");
      }

      return {
        success: true,
        accessToken: data.data?.accessToken,
        user: data.data?.user,
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      return { success: false };
    }
  }

  async introspectUser(): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}${API_URLS.AUTH.INTROSPECT}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "User introspection failed");
      }

      return {
        success: true,
        user: data.data,
      };
    } catch (error) {
      console.error("User introspection error:", error);
      return { success: false };
    }
  }

  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}${API_URLS.AUTH.LOGOUT}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Logout failed");
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server logout fails, we still consider it successful
      // since we'll clear client-side state
      return { success: true };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_URLS.AUTH.FORGOT_PASSWORD}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset request failed");
      }

      return data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_URLS.AUTH.RESET_PASSWORD}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}${API_URLS.AUTH.CHANGE_PASSWORD}`,
        {
          currentPassword,
          newPassword,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password change failed");
      }

      return data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
