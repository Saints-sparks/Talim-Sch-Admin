import { Permission, type PermissionValue } from "./permissions";

/**
 * Which permission a route needs. Longest prefix wins, so `/users/sub-admins`
 * is checked before `/users`. Routes not listed are open to every signed-in
 * admin. Keep this in step with the backend's `@Permissions()` decorators and
 * the sidebar's `permission` fields — it is what stops a sub-admin landing on
 * a page the API will refuse anyway.
 */
const ROUTE_PERMISSIONS: Array<[prefix: string, permission: PermissionValue]> = [
  ["/classes", Permission.MANAGE_CLASSES],
  ["/curriculum", Permission.MANAGE_CURRICULUM],
  ["/assessments", Permission.MANAGE_ASSESSMENTS],
  ["/timetable", Permission.MANAGE_TIMETABLE],
  ["/fees-management", Permission.MANAGE_FEES],
  ["/payments", Permission.MANAGE_PAYMENTS],
  ["/finance", Permission.MANAGE_FINANCE],
  ["/users/students", Permission.MANAGE_STUDENTS],
  ["/users/teachers", Permission.MANAGE_TEACHERS],
  ["/users/parents", Permission.MANAGE_PARENTS],
  ["/users/sub-admins", Permission.MANAGE_SUB_ADMINS],
  ["/announcements", Permission.MANAGE_ANNOUNCEMENTS],
  ["/leave-requests", Permission.MANAGE_LEAVE_REQUESTS],
  ["/transit", Permission.MANAGE_TRANSIT],
  ["/messages", Permission.MANAGE_MESSAGES],
  ["/settings", Permission.MANAGE_SETTINGS],
];

const SORTED = [...ROUTE_PERMISSIONS].sort((a, b) => b[0].length - a[0].length);

/**
 * The permission required to view `pathname`, or `null` when the route is
 * open to every signed-in admin.
 */
export function requiredPermissionFor(pathname: string): PermissionValue | null {
  for (const [prefix, permission] of SORTED) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return permission;
  }
  return null;
}
