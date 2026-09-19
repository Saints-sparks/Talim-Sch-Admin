/**
 * The dashboard's reads, one cached query per panel.
 *
 * The dashboard is the first page after sign-in, and it used to fire its
 * requests in a wave from a single `useEffect`: six in parallel, then the KPI
 * summary once the first had landed. Here every panel owns its own query, so
 * they all start together, the head counts are merged client-side instead of
 * being waited on, and terms and academic years come from the shared reference
 * hooks rather than being fetched a second time.
 *
 * Nothing is fetched that the viewer is not allowed to see: each query's
 * `enabled` mirrors the permission that gates its card, so a sub-admin without
 * `manage:fees` never asks for the fee summary.
 *
 * Counters move during the day but not second to second, so panels use
 * `staleTimes.list`; revisiting the dashboard inside 30s serves the cache
 * instead of refetching.
 */
"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import {
  buildAcademicSummary,
  getDashboardSummary,
  getFinanceSummary,
  getPendingActions,
  getRecentAnnouncements,
  getRecentPayments,
  getSchoolDashboard,
  type AcademicSummary,
  type PendingAccess,
  type SummaryAccess,
  type DashboardSummary,
  type FinanceSummary,
  type PendingActionsData,
  type RecentAnnouncement,
  type RecentPayment,
  type SchoolDashboardData,
} from "@/app/services/dashboard.service";
import { dashboardKeys } from "./keys";

/** How many rows the recent-activity panels show. */
export const RECENT_ROW_LIMIT = 5;

/**
 * Fills the KPI head counts from the base dashboard read.
 *
 * The summary endpoint knows about money and notifications but not about
 * student, teacher and class totals, so the two reads run in parallel and are
 * joined here rather than chained.
 *
 * @param summary - The money/notification half, or `null` if it failed.
 * @param base - The base dashboard read, or `null` if it has not landed.
 * @returns The summary with head counts filled in, or `null`.
 */
export function withBaseCounts(
  summary: DashboardSummary | null | undefined,
  base: SchoolDashboardData | null | undefined
): DashboardSummary | null {
  if (!summary) return null;
  if (!base) return summary;
  return {
    ...summary,
    students: {
      ...summary.students,
      total: base.totalStudents,
      active: base.totalStudents,
    },
    teachers: { ...summary.teachers, total: base.totalTeachers },
    classes: { ...summary.classes, total: base.totalClasses },
  };
}

/**
 * Head counts, recent classes and the school profile. The only read the page
 * cannot render without — its failure is the page's error state.
 *
 * @returns Query result.
 */
export function useSchoolDashboardQuery(): UseQueryResult<SchoolDashboardData> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dashboardKeys.base(schoolId ?? "none"),
    queryFn: () => getSchoolDashboard(schoolId as string),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * The KPI card numbers that come from money and notifications.
 *
 * @param userId - Viewer whose unread notification count is included.
 * @param access - Which money reads the viewer may make; the others are not sent.
 * @returns Query result; `data` is `null` when every source that was asked for is unavailable.
 */
export function useDashboardSummaryQuery(
  userId?: string,
  access: SummaryAccess = {}
): UseQueryResult<DashboardSummary | null> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dashboardKeys.summary(schoolId ?? "none", userId),
    queryFn: () => getDashboardSummary(userId, undefined, access),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * Revenue bars and the fee-status donut.
 *
 * @param enabled - False when the viewer cannot see the school's money.
 * @returns Query result; `data` is `null` when every source is unavailable.
 */
export function useFinanceSummaryQuery(enabled: boolean): UseQueryResult<FinanceSummary | null> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dashboardKeys.finance(schoolId ?? "none"),
    queryFn: getFinanceSummary,
    enabled: Boolean(schoolId) && enabled,
    staleTime: staleTimes.list,
  });
}

/**
 * Term progress and assessment counts, built on the terms and academic years
 * the shared reference hooks already cache.
 *
 * @param enabled - False when the viewer cannot see academics.
 * @returns Query result; `data` is `null` when no term is marked current.
 */
export function useAcademicSummaryQuery(
  enabled: boolean
): UseQueryResult<AcademicSummary | null> {
  const schoolId = useSchoolId();
  const terms = useTerms();
  const years = useAcademicYears();
  const referenceReady = !terms.isLoading && !years.isLoading;

  return useQuery({
    queryKey: dashboardKeys.academic(schoolId ?? "none"),
    queryFn: () => buildAcademicSummary(terms.data ?? [], years.data ?? []),
    enabled: Boolean(schoolId) && enabled && referenceReady,
    staleTime: staleTimes.list,
  });
}

/**
 * Transfer, leave and promotion queues waiting on an administrator.
 *
 * @param enabled - False when the viewer governs none of those areas.
 * @param access - Which queues the viewer may read; the others are not requested.
 * @returns Query result.
 */
export function usePendingActionsQuery(
  enabled: boolean,
  access: PendingAccess = {}
): UseQueryResult<PendingActionsData> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dashboardKeys.pendingActions(schoolId ?? "none"),
    queryFn: () => getPendingActions(access),
    enabled: Boolean(schoolId) && enabled,
    staleTime: staleTimes.list,
  });
}

/**
 * The newest payments for the recent-activity panel.
 *
 * @param enabled - False when the viewer cannot see payments.
 * @returns Query result; `data` is `[]` when the endpoint is unavailable.
 */
export function useRecentPaymentsQuery(enabled: boolean): UseQueryResult<RecentPayment[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dashboardKeys.recentPayments(schoolId ?? "none", RECENT_ROW_LIMIT),
    queryFn: () => getRecentPayments(RECENT_ROW_LIMIT),
    enabled: Boolean(schoolId) && enabled,
    staleTime: staleTimes.list,
  });
}

/**
 * The newest published announcements for the recent-activity panel.
 *
 * @param userId - Viewer, for the "my announcements" fallback.
 * @param enabled - False when the viewer cannot see announcements.
 * @returns Query result; `data` is `[]` when neither list has anything.
 */
export function useRecentAnnouncementsQuery(
  userId: string | undefined,
  enabled: boolean
): UseQueryResult<RecentAnnouncement[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dashboardKeys.recentAnnouncements(schoolId ?? "none", userId, RECENT_ROW_LIMIT),
    queryFn: () => getRecentAnnouncements(schoolId as string, userId, RECENT_ROW_LIMIT),
    enabled: Boolean(schoolId) && enabled,
    staleTime: staleTimes.list,
  });
}

/**
 * Drops every dashboard panel so the next render refetches.
 *
 * Use it after anything that changes what the dashboard counts, and on the
 * page's own Refresh button.
 *
 * @returns A function that invalidates the dashboard's queries.
 */
export function useInvalidateDashboard(): () => Promise<void> {
  const client = useQueryClient();
  return async () => {
    await Promise.all(
      dashboardKeys.roots.map((queryKey) => client.invalidateQueries({ queryKey }))
    );
  };
}
