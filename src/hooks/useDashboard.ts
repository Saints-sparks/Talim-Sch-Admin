import { useState, useEffect, useCallback } from "react";
import {
  getSchoolDashboard,
  getDashboardSummary,
  getFinanceSummary,
  getAcademicSummary,
  getPendingActions,
  getRecentPayments,
  getRecentAnnouncements,
  type SchoolDashboardData,
  type DashboardSummary,
  type FinanceSummary,
  type AcademicSummary,
  type PendingActionsData,
  type RecentPayment,
  type RecentAnnouncement,
} from "../app/services/dashboard.service";
import { getSchoolId } from "../app/services/school.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/CustomToast";

// ==================== Original Hook (kept for backward compatibility) ====================

interface UseDashboardReturn {
  dashboardData: SchoolDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [dashboardData, setDashboardData] =
    useState<SchoolDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const schoolId = getSchoolId();
      if (!schoolId) {
        console.warn("No school ID available, skipping dashboard data fetch");
        setDashboardData(null);
        return;
      }

      const data = await getSchoolDashboard(schoolId);
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    isLoading,
    error,
    refreshDashboard,
  };
};

// ==================== Enhanced Hook ====================

export interface EnhancedDashboardState {
  base: SchoolDashboardData | null;
  summary: DashboardSummary | null;
  finance: FinanceSummary | null;
  academic: AcademicSummary | null;
  pendingActions: PendingActionsData | null;
  recentPayments: RecentPayment[];
  recentAnnouncements: RecentAnnouncement[];
}

interface UseEnhancedDashboardReturn {
  data: EnhancedDashboardState;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useEnhancedDashboard = (): UseEnhancedDashboardReturn => {
  const { user } = useAuth();
  const userId = user?._id;

  const [data, setData] = useState<EnhancedDashboardState>({
    base: null,
    summary: null,
    finance: null,
    academic: null,
    pendingActions: null,
    recentPayments: [],
    recentAnnouncements: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const schoolId = getSchoolId();
    if (!schoolId) {
      console.warn("No school ID, skipping dashboard fetch");
      setIsLoading(false);
      return;
    }

    try {
      const [
        base,
        finance,
        academic,
        pendingActions,
        payments,
        announcements,
      ] = await Promise.all([
        getSchoolDashboard(schoolId).catch(() => null),
        getFinanceSummary(schoolId),
        getAcademicSummary(schoolId),
        getPendingActions(schoolId),
        getRecentPayments(schoolId),
        getRecentAnnouncements(schoolId, userId),
      ]);

      const summary = await getDashboardSummary(
        schoolId,
        userId,
        base
          ? {
              totalStudents: base.totalStudents,
              totalTeachers: base.totalTeachers,
              totalClasses: base.totalClasses,
            }
          : undefined
      );

      setData({
        base,
        summary,
        finance,
        academic,
        pendingActions,
        recentPayments: payments ?? [],
        recentAnnouncements: announcements ?? [],
      });

      if (!base) {
        const msg = "Failed to load core dashboard data";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, isLoading, error, refresh: fetchAll };
};
