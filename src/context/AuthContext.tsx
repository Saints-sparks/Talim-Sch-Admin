"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { authService } from "@/app/services/auth.service";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import { apiClient } from "@/lib/apiClient";
import { sessionStore } from "@/lib/session";

/** All roles allowed to access the school admin portal */
const ADMIN_PORTAL_ROLES = ["school_admin", "school_sub_admin"] as const;
type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

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
  /** Granular permissions — empty = full access (primary school_admin) */
  permissions?: string[];
  /** Convenience flag set by introspect */
  isSubAdmin?: boolean;
  /** True while the account still has a temporary password; the API refuses other calls until it is replaced. */
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True when user is a primary school_admin (full access, no restrictions) */
  isFullAdmin: boolean;
  /** True when user is a sub-admin with a restricted permission set */
  isSubAdmin: boolean;
  /** Returns true if the current user is allowed to perform `permission` */
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string, keepSignedIn?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
  updateUser: (partial: Partial<User>) => void;
  /**
   * Replaces the signed-in user's password (including a temporary one) and
   * adopts the new session the server returns.
   */
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const persistSession = (token: string, userData: User, keepSignedIn = true) => {
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

    if (redirectToLogin && typeof window !== "undefined" && window.location.pathname !== "/") {
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
      introspectToken(token).catch(() => undefined);
    } else {
      clearSession();
    }
  };

  // Initialize apiClient on mount
  useEffect(() => {
    apiClient.initialize(accessToken, refreshToken);
  }, [accessToken]);

  // Mirror the session into the store that services and the API client read
  // from, so there is exactly one source of user / school context.
  useEffect(() => {
    sessionStore.set(user as Parameters<typeof sessionStore.set>[0], accessToken);
  }, [user, accessToken]);

  /**
   * Loads the user behind `token` and stores it. Rejects tokens that are
   * inactive or belong to a role this portal does not serve.
   *
   * @param token - Access token to introspect.
   * @param redirectOnFailure - Clear the session and go to sign-in on failure.
   */
  const introspectToken = async (token: string, redirectOnFailure = true): Promise<User> => {
    try {
      const data = await authService.introspectToken(token);
      if (!data.active || !data.user) throw new Error("Token introspection failed");
      const introspected = data.user as unknown as User;
      if (!ADMIN_PORTAL_ROLES.includes(introspected.role as AdminPortalRole)) {
        throw new Error("Access denied for this portal");
      }

      setUser(introspected);

      const keepSignedIn = localStorage.getItem("keepSignedIn") !== "false";
      if (keepSignedIn) {
        localStorage.setItem("user", JSON.stringify(introspected));
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("user", JSON.stringify(introspected));
        localStorage.removeItem("user");
      }

      // Trigger auth event for WebSocket
      window.dispatchEvent(new CustomEvent("auth-changed", { detail: { type: "login", user: introspected } }));
      return introspected;
    } catch (error) {
      if (redirectOnFailure) {
        clearSession(true);
      }
      throw error;
    }
  };

    /**
   * Signs in and admits only school admins and sub-admins.
   *
   * @param email - Account email.
   * @param password - Password (or the temporary password).
   * @param keepSignedIn - Persist the session beyond this browser session.
   * @throws Error with a user-facing message on wrong credentials or wrong role.
   */
  const login = async (email: string, password: string, keepSignedIn = true): Promise<boolean> => {
    let accessToken: string;
    try {
      ({ access_token: accessToken } = await authService.login({ email, password, rememberMe: keepSignedIn }));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.code === "UNAUTHENTICATED")) {
        throw new Error("Incorrect email or password. Please check your credentials and try again.");
      }
      throw error;
    }

    // Introspect before storing anything, so a wrong-role account never gets a session here.
    let introspection;
    try {
      introspection = await authService.introspectToken(accessToken);
    } catch {
      throw new Error("Could not verify your account. Please try again.");
    }
    const userData = introspection.user as unknown as User | undefined;
    if (!introspection.active || !userData) {
      throw new Error("Could not verify your account. Please try again.");
    }

    if (!ADMIN_PORTAL_ROLES.includes(userData.role as AdminPortalRole)) {
      const friendlyRole = userData.role.replace(/_/g, " ");
      throw new Error(
        `Access denied. This portal is for school administrators only. ` +
          `Your account is registered as "${friendlyRole}". ` +
          `Please use the correct Talim app for your role.`
      );
    }

    persistSession(accessToken, userData, keepSignedIn);
    window.dispatchEvent(new CustomEvent("auth-changed", { detail: { type: "login", user: userData } }));
    return true;
  };

    // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const { access_token } = await authService.refresh();
        setAccessToken(access_token);
        return true;
      } catch {
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
      if (accessToken) await authService.logout();
    } catch {
      // The local session is cleared regardless; a failed server logout only
      // means the refresh token expires on its own.
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
          } catch {
            const refreshed = await refreshToken();
            if (!refreshed) {
              clearSession(true);
            }
          }
        } else {
          // No stored token, try to refresh
          const success = await refreshToken();
          if (!success) {
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch {
                localStorage.removeItem("user");
              }
            }
          }
        }
      } catch {
        // Fall through to the signed-out state.
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before it expires (every 10 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(
      () => {
        refreshToken();
      },
      10 * 60 * 1000
    );

    return () => clearInterval(refreshInterval);
  }, [accessToken]);

  /** Returns true if the current user has the specified permission.
   *  Primary school_admin always returns true (empty permissions = full access). */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === "school_admin") return true;
      return user.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const { access_token } = await authService.changePassword(currentPassword, newPassword, confirmPassword);
    // Adopt the rotated session and reload the user, which clears mustChangePassword.
    setAccessTokenState(access_token);
    apiClient.setAccessToken(access_token);
    const keepSignedIn = localStorage.getItem("keepSignedIn") !== "false";
    (keepSignedIn ? localStorage : sessionStorage).setItem("accessToken", access_token);
    await introspectToken(access_token, false);
  };

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
    isFullAdmin: user?.role === "school_admin",
    isSubAdmin: user?.role === "school_sub_admin",
    hasPermission,
    login,
    logout,
    refreshToken,
    setAccessToken,
    updateUser,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
