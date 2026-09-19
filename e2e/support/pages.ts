/**
 * Every destination the sidebar offers a full school admin (see
 * src/components/sidebar/navConfig.ts), with text only the loaded page shows.
 * The sidebar itself contains every page's name, so a heading such as
 * "Classes" proves nothing; the seeded data or the empty-state copy does.
 */
export interface PageSpec {
  path: string;
  /** Seeded data, or the empty-state sentence when the seed leaves the page empty. */
  content: RegExp;
  /** True when `content` is an empty state (the seed has no data for this page). */
  empty?: boolean;
}

export const ADMIN_PAGES: readonly PageSpec[] = [
  { path: "/dashboard", content: /Good (morning|afternoon|evening), Sade/ },
  { path: "/classes", content: /Grade 5A/ },
  { path: "/curriculum", content: /Total Subjects/ },
  { path: "/assessments", content: /First Term CA 1/ },
  { path: "/timetable", content: /Mathematics 5A/ },
  { path: "/fees-management", content: /Term 1 Tuition/ },
  { path: "/payments", content: /Total Collected/ },
  { path: "/finance", content: /No transactions yet/, empty: true },
  { path: "/users/students", content: /Ada Student/ },
  { path: "/users/teachers", content: /Tolu Teacher/ },
  { path: "/users/parents", content: /Paul Parent/ },
  { path: "/users/sub-admins", content: /Sam Subadmin/ },
  { path: "/announcements", content: /Welcome to Greenfield/ },
  { path: "/leave-requests", content: /No Leave Requests Yet/, empty: true },
  { path: "/transit", content: /Pending Incoming Transfers/ },
  { path: "/transit/transfers", content: /No transfers found/, empty: true },
  { path: "/transit/enrollments", content: /No enrollments found/, empty: true },
  { path: "/transit/promotions", content: /No promotion runs found/, empty: true },
  { path: "/messages", content: /No chats yet/, empty: true },
  { path: "/settings", content: /School Profile/ },
];
