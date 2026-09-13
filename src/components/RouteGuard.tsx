"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isFullAdminOnly, requiredPermissionFor } from "@/lib/routePermissions";
import AccessDeniedPage from "@/app/access-denied/page";
import Loading from "@/app/loading";

/**
 * Gates every authenticated route in one place:
 * - while the session is loading, shows the page skeleton;
 * - with no session, sends the visitor to the sign-in page;
 * - with a session lacking the route's permission, renders Access Denied
 *   instead of the page (the API would refuse the data anyway).
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasPermission, isFullAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/");
  }, [isLoading, user, router]);

  if (isLoading || !user) return <Loading />;

  // Managing sub-admins is reserved for the primary school admin (the API
  // refuses sub-admins even when they hold manage:sub_admins).
  if (isFullAdminOnly(pathname) && !isFullAdmin) return <AccessDeniedPage />;
  const required = requiredPermissionFor(pathname);
  if (required && !hasPermission(required)) return <AccessDeniedPage />;

  return <>{children}</>;
}
