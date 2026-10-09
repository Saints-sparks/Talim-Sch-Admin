import { API_URLS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  UpdateAvatarPayload,
  UpdateProfilePayload,
  VerifyResetCodePayload,
} from "@/types/apiPayloads";
import type { Schema } from "@/types/apiContract";
import type {
  AccountDeletionBody,
  AccountDeletionScheduled,
  AuthSession,
  PasswordPolicyResponse,
  RevokeOtherSessionsResponse,
  RevokeSessionResponse,
} from "@/types/round4Contract";

/** Body for `POST /auth/login`. */
export interface LoginCredentials {
  email: string;
  password: string;
  /** Keep the refresh cookie beyond the browser session. */
  rememberMe?: boolean;
  /** Push token for this browser, when push is enabled. Omit otherwise. */
  deviceToken?: string;
  platform?: string;
}

/**
 * Body of `POST /auth/login` and `/auth/refresh`. In a browser the refresh
 * token is set as this app's httpOnly cookie, never returned.
 */
export type LoginResponse = Schema<"AccessTokenResponseDto"> & {
  // TODO-switch to generated: `POST /auth/login`'s response once `npm run types:api` has it.
  /** True when this sign-in cancelled a scheduled account deletion. */
  deletionCancelled?: boolean;
};

/** The signed-in user as `/auth/introspect` returns them. */
export type User = Schema<"IntrospectUserDto">;

/** Roles the API issues tokens for. */
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "PARENT" | "SCHOOL_ADMIN";
/** Gender values the profile endpoints accept. */
export type Gender = "MALE" | "FEMALE" | "OTHER";

/**
 * Body for `PUT /auth/profile/update`. Mirrors the backend `UpdateProfileDto`
 * exactly — the API rejects any other field. Email and password are not
 * editable here; passwords change through {@link authService.changePassword}.
 */
export type UpdateUserProfilePayload = UpdateProfilePayload;

/** A user's full profile, from `GET /auth/profile/:userId`. */
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
export type TokenIntrospectResponse = Schema<"IntrospectResponseDto">;

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
  login: (credentials: LoginCredentials): Promise<LoginResponse> => {
    const body: LoginPayload = { platform: "web", ...credentials };
    return api.post<LoginResponse>(API_URLS.AUTH.LOGIN, body, { skipAuth: true });
  },

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
  forgotPassword: (email: string): Promise<{ message: string }> => {
    const body: ForgotPasswordPayload = { email };
    return api.post<{ message: string }>(API_URLS.AUTH.FORGOT_PASSWORD, body, { skipAuth: true });
  },

  /**
   * Checks a reset code before asking for a new password. Wrong codes count
   * towards the server's attempt limit.
   *
   * @param email - Account email.
   * @param token - The 6-digit code from the email.
   */
  verifyResetCode: (email: string, token: string): Promise<{ valid: boolean; message?: string }> => {
    const body: VerifyResetCodePayload = { email, token };
    return api.post<{ valid: boolean; message?: string }>(API_URLS.AUTH.VERIFY_RESET_CODE, body, { skipAuth: true });
  },

  /**
   * Sets a new password with a reset code.
   *
   * @param email - Account email.
   * @param token - The 6-digit code from the email.
   * @param newPassword - Must satisfy the password policy.
   */
  resetPassword: (email: string, token: string, newPassword: string): Promise<{ message: string }> => {
    const body: ResetPasswordPayload = { email, token, newPassword };
    return api.post<{ message: string }>(API_URLS.AUTH.RESET_PASSWORD, body, { skipAuth: true });
  },

  /**
   * Changes the signed-in user's password (also replaces a temporary one).
   * The server rotates the session and returns a new access token.
   *
   * @param currentPassword - Current (or temporary) password.
   * @param newPassword - Must satisfy the password policy.
   * @param confirmPassword - Must equal `newPassword`.
   */
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string): Promise<ChangePasswordResponse> => {
    const body: ChangePasswordPayload = { currentPassword, newPassword, confirmPassword };
    return api.post<ChangePasswordResponse>(API_URLS.AUTH.CHANGE_PASSWORD, body);
  },

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
   * @returns The avatar URL now stored on the account.
   */
  updateAvatarUrl: (avatarUrl: string): Promise<{ userAvatar: string }> => {
    const body: UpdateAvatarPayload = { avatarUrl };
    return api.put<{ userAvatar: string }>(API_URLS.AUTH.UPDATE_AVATAR, body);
  },

  /**
   * The signed-in user's devices (Round 4 §34), one per active refresh token.
   * The refresh cookie goes with the request, so the server can mark this one
   * `current`.
   *
   * @returns The sessions, in the server's order.
   */
  listSessions: (): Promise<AuthSession[]> => api.get<AuthSession[]>(API_URLS.AUTH.SESSIONS),

  /**
   * Signs one of the user's own sessions out; its next refresh fails with 401.
   *
   * @param id - The session's id.
   * @returns The API's answer: `{ id, revoked, current }` (nothing the app reads yet).
   */
  revokeSession: (id: string): Promise<RevokeSessionResponse> =>
    api.delete<RevokeSessionResponse>(API_URLS.AUTH.SESSION.replace(":id", encodeURIComponent(id))),

  /**
   * Signs out every session but this one.
   *
   * @returns How many were signed out.
   */
  revokeOtherSessions: (): Promise<RevokeOtherSessionsResponse> =>
    api.post<RevokeOtherSessionsResponse>(API_URLS.AUTH.REVOKE_OTHER_SESSIONS),

  /**
   * The password rules the server enforces (Round 4 §34). Public: no token
   * is sent and a failure never triggers a refresh.
   *
   * @returns The policy as the server sends it (see `normalizePasswordPolicy`).
   */
  getPasswordPolicy: (): Promise<PasswordPolicyResponse> =>
    api.get<PasswordPolicyResponse>(API_URLS.AUTH.PASSWORD_POLICY, { skipAuth: true }),

  /**
   * Schedules the signed-in user's account for deletion in 30 days (v1.5).
   * The server ends every session at once, so the caller signs out locally
   * afterwards with `logout({ sessionEnded: true })`.
   *
   * @param body - The account's password and an optional reason.
   * @returns `{ status: 'scheduled', requestedAt, scheduledFor }`.
   * @throws ApiError: 400 `VALIDATION_FAILED` with a `password` field error for a wrong password;
   *   `meta.code` `ADMIN_ACCOUNT` (403),
   *   `LAST_SCHOOL_ADMIN` or `DELETION_SCHEDULED` (409).
   */
  requestAccountDeletion: (body: AccountDeletionBody): Promise<AccountDeletionScheduled> =>
    api.post<AccountDeletionScheduled>(API_URLS.AUTH.ACCOUNT_DELETION, body),
};
