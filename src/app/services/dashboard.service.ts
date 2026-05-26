import { API_BASE_URL } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

// ==================== Types ====================

export interface SchoolDashboardData {
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalParents: number;
  recentClasses: Array<{
    _id: string;
    name: string;
    classDescription?: string;
    classCapacity?: number;
    studentCount: number;
    createdAt: string;
  }>;
  studentDistribution: Array<{
    className: string;
    studentCount: number;
  }>;
  schoolInfo: {
    _id: string;
    name: string;
    email: string;
    schoolPrefix: string;
    physicalAddress: string;
    location: { country: string; state: string; _id: string };
    primaryContacts: Array<{
      name: string;
      phone: string;
      email: string;
      role: string;
      _id: string;
    }>;
    active: boolean;
    logo: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DashboardSummary {
  students: {
    total: number;
    active: number;
    inactive: number;
    trendPercent: number;
  };
  teachers: {
    total: number;
    formTeachers: number;
    trendPercent: number;
  };
  classes: {
    total: number;
    capacityUtilization: number;
    trendPercent: number;
  };
  fees: {
    collectionRate: number;
    collectedAmount: number;
    expectedAmount: number;
    trendPercent: number;
  };
  wallet: {
    balance: number;
  };
  notifications: {
    unreadTotal: number;
    messages: number;
    alerts: number;
    trendPercent: number;
  };
}

export interface FinanceSummary {
  revenueThisMonth: number;
  monthOverMonthPercent: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  feeStatus: {
    totalExpected: number;
    paid: number;
    pending: number;
    overdue: number;
  };
}

export interface AcademicSummary {
  currentTerm: {
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    elapsedPercent: number;
    daysRemaining: number;
  };
  assessments: {
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  studentDistribution: Array<{ className: string; count: number }>;
}

export interface PendingActionsData {
  transfers: { incoming: number; outgoing: number };
  leaveRequests: { pending: number };
  promotionRuns: { open: number; pendingValidation: number };
  studentsWithoutEnrollment: { count: number };
}

export interface RecentPayment {
  studentName: string;
  amount: number;
  method: string;
  createdAt: string;
  status: "success" | "pending" | "failed";
}

export interface RecentAnnouncement {
  title: string;
  audience: string;
  publishedAt: string;
  readRate: number;
}

// ==================== Helpers ====================

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const res = await apiClient.get(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ==================== Service Functions ====================

export const getSchoolDashboard = async (
  schoolId: string
): Promise<SchoolDashboardData> => {
  const response = await apiClient.get(
    `${API_BASE_URL}/schools/${schoolId}/dashboard`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to fetch dashboard data: ${response.status}`
    );
  }
  return response.json();
};

export const getDashboardSummary = (schoolId: string) =>
  safeGet<DashboardSummary>(
    `${API_BASE_URL}/schools/${schoolId}/dashboard/summary`
  );

export const getFinanceSummary = (schoolId: string) =>
  safeGet<FinanceSummary>(
    `${API_BASE_URL}/schools/${schoolId}/dashboard/finance-summary?period=6months`
  );

export const getAcademicSummary = (schoolId: string) =>
  safeGet<AcademicSummary>(
    `${API_BASE_URL}/schools/${schoolId}/dashboard/academic-summary`
  );

export const getPendingActions = (schoolId: string) =>
  safeGet<PendingActionsData>(
    `${API_BASE_URL}/schools/${schoolId}/dashboard/pending-actions`
  );

export const getRecentPayments = (schoolId: string, limit = 5) =>
  safeGet<RecentPayment[]>(
    `${API_BASE_URL}/schools/${schoolId}/dashboard/recent-payments?limit=${limit}`
  );

export const getRecentAnnouncements = (schoolId: string, limit = 5) =>
  safeGet<RecentAnnouncement[]>(
    `${API_BASE_URL}/schools/${schoolId}/dashboard/recent-announcements?limit=${limit}`
  );
