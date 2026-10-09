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
  // The seed (and `--reset`) leaves no term results submitted: the queue opens on its empty Submitted tab.
  { path: "/term-results", content: /Nothing is waiting for review/, empty: true },
  { path: "/timetable", content: /Mathematics 5A/ },
  { path: "/fees-management", content: /Term 1 Tuition/ },
  { path: "/payments", content: /Total Collected/ },
  { path: "/finance", content: /No transactions yet/, empty: true },
  { path: "/users/students", content: /Ada Student/ },
  { path: "/users/teachers", content: /Tolu Teacher/ },
  { path: "/users/parents", content: /Paul Parent/ },
  { path: "/users/sub-admins", content: /Sam Subadmin/ },
  // Newest first: on a freshly seeded database the assessments' own announcements (the portals'
  // Third Term and the grading terms) push "Welcome to Greenfield" off the first page.
  { path: "/announcements", content: /Welcome to Greenfield|New Assessment|Upcoming Assessment/ },
  // The seed approves a leave request for Ben (the Teachers register shows it as on leave).
  { path: "/leave-requests", content: /Ben Student/ },
  { path: "/transit", content: /Pending Incoming Transfers/ },
  { path: "/transit/transfers", content: /No transfers found/, empty: true },
  { path: "/transit/enrollments", content: /No enrollments found/, empty: true },
  { path: "/transit/promotions", content: /No promotion runs found/, empty: true },
  // The seed gives Tolu Teacher a "School office" thread, which every admin reads (Round 4 §28).
  { path: "/messages", content: /Office thread · Tolu Teacher/ },
  { path: "/settings", content: /School Profile/ },
  // v1.5: the support desk (was /complaints) and Help & support. Empty on a fresh seed; 08-support-desk adds tickets.
  { path: "/support", content: /Nothing waiting for the desk|No tickets here|No tickets match|Last activity/ },
  { path: "/help", content: /No open tickets|No tickets here|TS-[A-Z2-9]{5}/ },
];
