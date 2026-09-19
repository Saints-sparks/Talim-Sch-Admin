/**
 * The sidebar's navigation as data: which pages exist, what each one needs to
 * be seen, and the pure rules for filtering and highlighting them.
 *
 * Every page the sidebar links to carries the permission that governs it, so
 * a sub-admin never sees a link the route guard would turn away. That has to
 * stay in step with `src/lib/routePermissions.ts`; a test compares the two.
 * The primary school admin always sees everything except what is marked
 * `fullAdminOnly`, which not even a sub-admin holding the permission may open.
 */
import { Permission, type PermissionValue } from "@/lib/permissions";

/** Which icon an item wears. The renderer maps each key to its glyph. */
export type NavIconKey =
  | "dashboard"
  | "classes"
  | "curriculum"
  | "assessments"
  | "timetable"
  | "fees"
  | "payments"
  | "finance"
  | "users"
  | "announcements"
  | "leaveRequests"
  | "transit"
  | "messages"
  | "settings";

/** A live count shown on an item. */
export type NavBadgeKey = "unreadMessages";

/** A page reached from inside a group. */
export interface NavSubItem {
  path: string;
  label: string;
  tooltip: string;
  /** Needed to see the page. Falls back to the group's permission. */
  permission?: PermissionValue;
  /** Only the primary school admin may see it, whatever a sub-admin holds. */
  fullAdminOnly?: boolean;
}

/** A top-level entry: a page, or a group of pages that opens in place. */
export interface NavItem {
  path: string;
  label: string;
  tooltip: string;
  icon: NavIconKey;
  /** Needed to see the page. Omit for pages every signed-in admin may open. */
  permission?: PermissionValue;
  /** Present on a group. The group itself is not a page; clicking it opens the list. */
  subItems?: readonly NavSubItem[];
  /** A count drawn on the item. */
  badge?: NavBadgeKey;
}

/** Everything the sidebar can show, in order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: "/dashboard", label: "Dashboard", tooltip: "Dashboard", icon: "dashboard" },
  {
    path: "/classes",
    label: "Classes",
    tooltip: "Classes",
    icon: "classes",
    permission: Permission.MANAGE_CLASSES,
  },
  {
    path: "/curriculum",
    label: "Curriculum",
    tooltip: "Curriculum (Subjects & Courses)",
    icon: "curriculum",
    permission: Permission.MANAGE_CURRICULUM,
  },
  {
    path: "/assessments",
    label: "Assessments",
    tooltip: "Assessments",
    icon: "assessments",
    permission: Permission.MANAGE_ASSESSMENTS,
  },
  {
    path: "/timetable",
    label: "Timetable",
    tooltip: "Timetable",
    icon: "timetable",
    permission: Permission.MANAGE_TIMETABLE,
  },
  {
    path: "/fees-management",
    label: "Fees Management",
    tooltip: "Fees Management",
    icon: "fees",
    permission: Permission.MANAGE_FEES,
  },
  {
    path: "/payments",
    label: "Payments",
    tooltip: "Payments",
    icon: "payments",
    permission: Permission.MANAGE_PAYMENTS,
  },
  {
    path: "/finance",
    label: "Finance",
    tooltip: "Wallet & Withdrawals",
    icon: "finance",
    permission: Permission.MANAGE_FINANCE,
  },
  {
    path: "/users",
    label: "Users",
    tooltip: "Users",
    icon: "users",
    subItems: [
      {
        path: "/users/students",
        label: "Students",
        tooltip: "Student Directory",
        permission: Permission.MANAGE_STUDENTS,
      },
      {
        path: "/users/teachers",
        label: "Teachers",
        tooltip: "Teacher Directory",
        permission: Permission.MANAGE_TEACHERS,
      },
      {
        path: "/users/parents",
        label: "Parents",
        tooltip: "Parent Directory",
        permission: Permission.MANAGE_PARENTS,
      },
      {
        path: "/users/sub-admins",
        label: "Sub-Admins",
        tooltip: "Sub-Admin Management",
        permission: Permission.MANAGE_SUB_ADMINS,
        fullAdminOnly: true,
      },
    ],
  },
  {
    path: "/announcements",
    label: "Announcements",
    tooltip: "Announcements",
    icon: "announcements",
    permission: Permission.MANAGE_ANNOUNCEMENTS,
  },
  {
    path: "/leave-requests",
    label: "Leave Requests",
    tooltip: "Leave Requests",
    icon: "leaveRequests",
    permission: Permission.MANAGE_LEAVE_REQUESTS,
  },
  {
    path: "/transit",
    label: "Transit",
    tooltip: "Student Transfers & Promotions",
    icon: "transit",
    permission: Permission.MANAGE_TRANSIT,
    subItems: [
      { path: "/transit", label: "Dashboard", tooltip: "Transit Overview" },
      { path: "/transit/transfers", label: "Transfers", tooltip: "Student Transfers" },
      { path: "/transit/enrollments", label: "Enrollments", tooltip: "Student Enrollments" },
      { path: "/transit/promotions", label: "Promotions", tooltip: "Class Promotions" },
    ],
  },
  {
    path: "/messages",
    label: "Messages",
    tooltip: "Messages",
    icon: "messages",
    permission: Permission.MANAGE_MESSAGES,
    badge: "unreadMessages",
  },
  {
    path: "/settings",
    label: "Settings",
    tooltip: "Academic Year & Term Settings",
    icon: "settings",
    permission: Permission.MANAGE_SETTINGS,
  },
];

/** What the filter needs to know about the signed-in administrator. */
export interface NavAccess {
  /** True when the user holds `permission` (a full admin holds all of them). */
  hasPermission: (permission: string) => boolean;
  /** True for the primary school admin. */
  isFullAdmin: boolean;
}

