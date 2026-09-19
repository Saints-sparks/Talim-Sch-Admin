"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { dropLocalWebPush, revokeWebPushOnSignOut } from "@/app/hooks/usePushNotifications";
import { authService } from "@/app/services/auth.service";
import { toast } from "@/components/CustomToast";
import { apiClient } from "@/lib/apiClient";
import {
  dispatchAuthChanged,
  isAdminPortalRole,
  loginFailure,
  portalAccessDeniedMessage,
  portalUserFromIntrospection,
  userHasPermission,
  type AuthUser as User,
} from "@/lib/authPolicy";
import {
  clearStoredSession,
  readStoredAccessToken,
  readStoredUser,
  saveEditedUser,
  saveIntrospectedUser,
  saveRefreshedToken,
  saveRotatedToken,
  saveSession,
} from "@/lib/authStorage";

/** Longest a forced sign-out waits for the browser push cleanup before redirecting. */
const PUSH_CLEANUP_MAX_MS = 1500;
import { sessionStore, extractSchoolId } from "@/lib/session";

interface AuthContextType {
  user: User | null;
  /** The signed-in administrator's school id — the one source of school context for React code. */
  schoolId: string | null;
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

  const persistSession = (token: string, userData: User, keepSignedIn = true) => {
    setAccessTokenState(token);
    apiClient.setAccessToken(token);
    setUser(userData);
    // Session-only sessions are cleared automatically when the tab closes.
    saveSession(token, userData, keepSignedIn);
  };

  const clearSession = useCallback((redirectToLogin = false) => {
    // Read before the session is wiped: a forced sign-out needs to know whose
    // browser subscription to drop.
    const departingUserId =
      sessionStore.getUserId() ?? readStoredUser<{ userId?: string; _id?: string }>()?.userId ?? null;
    setAccessTokenState(null);
    apiClient.setAccessToken(null);
    setUser(null);
    clearStoredSession();

    if (redirectToLogin) {
      // Forced sign-out: the token is already invalid, so drop this browser's push
      // subscription locally (no request), bounded so a stuck service worker cannot
      // hold the redirect. The cleanup runs on every forced sign-out; only the
      // redirect depends on which page the user is on.
      const bound = new Promise<void>((resolve) => setTimeout(resolve, PUSH_CLEANUP_MAX_MS));
      void Promise.race([dropLocalWebPush(departingUserId), bound]).finally(() => {
        if (typeof window !== "undefined" && window.location.pathname !== "/") window.location.assign("/");
      });
    }
  }, []);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    apiClient.setAccessToken(token);

    if (token) {
      // Respects the original keepSignedIn preference when storing the refreshed token
      saveRefreshedToken(token);
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
      const introspected = portalUserFromIntrospection(await authService.introspectToken(token));

      setUser(introspected);
      saveIntrospectedUser(introspected);

      // Trigger auth event for WebSocket
      dispatchAuthChanged({ type: "login", user: introspected });
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
      throw loginFailure(error);
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

    if (!isAdminPortalRole(userData.role)) {
      throw new Error(portalAccessDeniedMessage(userData.role));
    }

    persistSession(accessToken, userData, keepSignedIn);
    dispatchAuthChanged({ type: "login", user: userData });
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

  /** Signs out on the server (best effort) and always clears the local session. */
  const logout = async () => {
    try {
      if (accessToken) {
        // While the session is still valid: stop this browser getting this admin's push alerts.
        await revokeWebPushOnSignOut();
        await authService.logout();
      }
    } catch {
      // The local session is cleared regardless; a failed server logout only
      // means the refresh token expires on its own.
    } finally {
      // Clear everything
      clearSession();

      // Trigger auth event for WebSocket
      dispatchAuthChanged({ type: "logout" });

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

  // Resume the stored session on app load, else try a refresh.
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored token first
        const storedToken = readStoredAccessToken();

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
            const storedUser = readStoredUser<User>();
            if (storedUser) setUser(storedUser);
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
  const hasPermission = useCallback((permission: string): boolean => userHasPermission(user, permission), [user]);

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const { access_token } = await authService.changePassword(currentPassword, newPassword, confirmPassword);
    // Adopt the rotated session and reload the user, which clears mustChangePassword.
    setAccessTokenState(access_token);
    apiClient.setAccessToken(access_token);
    saveRotatedToken(access_token);
    await introspectToken(access_token, false);
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      saveEditedUser(updated);
      return updated;
    });
  };

  const value: AuthContextType = {
    user,
    schoolId: extractSchoolId(user?.schoolId),
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
