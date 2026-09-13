"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SET_PASSWORD_ROUTE } from "@/lib/apiClient";

/** Routes a user with a temporary password may still open. */
const OPEN_ROUTES = new Set(["/", "/forgot-password", SET_PASSWORD_ROUTE]);

/**
 * Keeps an admin who must replace a temporary password on the set-password
 * screen, whichever URL they open. The API enforces the same rule
 * (`PASSWORD_CHANGE_REQUIRED`); this avoids rendering pages that would only
 * fail to load.
 */
export default function PasswordChangeGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.mustChangePassword && !OPEN_ROUTES.has(pathname)) {
      router.replace(SET_PASSWORD_ROUTE);
    }
  }, [user?.mustChangePassword, pathname, router]);

  return null;
}
