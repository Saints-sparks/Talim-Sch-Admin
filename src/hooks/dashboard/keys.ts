/**
 * Query keys for the dashboard.
 *
 * The dashboard's own panels extend `queryKeys.school.dashboard`, so removing
 * the `["school"]` root on a school switch drops all of them together. Panels
 * that show another area's data (recent payments, recent announcements) use
 * that area's key from `@/lib/queryKeys` instead, so the owning page's
 * mutations refresh the dashboard card too.
 */
import { queryKeys } from "@/lib/queryKeys";

/** Dashboard query keys, each scoped to one school. */
export const dashboardKeys = {
  /** Everything a school switch must drop. */
  all: queryKeys.school.all,

  /** Every cache root a dashboard refresh has to drop, panels included. */
  roots: [
    queryKeys.school.all,
    queryKeys.payments.all,
    queryKeys.announcements.all,
  ] as ReadonlyArray<readonly unknown[]>,

  /**
   * Head counts, recent classes and the school profile.
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  base: (schoolId: string) => queryKeys.school.dashboard(schoolId),

  /**
   * KPI card numbers (fees, wallet, unread notifications).
   *
   * @param schoolId - The signed-in administrator's school.
   * @param userId - Viewer whose unread count is included.
   * @returns The query key.
   */
  summary: (schoolId: string, userId?: string) =>
    [...queryKeys.school.dashboard(schoolId), "summary", userId ?? "anonymous"] as const,

  /**
   * Revenue chart and fee-status donut.
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  finance: (schoolId: string) =>
    [...queryKeys.school.dashboard(schoolId), "finance"] as const,

  /**
   * Term progress and assessment counts.
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  academic: (schoolId: string) =>
    [...queryKeys.school.dashboard(schoolId), "academic"] as const,

  /**
   * Transfer, leave and promotion queues.
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  pendingActions: (schoolId: string) =>
    [...queryKeys.school.dashboard(schoolId), "pending-actions"] as const,

  /**
   * The recent-payments panel; shares the payments page's cache root.
   *
   * @param schoolId - The signed-in administrator's school.
   * @param limit - How many rows the panel shows.
   * @returns The query key.
   */
  recentPayments: (schoolId: string, limit: number) =>
    queryKeys.payments.transactions(schoolId, { limit, scope: "dashboard" }),

  /**
   * The recent-announcements panel; shares the announcements page's cache root.
   *
   * @param schoolId - The signed-in administrator's school.
   * @param userId - Viewer, used for the "my announcements" fallback.
   * @param limit - How many rows the panel shows.
   * @returns The query key.
   */
  recentAnnouncements: (schoolId: string, userId: string | undefined, limit: number) =>
    queryKeys.announcements.list(schoolId, {
      limit,
      status: "PUBLISHED",
      senderFallback: userId ?? null,
    }),
} as const;
