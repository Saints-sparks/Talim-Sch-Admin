/**
 * usePermissions — convenience hook exposing permission helpers from AuthContext.
 *
 * Usage:
 *   const { hasPermission, isFullAdmin, isSubAdmin } = usePermissions();
 *   if (hasPermission('MANAGE_FEES')) { ... }
 */
import { useAuth } from "@/context/AuthContext";
import { normalizePermission } from "@/lib/permissions";

export function usePermissions() {
  const { hasPermission: rawHasPermission, isFullAdmin, isSubAdmin, user } = useAuth();

  /**
   * True when the user holds `permission`, written either as a Permission key
   * ("MANAGE_FEES") or as its value ("manage:fees").
   */
  const hasPermission = (permission: string): boolean => rawHasPermission(normalizePermission(permission));

  /**
   * Returns true if the user holds ALL of the provided permissions.
   * A full school_admin always returns true.
   */
  const hasAllPermissions = (...permissions: string[]): boolean =>
    permissions.every((p) => hasPermission(p));

  /**
   * Returns true if the user holds AT LEAST ONE of the provided permissions.
   * A full school_admin always returns true.
   */
  const hasAnyPermission = (...permissions: string[]): boolean =>
    permissions.some((p) => hasPermission(p));

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isFullAdmin: isFullAdmin ?? false,
    isSubAdmin: isSubAdmin ?? false,
    permissions: user?.permissions ?? [],
  };
}
