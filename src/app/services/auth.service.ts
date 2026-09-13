import { API_URLS } from "../lib/api/config";
import { api } from "@/lib/apiClient";

export interface LoginCredentials {
  email: string;
  password: string;
  /** Keep the refresh cookie beyond the browser session. */
  rememberMe?: boolean;
  /** Push token for this browser, when push is enabled. Omit otherwise. */
  deviceToken?: string;
  platform?: string;
}

/** `POST /auth/login` body. The refresh token is set as an httpOnly cookie, never returned. */
export interface LoginResponse {
  access_token: string;
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
  /** True while the account still has a temporary password. */
  mustChangePassword?: boolean;
  onboardingCompleted?: boolean;
  permissions?: string[];
}

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "PARENT" | "SCHOOL_ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER";

/**
 * Body for `PUT /auth/profile/update`. Mirrors the backend `UpdateProfileDto`
 * exactly — the API rejects any other field. Email and password are not
 * editable here; passwords change through {@link authService.changePassword}.
 */
export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  /** ISO date string. */
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  /** Hosted image URL; an empty string removes the avatar. */
  userAvatar?: string;
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

/** `POST /auth/introspect` body. `active: false` (with no user) for an invalid token. */
export interface TokenIntrospectResponse {
  active: boolean;
  exp?: number;
  iat?: number;
  user?: User;
}

/** `POST /auth/change-password` body: a fresh access token (refresh cookie is rotated too). */
export interface ChangePasswordResponse {
  access_token: string;
  message: string;
}

/**
 * Authentication and account calls for the School Admin portal. Every method
 * goes through the shared API client, so failures are `ApiError`s with a
 * stable `code`, a user-safe `message` and field-level `details`.
 */
export const authService = {
  /**
   * Signs in. Public call: no bearer token is sent and a 401 is reported as
   * wrong credentials instead of triggering a session refresh.
   *
   * @param credentials - Email, password and optional device fields.
   * @returns The access token.
   */
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    api.post<LoginResponse>(API_URLS.AUTH.LOGIN, { platform: "web", ...credentials }, { skipAuth: true }),

  /**
   * Resolves an access token to its user.
   *
   * @param token - The access token to inspect (sent as the bearer token).
   * @returns The introspection result; `active` is false for an invalid token.
   */
  introspectToken: (token: string): Promise<TokenIntrospectResponse> =>
    api.post<TokenIntrospectResponse>(API_URLS.AUTH.INTROSPECT, undefined, {
      skipAuth: true,
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Exchanges the httpOnly refresh cookie for a new access token.
   *
   * @returns The new access token.
   */
  refresh: (): Promise<LoginResponse> =>
    api.post<LoginResponse>(API_URLS.AUTH.REFRESH, undefined, { skipAuth: true }),

  /**
   * Emails a 6-digit reset code. Resolves with the same message whether or
   * not the email is registered.
   *
   * @param email - Account email.
   */
  forgotPassword: (email: string): Promise<{ message: string }> =>
    api.post<{ message: string }>(API_URLS.AUTH.FORGOT_PASSWORD, { email }, { skipAuth: true }),

  /**
   * Checks a reset code before asking for a new password. Wrong codes count
   * towards the server's attempt limit.
   *
   * @param email - Account email.
   * @param token - The 6-digit code from the email.
   */
  verifyResetCode: (email: string, token: string): Promise<{ valid: boolean; message?: string }> =>
    api.post<{ valid: boolean; message?: string }>(API_URLS.AUTH.VERIFY_RESET_CODE, { email, token }, { skipAuth: true }),

  /**
   * Sets a new password with a reset code.
   *
   * @param email - Account email.
   * @param token - The 6-digit code from the email.
   * @param newPassword - Must satisfy the password policy.
   */
  resetPassword: (email: string, token: string, newPassword: string): Promise<{ message: string }> =>
    api.post<{ message: string }>(API_URLS.AUTH.RESET_PASSWORD, { email, token, newPassword }, { skipAuth: true }),

  /**
   * Changes the signed-in user's password (also replaces a temporary one).
   * The server rotates the session and returns a new access token.
   *
   * @param currentPassword - Current (or temporary) password.
   * @param newPassword - Must satisfy the password policy.
   * @param confirmPassword - Must equal `newPassword`.
   */
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string): Promise<ChangePasswordResponse> =>
    api.post<ChangePasswordResponse>(API_URLS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword, confirmPassword }),

  /** Ends the session on the server and clears the refresh cookie. */
  logout: (): Promise<unknown> => api.post(API_URLS.AUTH.LOGOUT),

  /**
   * Loads the signed-in user's full profile.
   *
   * @param userId - The user's id.
   */
  getUserProfile: (userId: string): Promise<UserProfile> =>
    api.get<UserProfile>(API_URLS.AUTH.GET_PROFILE.replace(":userId", encodeURIComponent(userId))),

  /**
   * Updates personal details of the signed-in user.
   *
   * @param payload - Only the fields in {@link UpdateUserProfilePayload}.
   */
  updateUserProfile: (payload: UpdateUserProfilePayload): Promise<UserProfile> =>
    api.put<UserProfile>(API_URLS.AUTH.UPDATE_PROFILE, payload),

  /**
   * Saves a hosted avatar URL, or removes the avatar with an empty string.
   *
   * @param avatarUrl - Hosted image URL or `""`.
   */
  updateAvatarUrl: (avatarUrl: string): Promise<{ userAvatar: string }> =>
    api.put<{ userAvatar: string }>(API_URLS.AUTH.UPDATE_AVATAR, { avatarUrl }),
};
