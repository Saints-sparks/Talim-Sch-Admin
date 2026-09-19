/** Fields of the signed-in user that decide where they land after sign-in. */
export interface PostLoginUser {
  role?: string;
  mustChangePassword?: boolean;
  onboardingCompleted?: boolean;
  firstName?: string;
  lastName?: string;
  schoolId?: string | { _id?: string; id?: string; name?: string } | null;
  schoolName?: string;
}

function schoolIdOf(user: PostLoginUser): string | null {
  if (!user.schoolId) return null;
  return typeof user.schoolId === "string" ? user.schoolId : user.schoolId._id ?? user.schoolId.id ?? null;
}

function hasLocalPhase1Completion(schoolId: string | null): boolean {
  if (!schoolId || typeof window === "undefined") return false;
  try {
    const state = JSON.parse(localStorage.getItem(`onboarding_${schoolId}`) ?? "null");
    return state?.phase1Completed === true;
  } catch {
    return false;
  }
}

function hasPhase1ProfileData(user: PostLoginUser): boolean {
  const hasName = Boolean(user.firstName?.trim() && user.lastName?.trim());
  const hasSchool = Boolean(
    schoolIdOf(user) || user.schoolName?.trim() || (typeof user.schoolId === "object" && user.schoolId?.name?.trim()),
  );
  return hasName && hasSchool;
}

/**
 * Where a user goes after signing in (or after setting their password).
 *
 * 1. A temporary password must be replaced first — the API refuses every
 *    other request until it is.
 * 2. Finished onboarding → dashboard. A sub-admin never onboards: school setup
 *    (profile, academic year, first class...) belongs to the primary admin, and
 *    a sub-admin's account was never marked onboarded, so without this every
 *    sub-admin's first sign-in landed on the school setup checklist.
 * 3. Otherwise the onboarding phase they reached.
 *
 * @param user - The introspected user.
 */
export function resolvePostLoginRoute(user: PostLoginUser): string {
  if (user.mustChangePassword) return "/set-password";
  if (user.onboardingCompleted || user.role === "school_sub_admin") return "/dashboard";
  const phase1Done = hasLocalPhase1Completion(schoolIdOf(user)) || hasPhase1ProfileData(user);
  return phase1Done ? "/onboarding/setup" : "/onboarding";
}
