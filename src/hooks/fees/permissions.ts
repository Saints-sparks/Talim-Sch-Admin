/**
 * Who may change fees.
 *
 * `MANAGE_FEES` is what the backend's `FeesController` requires for every
 * route in the module, so the UI hides what the API would refuse rather than
 * letting a sub-admin press a button that 403s.
 */
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";

/**
 * Whether the signed-in admin may create, edit, assign, archive or restore
 * fees. Always true for the primary school admin.
 *
 * @returns True when the user holds `manage:fees`.
 */
export function useCanManageFees(): boolean {
  return usePermissions().hasPermission(Permission.MANAGE_FEES);
}
