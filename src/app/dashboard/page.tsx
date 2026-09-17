"use client";

/**
 * The school administrator's dashboard — the first page after sign-in.
 *
 * The page itself is open to any signed-in administrator; every panel below
 * decides for itself whether this viewer may see it, and `useDashboardOverview`
 * skips the request behind a panel the viewer cannot see. Each panel carries
 * its own loading flag, so the page fills in as answers arrive instead of
 * holding everything on one skeleton.
 */

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDashboardOverview } from "@/hooks/useDashboard";
import { useTheme } from "@/providers/theme-provider";
import SetupProgressWidget from "@/components/SetupProgressWidget";
import { AcademicActivity } from "@/components/dashboard/AcademicActivity";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { FinancialSnapshot } from "@/components/dashboard/FinancialSnapshot";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { PendingActions } from "@/components/dashboard/PendingActions";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SubAdminBanner } from "@/components/dashboard/SubAdminBanner";

export default function Dashboard() {
  const { user } = useAuth();
  const { hasPermission, isFullAdmin, isSubAdmin, permissions } = usePermissions();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const {
    base,
    summary,
    finance,
    academic,
    pendingActions,
    recentPayments,
    recentAnnouncements,
    loading,
    visibility,
    error,
    isRefreshing,
    refresh,
  } = useDashboardOverview();

  /** A full administrator holds every permission implicitly. */
  const can = (permission: string) => isFullAdmin || hasPermission(permission);

  const schoolName = user?.schoolName ?? base?.schoolInfo?.name ?? "Your School";
  const adminName = user?.firstName ?? "Admin";
  const term = academic?.currentTerm;

  if (error && !base && !loading.base) {
    return <DashboardErrorState error={error} onRetry={refresh} isRetrying={isRefreshing} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHero
          adminName={adminName}
          schoolName={schoolName}
          termLabel={term ? `${term.name} · ${term.academicYear}` : null}
          can={can}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />

        {isSubAdmin && <SubAdminBanner permissions={permissions} />}

        {isFullAdmin && (
          <div className="mb-6">
            <SetupProgressWidget />
          </div>
        )}

        <KpiCards base={base} summary={summary} isLoading={loading.base} can={can} />

        {visibility.finance && (
          <FinancialSnapshot finance={finance} isLoading={loading.finance} isDark={isDark} />
        )}

        {visibility.academics && (
          <AcademicActivity
            academic={academic}
            base={base}
            isLoading={loading.academic}
            showAssessments={visibility.assessments}
            showClasses={visibility.classes}
          />
        )}

        {visibility.pendingActions && (
          <PendingActions
            pendingActions={pendingActions}
            isLoading={loading.pendingActions}
            can={can}
          />
        )}

        <RecentActivity
          payments={recentPayments}
          announcements={recentAnnouncements}
          isLoading={loading.recentActivity}
          showPayments={visibility.recentPayments}
          showAnnouncements={visibility.recentAnnouncements}
        />

        <QuickLinks can={can} />
      </div>
    </div>
  );
}
