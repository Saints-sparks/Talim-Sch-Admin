"use client";

import React, { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";

/**
 * Keeps the past-records import pages for the primary school admin. The API
 * puts `@Roles(SCHOOL_ADMIN, ADMIN)` on every `/imports/history` route, so a
 * sub-admin holding `manage:settings` is still refused; `RouteGuard` makes
 * the same check for `/settings/import` (as for `/users/sub-admins`).
 *
 * @param props - The page.
 * @param props.children - What only the school admin may see.
 * @returns The page, or nothing while sending anyone else to Access Denied.
 */
export function FullAdminOnly({ children }: { children: ReactNode }) {
  const { isFullAdmin } = usePermissions();
  const router = useRouter();

  React.useEffect(() => {
    if (!isFullAdmin) router.replace("/access-denied");
  }, [isFullAdmin, router]);

  if (!isFullAdmin) return null;
  return <RequirePermission permission={Permission.MANAGE_SETTINGS}>{children}</RequirePermission>;
}

export default FullAdminOnly;
