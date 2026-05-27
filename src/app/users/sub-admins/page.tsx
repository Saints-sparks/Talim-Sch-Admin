"use client";

import React from "react";
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";
import { RequirePermission } from "@/components/auth/PermissionGate";

/**
 * /users/sub-admins
 *
 * Only accessible to the primary school_admin (full access).
 * Sub-admins themselves cannot manage other sub-admins.
 */
export default function SubAdminsPage() {
  return (
    <RequirePermission permission="MANAGE_SUB_ADMINS">
      <div className="p-6 max-w-5xl mx-auto">
        <SubAdminsSection />
      </div>
    </RequirePermission>
  );
}
