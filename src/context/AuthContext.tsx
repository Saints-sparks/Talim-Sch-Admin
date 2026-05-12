"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { API_BASE_URL, API_URLS } from "@/app/lib/api/config";
import { toast } from "@/components/CustomToast";
import { apiClient } from "@/lib/apiClient";

interface User {
  _id?: string;
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
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, keepSignedIn?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
  updateUser: (partial: Partial<User>) => void;
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

  const getStoredAccessToken = () =>
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  const persistSession = (
    token: string,
    userData: User,
    keepSignedIn = true
  ) => {
    setAccessTokenState(token);
    apiClient.setAccessToken(token);
    setUser(userData);

    if (keepSignedIn) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("keepSignedIn", "true");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
    } else {
      // Session-only: cleared automatically when the browser tab/window closes
      sessionStorage.setItem("accessToken", token);
      sessionStorage.setItem("user", JSON.stringify(userData));
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.setItem("keepSignedIn", "false");
    }
  };

  const clearSession = useCallback((redirectToLogin = false) => {
    setAccessTokenState(null);
    apiClient.setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("keepSignedIn");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    if (
      redirectToLogin &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/"
    ) {
      window.location.assign("/");
    }
  }, []);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    apiClient.setAccessToken(token);

    if (token) {
      // Respect the original keepSignedIn preference when storing the refreshed token
      const keepSignedIn = localStorage.getItem("keepSignedIn") !== "false";
      if (keepSignedIn) {
        localStorage.setItem("accessToken", token);
        sessionStorage.removeItem("accessToken");
      } else {
        sessionStorage.setItem("accessToken", token);
        localStorage.removeItem("accessToken");
      }
      introspectToken(token);
    } else {
      clearSession();
    }
  };

  // Initialize apiClient on mount
  useEffect(() => {
    apiClient.initialize(accessToken, refreshToken);
  }, [accessToken]);

  // Introspect token to get user info using access token
  const introspectToken = async (token: string, redirectOnFailure = true) => {
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
        if (data.user?.role !== "school_admin") {
          throw new Error("Access denied for this portal");
        }

        setUser(data.user);

        const keepSignedIn = localStorage.getItem("keepSignedIn") !== "false";
        if (keepSignedIn) {
          localStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.removeItem("user");
        } else {
          sessionStorage.setItem("user", JSON.stringify(data.user));
          localStorage.removeItem("user");
        }

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
      if (redirectOnFailure) {
        clearSession(true);
      }
      throw error;
    }
  };

  // Login function — includes RBAC: only school_admin role is permitted
  const login = async (
    email: string,
    password: string,
    keepSignedIn = true
  ): Promise<boolean> => {
    try {
      // Step 1: Authenticate
      const response = await fetch(`${API_BASE_URL}${API_URLS.AUTH.LOGIN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          rememberMe: keepSignedIn,
          deviceToken: "123456",
          platform: "web",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.message || "Login failed";
        // Make credential errors descriptive
        if (response.status === 401) {
          throw new Error("Incorrect email or password. Please check your credentials and try again.");
        }
        throw new Error(msg);
      }

      const data = await response.json();
      const { access_token } = data;

      // Step 2: Introspect token to retrieve user role before storing anything
      const introResponse = await fetch(`${API_BASE_URL}${API_URLS.AUTH.INTROSPECT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        credentials: "include",
      });

      if (!introResponse.ok) {
        throw new Error("Could not verify your account. Please try again.");
      }

      const introData = await introResponse.json();
      const userData = introData.user;

      // Step 3: RBAC check — only school_admin may access this portal
      if (userData.role !== "school_admin") {
        const friendlyRole = userData.role.replace(/_/g, " ");
        throw new Error(
          `Access denied. This portal is for school administrators only. ` +
          `Your account is registered as "${friendlyRole}". ` +
          `Please use the correct Talim app for your role.`
        );
      }

      // Step 4: Role is valid — persist session
      persistSession(access_token, userData, keepSignedIn);
      window.dispatchEvent(
        new CustomEvent("auth-changed", { detail: { type: "login", user: userData } })
      );

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
          clearSession(true);
          return false;
        }
      } catch (error) {
        console.error("Refresh token error:", error);
        clearSession(true);
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
      clearSession();

      // Trigger auth event for WebSocket
      window.dispatchEvent(
        new CustomEvent("auth-changed", {
          detail: { type: "logout" },
        })
      );

      toast.success("Logged out successfully");
    }
  };

  useEffect(() => {
    const handleAuthChanged = (event: Event) => {
      const authEvent = event as CustomEvent<{ type?: string }>;
      if (authEvent.detail?.type === "logout") {
        clearSession(true);
      }
    };

    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, [clearSession]);

  // ✅ FIXED: Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored token first
        const storedToken = getStoredAccessToken();
        
        if (storedToken) {
          // We have a stored token, try to use it
          setAccessTokenState(storedToken);
          apiClient.setAccessToken(storedToken);
          try {
            await introspectToken(storedToken, false);
          } catch (error) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              clearSession(true);
            }
          }
        } else {
          // No stored token, try to refresh
          const success = await refreshToken();
          if (!success) {
            const storedUser =
              localStorage.getItem("user") || sessionStorage.getItem("user");
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

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    setAccessToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
