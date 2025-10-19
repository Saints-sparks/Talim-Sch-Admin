"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { API_BASE_URL, API_URLS } from "@/app/lib/api/config";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  schoolLogo?: string;
  userAvatar?: string;
  phoneNumber?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  studentId?: string | null;
  classId?: string | null;
  className?: string | null;
  termId?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  // Set access token and update user info
  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);

    // Update apiClient with new token
    apiClient.setAccessToken(token);

    if (token) {
      // Get updated user info when token changes
      introspectToken(token);
    }
  };

  // Initialize apiClient on mount
  useEffect(() => {
    apiClient.initialize(accessToken, refreshToken);
  }, [accessToken]);

  // Introspect token to get user info using access token
  const introspectToken = async (token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_URLS.AUTH.INTROSPECT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Use access token for introspection
          },
          credentials: "include", // Still include for CORS/cookie support
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Store user in localStorage for persistence across tabs
        localStorage.setItem("user", JSON.stringify(data.user));

        // Trigger auth event for WebSocket
        window.dispatchEvent(
          new CustomEvent("auth-changed", {
            detail: { type: "login", user: data.user },
          })
        );
      } else {
        throw new Error("Token introspection failed");
      }
    } catch (error) {
      console.error("Error introspecting token:", error);
      setAccessToken(null);
      setUser(null);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_URLS.AUTH.LOGIN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for httpOnly cookies!
        body: JSON.stringify({
          email,
          password,
          deviceToken: "123456", // You can generate a proper device token
          platform: "web",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      const { access_token } = data;

      // Store access token in memory only (not localStorage)
      setAccessToken(access_token);

      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    // If there's already a refresh in progress, wait for it
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Create new refresh promise
    refreshPromiseRef.current = (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}${API_URLS.AUTH.REFRESH}`,
          {
            method: "POST",
            credentials: "include", // Sends httpOnly cookie automatically
          }
        );

        if (response.ok) {
          const data = await response.json();
          const { access_token } = data;
          setAccessToken(access_token);
          return true;
        } else {
          // Refresh failed - user needs to login again
          setAccessToken(null);
          setUser(null);
          return false;
        }
      } catch (error) {
        console.error("Refresh token error:", error);
        setAccessToken(null);
        setUser(null);
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}${API_URLS.AUTH.LOGOUT}`, {
        method: "POST",
        credentials: "include", // Clears httpOnly cookie
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear in-memory access token and user data
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("user");

      // Trigger auth event for WebSocket
      window.dispatchEvent(
        new CustomEvent("auth-changed", {
          detail: { type: "logout" },
        })
      );

      toast.success("Logged out successfully");
    }
  };

  // Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to refresh token on app load to check if session exists
        const success = await refreshToken();
        if (!success) {
          // Check if user data exists in localStorage (for cases where token expired but user data is still there)
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (error) {
              localStorage.removeItem("user");
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before it expires (every 10 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(() => {
      refreshToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken]);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
