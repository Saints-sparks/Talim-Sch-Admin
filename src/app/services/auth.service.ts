import nookies from "nookies";
import { API_BASE_URL, API_ENDPOINTS } from "../lib/api/config";
import { getLocalStorageItem } from "../utils/localStorage";

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

export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "ADMIN"
  | "PARENT"
  | "SCHOOL_ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string; // ISO date string
  gender?: "male" | "female" | "other";
  userAvatar?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isTwoFactorEnabled?: boolean;
}

export interface UserProfile {
  _id: string;
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  schoolId: {
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
    active: boolean;
    logo?: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  userAvatar?: string;
  isTwoFactorEnabled: boolean;
  devices: Array<{
    deviceToken: string;
    platform: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...credentials,
          deviceToken: credentials.deviceToken || "web",
          platform: credentials.platform || "web",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to login");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  introspectToken: async (token: string): Promise<TokenIntrospectResponse> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.INTROSPECT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to validate token");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Token introspection error:", error);
      throw error;
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.FORGOT_PASSWORD}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset code");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  resetPassword: async (
    email: string,
    token: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RESET_PASSWORD}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, token, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  async logout() {
    const cookies = nookies.get(null);
    const accessToken = cookies.access_token;

    if (!accessToken) {
      throw new Error("No access token found");
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.LOGOUT}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "*/*",
        },
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear cookies
      nookies.destroy(null, "access_token");
      nookies.destroy(null, "refresh_token");

      // Clear localStorage
      localStorage.removeItem("user");

      return await response.json();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  getUserProfile: async (userId: string): Promise<UserProfile> => {
    try {
      const token = getLocalStorageItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(API_ENDPOINTS.GET_USER_PROFILE(userId), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch user profile: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  },

  updateUserProfile: async (
    payload: UpdateUserProfilePayload
  ): Promise<UserProfile> => {
    try {
      const token = getLocalStorageItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      console.log("Updating user profile with payload:", payload);

      const response = await fetch(API_ENDPOINTS.UPDATE_USER_PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update user profile: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("User profile updated successfully:", data);
      return data;
    } catch (error) {
      console.error("Update user profile error:", error);
      throw error;
    }
  },
};
