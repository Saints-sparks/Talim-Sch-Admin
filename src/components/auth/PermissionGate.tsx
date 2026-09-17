"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGateProps {
  /** One or more permissions — user must have ALL of them (unless `any` is set). */
  permission?: string | string[];
  /** If true, user only needs ANY ONE of the listed permissions instead of all. */
  any?: boolean;
  /** Rendered when permission check passes. */
  children: React.ReactNode;
  /** Optional fallback rendered when permission check fails. Defaults to null. */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders `children` based on the current user's permissions.
 *
 * Full school_admin → always rendered.
 * school_sub_admin  → rendered only if permissions match.
 *
 * Examples:
 *   <PermissionGate permission={Permission.MANAGE_FEES}>…</>
 *   <PermissionGate permission={[Permission.MANAGE_FEES, Permission.MANAGE_FINANCE]} any>…</>
 *   <PermissionGate permission={Permission.MANAGE_SUB_ADMINS} fallback={<p>No access</p>}>…</>
 *
 * Pass the constant from `@/lib/permissions`. A bare key name ("MANAGE_FEES")
 * also works — `usePermissions` normalises it — but the constant is what the
 * API compares against.
 */
export function PermissionGate({
  permission,
  any = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isFullAdmin } =
    usePermissions();

  // Full admins always pass
  if (isFullAdmin) return <>{children}</>;

  // No permission requirement → always show
  if (!permission) return <>{children}</>;

  const permissions = Array.isArray(permission) ? permission : [permission];

  const allowed = any
    ? hasAnyPermission(...permissions)
    : hasAllPermissions(...permissions);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

interface RequirePermissionProps {
  permission: string | string[];
  any?: boolean;
  /** Where to redirect on access denial. Defaults to "/access-denied". */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Page-level guard.  Redirects to /access-denied (or `redirectTo`) when the
 * current user lacks the required permission(s).
 *
 * Meant to be used at the top of a page component.
 */
export function RequirePermission({
  permission,
  any = false,
  redirectTo = "/access-denied",
  children,
}: RequirePermissionProps) {
  const { hasAllPermissions, hasAnyPermission, isFullAdmin } = usePermissions();
  const router = useRouter();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const allowed =
    isFullAdmin ||
    (any ? hasAnyPermission(...permissions) : hasAllPermissions(...permissions));

  useEffect(() => {
    if (!allowed) {
      router.replace(redirectTo);
    }
  }, [allowed, redirectTo, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
