"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";

/**
 * `/users/sub-admins`
 *
 * Reserved for the primary school admin. The backend puts
 * `@Roles(SCHOOL_ADMIN)` on every sub-admin route, so a sub-admin holding
 * `manage:sub_admins` is still refused — the permission gate alone is not
 * enough, and `RouteGuard` makes the same check for the route.
 */
function SubAdminsView() {
  const { isFullAdmin } = usePermissions();
  const router = useRouter();

  React.useEffect(() => {
    if (!isFullAdmin) router.replace("/access-denied");
  }, [isFullAdmin, router]);

  if (!isFullAdmin) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <SubAdminsSection />
    </div>
  );
}

/** The sub-admin management page. */
export default function SubAdminsPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_SUB_ADMINS}>
      <SubAdminsView />
    </RequirePermission>
  );
}
