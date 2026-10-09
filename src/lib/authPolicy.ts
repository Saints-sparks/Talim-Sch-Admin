/**
 * Who may use the School Admin portal, and the words used when they may not.
 * Pure helpers for `AuthContext`; nothing here touches React or storage.
 */
import { ApiError, getErrorMessage } from "@/lib/apiError";

/** All roles allowed to access the school admin portal. */
export const ADMIN_PORTAL_ROLES = ["school_admin", "school_sub_admin"] as const;
type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

/** The signed-in user as the introspection endpoint returns them. */
export interface AuthUser {
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

/**
 * Whether a role may sign in to this portal.
 *
 * @param role - The account's role.
 * @returns True for a school admin or sub-admin.
 */
export function isAdminPortalRole(role: string): boolean {
  return ADMIN_PORTAL_ROLES.includes(role as AdminPortalRole);
}

/**
 * The message for an account signing in with the wrong kind of role. The API
 * words its own refusal (403 `FORBIDDEN` from `/auth/login`, sent because the
 * client names this app in `X-Talim-App`) exactly the same way.
 *
 * @param role - The account's role, e.g. "school_teacher".
 * @returns A sentence naming the role and sending them to the right app.
 */
export function portalAccessDeniedMessage(role: string): string {
  const friendlyRole = role.replace(/_/g, " ");
  return (
    `Access denied. This portal is for school administrators only. ` +
    `Your account is registered as "${friendlyRole}". ` +
    `Please use the correct Talim app for your role.`
  );
}

/**
 * Maps a failed sign-in request to what the user should see: wrong
 * credentials get a plain sentence, anything else is passed through. That
 * includes the API's 403 for a role this portal does not admit, whose message
 * is {@link portalAccessDeniedMessage}'s, so the sign-in page shows it in the
 * same access-denied banner as the client-side check.
 *
 * @param error - What the login request threw.
 * @returns The error to throw to the sign-in form.
 */
export function loginFailure(error: unknown): unknown {
  if (error instanceof ApiError && (error.status === 401 || error.code === "UNAUTHENTICATED")) {
    return new Error("Incorrect email or password. Please check your credentials and try again.");
  }
  return error;
}

/**
 * Reads the user out of an introspection result that a session may be built
 * on: the token must be active and the role must belong in this portal.
 *
 * @param data - The introspection response.
 * @returns The user.
 * @throws Error "Token introspection failed" for an inactive token, "Access
 *   denied for this portal" for a role this portal does not serve.
 */
export function portalUserFromIntrospection(data: { active: boolean; user?: unknown }): AuthUser {
  if (!data.active || !data.user) throw new Error("Token introspection failed");
  const user = data.user as AuthUser;
  if (!isAdminPortalRole(user.role)) throw new Error("Access denied for this portal");
  return user;
}

/**
 * Whether a user may perform a permission. The primary school admin holds
 * every permission; a sub-admin holds the ones listed on their account.
 *
 * @param user - The signed-in user, or `null` when signed out.
 * @param permission - The permission being checked.
 * @returns True when allowed; always false when signed out.
 */
export function userHasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === "school_admin") return true;
  return user.permissions?.includes(permission) ?? false;
}

/**
 * Tells the rest of the app (the chat socket, other tabs' listeners, the
 * query cache) that the session changed.
 *
 * @param detail - `{ type: "login", user }` or `{ type: "logout" }`, with
 *   `redirectTo` when sign-out should land somewhere other than plain sign-in.
 */
export function dispatchAuthChanged(
  detail: { type: "login"; user: AuthUser } | { type: "logout"; redirectTo?: string }
): void {
  window.dispatchEvent(new CustomEvent("auth-changed", { detail }));
}

// ─── Delete account (v1.5 addendum) ──────────────────────────────────────────

/** The sign-in toast when a sign-in cancelled a scheduled deletion (`deletionCancelled: true`). */
export const DELETION_CANCELLED_MESSAGE = "Welcome back. Your account deletion has been cancelled.";

/** The sign-in query parameter that carries the scheduled deletion date (ISO). */
export const DELETION_NOTICE_PARAM = "deletionScheduledFor";

/** The most a deletion reason may hold (the backend's limit). */
export const DELETION_REASON_MAX = 500;

/** Copy for each refusal of `POST /auth/account/deletion`, used when the server sends no message. */
export const DELETION_ERROR_COPY: Readonly<Record<string, string>> = {
  ADMIN_ACCOUNT: "Talim platform admin accounts can't be deleted from here.",
  LAST_SCHOOL_ADMIN:
    "You are your school's only admin. Make another admin first, or contact Talim support.",
  DELETION_SCHEDULED: "Your account is already scheduled for deletion.",
};

/**
 * The notice sign-in shows after a deletion request.
 *
 * @param scheduledFor - `scheduledFor` from the 200 response (ISO).
 * @returns "Your account will be deleted on 8 November 2026. Sign in before then to cancel."
 */
export function deletionScheduledMessage(scheduledFor: string | null | undefined): string {
  const date = scheduledFor ? new Date(scheduledFor) : null;
  const when =
    date && !Number.isNaN(date.getTime())
      ? `on ${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
      : "in 30 days";
  return `Your account will be deleted ${when}. Sign in before then to cancel.`;
}

/**
 * The sign-in URL to land on after a deletion request, carrying the date.
 *
 * @param scheduledFor - `scheduledFor` from the 200 response (ISO). The
 *   contract marks it optional (it is sent with `status: "scheduled"` only);
 *   without it the URL is the plain sign-in route.
 * @returns e.g. `/?deletionScheduledFor=2026-11-08T10%3A00%3A00.000Z`.
 */
export function deletionScheduledRoute(scheduledFor: string | undefined): string {
  if (!scheduledFor) return "/";
  return `/?${new URLSearchParams({ [DELETION_NOTICE_PARAM]: scheduledFor }).toString()}`;
}

/**
 * The deletion notice a sign-in URL asks for.
 *
 * @param search - `window.location.search`.
 * @returns The notice, or null when the URL carries no readable date.
 */
export function deletionNoticeFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get(DELETION_NOTICE_PARAM);
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return deletionScheduledMessage(value);
}

/** Where a failed deletion request's message belongs. */
export interface DeletionFailure {
  /** The password field's message (a wrong password: a 400 naming `password`), else null. */
  field: string | null;
  /** The banner's message (everything else), else null. */
  banner: string | null;
  /** The route's own code (`LAST_SCHOOL_ADMIN`, `ADMIN_ACCOUNT`, ...), when it sent one. */
  code: string | null;
}

/**
 * Sorts a failed deletion request: a wrong password (a 400 whose field errors
 * name `password`, read with `ApiError.fieldErrors()` as the change-password
 * form does) goes on the field, every other refusal in the banner. Refusals
 * are keyed on the route's top-level `code` (`ApiError.meta.code`), never on
 * message text.
 *
 * @param error - Whatever `POST /auth/account/deletion` threw.
 * @returns The field or banner message and the code.
 */
export function deletionFailure(error: unknown): DeletionFailure {
  const raw = error instanceof ApiError ? error.meta.code : undefined;
  const code = typeof raw === "string" && raw ? raw : null;
  const password = error instanceof ApiError ? error.fieldErrors().password : undefined;
  if (password) return { field: password, banner: null, code };
  if (code && DELETION_ERROR_COPY[code]) {
    return { field: null, banner: (error as ApiError).message || DELETION_ERROR_COPY[code], code };
  }
  const fallback = "We couldn't delete your account. Please try again.";
  return { field: null, banner: getErrorMessage(error, fallback) || fallback, code };
}
