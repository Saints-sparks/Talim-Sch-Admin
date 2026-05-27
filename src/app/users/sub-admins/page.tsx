"use client";

import React from "react";
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";

/**
 * /users/sub-admins
 *
 * Only accessible to the primary school_admin (full access).
 * Sub-admins themselves cannot manage other sub-admins.
 */
export default function SubAdminsPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_SUB_ADMINS}>
      <div className="p-6 max-w-5xl mx-auto">
        <SubAdminsSection />
      </div>
    </RequirePermission>
  );
}
