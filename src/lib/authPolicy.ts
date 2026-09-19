/**
 * Who may use the School Admin portal, and the words used when they may not.
 * Pure helpers for `AuthContext`; nothing here touches React or storage.
 */
import { ApiError } from "@/lib/apiError";

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
 * The message for an account signing in with the wrong kind of role.
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
 * credentials get a plain sentence, anything else is passed through.
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
 * Tells the rest of the app (the chat socket, other tabs' listeners) that the
 * session changed.
 *
 * @param detail - `{ type: "login", user }` or `{ type: "logout" }`.
 */
export function dispatchAuthChanged(detail: { type: "login"; user: AuthUser } | { type: "logout" }): void {
  window.dispatchEvent(new CustomEvent("auth-changed", { detail }));
}
