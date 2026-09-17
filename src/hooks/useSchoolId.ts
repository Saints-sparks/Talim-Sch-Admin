/**
 * The signed-in administrator's school id, for React code.
 *
 * One source of school context: the auth context owns it, and components read
 * it from here. Non-React code (services, the API client) reads the same value
 * from `sessionStore`. Nothing decodes the access token to find it.
 */
import { useAuth } from "@/context/AuthContext";

/**
 * @returns The school id, or `null` while signing in or when signed out.
 */
export function useSchoolId(): string | null {
  return useAuth().schoolId;
}

/**
 * The school id for code that cannot render without it (a page already behind
 * `RouteGuard`, where a missing id means the session broke).
 *
 * @returns The school id.
 * @throws When there is no signed-in school.
 */
export function useRequiredSchoolId(): string {
  const schoolId = useSchoolId();
  if (!schoolId) throw new Error("No school in the current session");
  return schoolId;
}