/**
 * The permission that governs a sub-item: its own, else its group's.
 *
 * @param sub - The sub-item.
 * @param group - The group it belongs to.
 * @returns The permission, or `undefined` when the page is open.
 */
export function subItemPermission(sub: NavSubItem, group: NavItem): PermissionValue | undefined {
  return sub.permission ?? group.permission;
}

/**
 * Whether the user may see a sub-item.
 *
 * @param sub - The sub-item.
 * @param group - The group it belongs to.
 * @param access - The user's access.
 * @returns True when the link should be shown.
 */
export function canSeeSubItem(sub: NavSubItem, group: NavItem, access: NavAccess): boolean {
  const permission = subItemPermission(sub, group);
  return (
    (!sub.fullAdminOnly || access.isFullAdmin) && (!permission || access.hasPermission(permission))
  );
}

/**
 * The sub-items of a group the user may open.
 *
 * @param group - The group.
 * @param access - The user's access.
 * @returns The visible sub-items, in order.
 */
export function visibleSubItems(group: NavItem, access: NavAccess): NavSubItem[] {
  return (group.subItems ?? []).filter((sub) => canSeeSubItem(sub, group, access));
}

/**
 * The entries the user may see. A group shows when they can open at least one
 * of its pages — the Users group used to demand `manage:students` even of a
 * teachers-only sub-admin. A plain item shows when its permission is held.
 *
 * @param items - The full menu.
 * @param access - The user's access.
 * @returns The visible entries, in order.
 */
export function visibleNavItems(items: readonly NavItem[], access: NavAccess): NavItem[] {
  return items.filter((item) =>
    item.subItems?.length
      ? visibleSubItems(item, access).length > 0
      : !item.permission || access.hasPermission(item.permission),
  );
}

/**
 * Whether a top-level entry is the current section: the path is a prefix of the
 * location, so `/users` stays lit on `/users/teachers/123`.
 *
 * @param pathname - The current location.
 * @param item - The entry.
 * @returns True when the entry should be highlighted.
 */
export function isNavItemActive(pathname: string, item: Pick<NavItem, "path">): boolean {
  return pathname.startsWith(item.path);
}

/**
 * Whether a sub-item is the current page. Exact, so `/transit` (the overview)
 * is not lit on `/transit/transfers`.
 *
 * @param pathname - The current location.
 * @param sub - The sub-item.
 * @returns True when the sub-item should be highlighted.
 */
export function isSubItemActive(pathname: string, sub: Pick<NavSubItem, "path">): boolean {
  return pathname === sub.path;
}

/** The paths of the entries that open in place rather than navigate. */
export const NAV_GROUP_PATHS: readonly string[] = NAV_ITEMS.filter((item) => item.subItems?.length).map(
  (item) => item.path,
);
