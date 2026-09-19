/**
 * Behaviour of the app sidebar: which entries the signed-in admin may see,
 * which group is open, and what a click or a sign-out does.
 *
 * The sidebar components only draw; the rules live here and in
 * `components/sidebar/navConfig.ts` so they can be tested without rendering.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { useChatAlerts } from "@/context/ChatAlertsContext";
import { useSidebar } from "@/context/SidebarContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logger } from "@/lib/logger";
import {
  NAV_GROUP_PATHS,
  NAV_ITEMS,
  visibleNavItems,
  type NavAccess,
  type NavBadgeKey,
  type NavItem,
} from "@/components/sidebar/navConfig";

/** Which groups are open, keyed by the group's path. */
type OpenGroups = Record<string, boolean>;

/** What {@link useSidebarNav} hands the sidebar. */
export interface SidebarNav {
  pathname: string;
  /** The entries this admin may see. */
  items: NavItem[];
  /** What the admin may see, for filtering a group's sub-items. */
  access: NavAccess;
  /** Live counts for entries that show one. */
  badges: Record<NavBadgeKey, number>;
  /** Whether a group is open. */
  isGroupOpen: (path: string) => boolean;
  /** Opens or closes a group. */
  toggleGroup: (path: string) => void;
  /** Runs when a link is clicked: closes the Users group when leaving it, and the mobile drawer. */
  handleLinkClick: (path?: string) => void;
  /** Signs out, then returns to the sign-in page. */
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

/**
 * The sidebar's state and handlers.
 *
 * A group opens by itself when the location is inside it and closes when the
 * location leaves it; the admin can still toggle it by hand in between.
 * Entries are filtered per sub-item: a group shows when at least one of its
 * pages is open to the admin.
 *
 * @returns Visible items, badge counts, group state and click handlers.
 */
export function useSidebarNav(): SidebarNav {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { hasPermission, isFullAdmin } = usePermissions();
  // Kept current by the app-wide chat listener, across reconnects and pages.
  const { unreadTotal } = useChatAlerts();
  const { isMobile, setMobileOpen } = useSidebar();

  const [openGroups, setOpenGroups] = useState<OpenGroups>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setOpenGroups(Object.fromEntries(NAV_GROUP_PATHS.map((path) => [path, pathname.startsWith(path)])));
  }, [pathname]);

  const toggleGroup = useCallback((path: string) => {
    setOpenGroups((current) => ({ ...current, [path]: !current[path] }));
  }, []);

  const handleLinkClick = useCallback(
    (path?: string) => {
      if (path && !path.startsWith("/users")) {
        setOpenGroups((current) => (current["/users"] ? { ...current, "/users": false } : current));
      }
      if (isMobile) setMobileOpen(false);
    },
    [isMobile, setMobileOpen],
  );

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully!");
      if (isMobile) setMobileOpen(false);
      router.push("/");
    } catch (error) {
      logger.error("auth", "Sign-out failed", error);
      toast.error("An error occurred during logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, isMobile, setMobileOpen, router]);

  const access: NavAccess = { hasPermission, isFullAdmin };

  return {
    pathname,
    items: visibleNavItems(NAV_ITEMS, access),
    access,
    badges: { unreadMessages: unreadTotal },
    isGroupOpen: (path) => Boolean(openGroups[path]),
    toggleGroup,
    handleLinkClick,
    handleLogout,
    isLoggingOut,
  };
}
