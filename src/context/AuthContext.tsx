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

  // ✅ FIXED: Set access token and update user info + localStorage
  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);

    // Update apiClient with new token
    apiClient.setAccessToken(token);

    if (token) {
      // Store in localStorage for service functions
      localStorage.setItem("accessToken", token);
      // Get updated user info when token changes
      introspectToken(token);
    } else {
      // Remove from localStorage when clearing token
      localStorage.removeItem("accessToken");
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
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
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
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          deviceToken: "123456",
          platform: "web",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      const { access_token } = data;

      // Store access token (now also in localStorage via setAccessToken)
      setAccessToken(access_token);

      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}${API_URLS.AUTH.REFRESH}`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const { access_token } = data;
          setAccessToken(access_token);
          return true;
        } else {
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

  // ✅ FIXED: Logout function - clear localStorage
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}${API_URLS.AUTH.LOGOUT}`, {
        method: "POST",
        credentials: "include",
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear everything
      setAccessToken(null); // This also clears localStorage via setAccessToken
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

  // ✅ FIXED: Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored token first
        const storedToken = localStorage.getItem("accessToken");
        
        if (storedToken) {
          // We have a stored token, try to use it
          setAccessTokenState(storedToken);
          apiClient.setAccessToken(storedToken);
          await introspectToken(storedToken);
        } else {
          // No stored token, try to refresh
          const success = await refreshToken();
          if (!success) {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch (error) {
                localStorage.removeItem("user");
              }
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
    }, 10 * 60 * 1000);

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
