/**
 * The dashboard page's one hook.
 *
 * It decides what the viewer is allowed to see, starts every panel's query at
 * once (see `./dashboard/useDashboardQueries`), and hands the page a panel's
 * data together with that panel's own loading flag — so a slow wallet call no
 * longer holds the whole page on skeletons, and nothing shifts when the last
 * panel lands.
 *
 * Only the base read is fatal. Every other panel degrades to an empty state,
 * because losing the fee summary must not cost an administrator the page.
 */
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import type {
  AcademicSummary,
  DashboardSummary,
  FinanceSummary,
  PendingActionsData,
  RecentAnnouncement,
  RecentPayment,
  SchoolDashboardData,
} from "@/app/services/dashboard.service";
import {
  useAcademicSummaryQuery,
  useDashboardSummaryQuery,
  useFinanceSummaryQuery,
  useInvalidateDashboard,
  usePendingActionsQuery,
  useRecentAnnouncementsQuery,
  useRecentPaymentsQuery,
  useSchoolDashboardQuery,
  withBaseCounts,
} from "./dashboard/useDashboardQueries";

/** Which panels this viewer's permissions let the page render at all. */
export interface DashboardVisibility {
  finance: boolean;
  academics: boolean;
  assessments: boolean;
  classes: boolean;
  pendingActions: boolean;
  recentPayments: boolean;
  recentAnnouncements: boolean;
}

/** Per-panel loading flags, so each section shows its own skeleton. */
export interface DashboardLoading {
  base: boolean;
  summary: boolean;
  finance: boolean;
  academic: boolean;
  pendingActions: boolean;
  recentActivity: boolean;
}

/** Everything the dashboard page renders. */
export interface DashboardOverview {
  base: SchoolDashboardData | null;
  summary: DashboardSummary | null;
  finance: FinanceSummary | null;
  academic: AcademicSummary | null;
  pendingActions: PendingActionsData | null;
  recentPayments: RecentPayment[];
  recentAnnouncements: RecentAnnouncement[];
  loading: DashboardLoading;
  visibility: DashboardVisibility;
  /** Set only when the base read failed; the page shows its error state. */
  error: unknown;
  /** True while a refresh is in flight and stale data is still on screen. */
  isRefreshing: boolean;
  /** Invalidates every dashboard panel. */
  refresh: () => void;
}

/**
 * Loads the dashboard for the signed-in administrator.
 *
 * @returns The panels' data, their loading flags, what the viewer may see, the
 *   fatal error if the base read failed, and a refresh function.
 */
export function useDashboardOverview(): DashboardOverview {
  const { user } = useAuth();
  const userId = user?._id;
  const { hasPermission, isFullAdmin } = usePermissions();

  const visibility = useMemo<DashboardVisibility>(() => {
    const can = (permission: string) => isFullAdmin || hasPermission(permission);
    const finance =
      can(Permission.MANAGE_FEES) ||
      can(Permission.MANAGE_FINANCE) ||
      can(Permission.MANAGE_PAYMENTS);
    return {
      finance,
      academics:
        can(Permission.MANAGE_CLASSES) ||
        can(Permission.MANAGE_CURRICULUM) ||
        can(Permission.MANAGE_ASSESSMENTS) ||
        can(Permission.MANAGE_TIMETABLE),
      assessments: can(Permission.MANAGE_ASSESSMENTS),
      classes: can(Permission.MANAGE_CLASSES),
      pendingActions:
        can(Permission.MANAGE_TRANSIT) ||
        can(Permission.MANAGE_LEAVE_REQUESTS) ||
        can(Permission.MANAGE_STUDENTS),
      recentPayments: finance,
      recentAnnouncements: can(Permission.MANAGE_ANNOUNCEMENTS) || can(Permission.MANAGE_MESSAGES),
    };
  }, [hasPermission, isFullAdmin]);

  const base = useSchoolDashboardQuery();
  // Ask only for what the viewer may read: a refused request is a 403 in the console, not a hidden card.
  const summary = useDashboardSummaryQuery(userId, {
    fees: isFullAdmin || hasPermission(Permission.MANAGE_FEES),
    wallet: isFullAdmin || hasPermission(Permission.MANAGE_FINANCE),
  });
  const finance = useFinanceSummaryQuery(visibility.finance);
  const academic = useAcademicSummaryQuery(visibility.academics);
  const pendingActions = usePendingActionsQuery(visibility.pendingActions, {
    transit: isFullAdmin || hasPermission(Permission.MANAGE_TRANSIT),
    leave: isFullAdmin || hasPermission(Permission.MANAGE_LEAVE_REQUESTS),
  });
  const recentPayments = useRecentPaymentsQuery(visibility.recentPayments);
  const recentAnnouncements = useRecentAnnouncementsQuery(
    userId,
    visibility.recentAnnouncements
  );

  const invalidate = useInvalidateDashboard();

  const mergedSummary = useMemo(
    () => withBaseCounts(summary.data, base.data),
    [summary.data, base.data]
  );

  return {
    base: base.data ?? null,
    summary: mergedSummary,
    finance: finance.data ?? null,
    academic: academic.data ?? null,
    pendingActions: pendingActions.data ?? null,
    recentPayments: recentPayments.data ?? [],
    recentAnnouncements: recentAnnouncements.data ?? [],
    loading: {
      base: base.isPending && base.isFetching,
      summary: summary.isPending && summary.isFetching,
      finance: finance.isPending && finance.isFetching,
      academic: academic.isPending && academic.isFetching,
      pendingActions: pendingActions.isPending && pendingActions.isFetching,
      recentActivity:
        (recentPayments.isPending && recentPayments.isFetching) ||
        (recentAnnouncements.isPending && recentAnnouncements.isFetching),
    },
    visibility,
    error: base.error,
    isRefreshing:
      base.isFetching ||
      summary.isFetching ||
      finance.isFetching ||
      academic.isFetching ||
      pendingActions.isFetching,
    refresh: () => {
      void invalidate();
    },
  };
}
