import { API_BASE_URL } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";
import { getTerms, getAcademicYears } from "./academic.service";
import { assessmentService } from "./assessment.service";
import { getUnreadNotificationCount } from "./notification.service";

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

function buildMonthlyRevenue(
  entries: Array<{ direction?: string; amount: number; createdAt: string }>
): Array<{ month: string; amount: number }> {
  const byMonth: Record<string, number> = {};
  entries
    .filter((e) => !e.direction || e.direction === "credit")
    .forEach((e) => {
      const d = new Date(e.createdAt);
      const key = d.toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric",
      });
      byMonth[key] = (byMonth[key] ?? 0) + (e.amount ?? 0);
    });

  return Object.entries(byMonth)
    .map(([month, amount]) => ({ month, amount }))
    .sort(
      (a, b) =>
        new Date("1 " + a.month).getTime() - new Date("1 " + b.month).getTime()
    )
    .slice(-6);
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

// Derives fee KPIs from /fees/dashboard/summary and wallet balance from /finance/wallet/summary.
// userId is used to fetch unread notification count.
export const getDashboardSummary = async (
  schoolId: string,
  userId?: string
): Promise<DashboardSummary | null> => {
  const [fees, wallet, unreadCount] = await Promise.all([
    safeGet<{
      totalExpectedAmount: number;
      paidAmount: number;
      outstandingAmount: number;
    }>("/fees/dashboard/summary"),
    safeGet<{
      success: boolean;
      summary: { availableBalance: number };
    }>("/finance/wallet/summary"),
    userId
      ? getUnreadNotificationCount(userId).catch(() => 0)
      : Promise.resolve(0),
  ]);

  if (!fees && !wallet) return null;

  const totalExpected = fees?.totalExpectedAmount ?? 0;
  const paid = fees?.paidAmount ?? 0;

  return {
    students: { total: 0, active: 0, inactive: 0, trendPercent: 0 },
    teachers: { total: 0, formTeachers: 0, trendPercent: 0 },
    classes: { total: 0, capacityUtilization: 0, trendPercent: 0 },
    fees: {
      collectionRate:
        totalExpected > 0 ? (paid / totalExpected) * 100 : 0,
      collectedAmount: paid,
      expectedAmount: totalExpected,
      trendPercent: 0,
    },
    wallet: { balance: wallet?.summary?.availableBalance ?? 0 },
    notifications: {
      unreadTotal: (unreadCount as number) ?? 0,
      messages: 0,
      alerts: 0,
      trendPercent: 0,
    },
  };
};

// Derives revenue and fee status from /fees/dashboard/summary and /finance/wallet/transactions.
export const getFinanceSummary = async (
  schoolId: string
): Promise<FinanceSummary | null> => {
  const [fees, wallet, txnRes] = await Promise.all([
    safeGet<{
      totalExpectedAmount: number;
      paidAmount: number;
      outstandingAmount: number;
    }>("/fees/dashboard/summary"),
    safeGet<{
      success: boolean;
      summary: { availableBalance: number; thisMonthRevenue: number };
    }>("/finance/wallet/summary"),
    safeGet<{
      success: boolean;
      data: Array<{
        direction: string;
        amount: number;
        createdAt: string;
      }>;
    }>("/finance/wallet/transactions?limit=200"),
  ]);

  if (!fees && !wallet) return null;

  const paid = fees?.paidAmount ?? 0;
  const outstanding = fees?.outstandingAmount ?? 0;
  const totalExpected = fees?.totalExpectedAmount ?? 0;
  const revenueThisMonth = wallet?.summary?.thisMonthRevenue ?? paid;

  const monthlyRevenue = buildMonthlyRevenue(txnRes?.data ?? []);

  return {
    revenueThisMonth,
    monthOverMonthPercent: 0,
    monthlyRevenue,
    feeStatus: {
      totalExpected,
      paid,
      pending: outstanding,
      overdue: 0,
    },
  };
};

// Derives term progress from /terms + /academic-years, and assessment counts from /assessments/school.
export const getAcademicSummary = async (
  schoolId: string
): Promise<AcademicSummary | null> => {
  const [terms, years, assessmentRes] = await Promise.all([
    getTerms().catch(() => []),
    getAcademicYears().catch(() => []),
    assessmentService
      .getAssessmentsBySchool(1, 200)
      .catch(() => ({ assessments: [] })),
  ]);

  const currentTerm = terms.find((t) => t.isCurrent);
  if (!currentTerm) return null;

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];

  const now = Date.now();
  const start = new Date(currentTerm.startDate).getTime();
  const end = new Date(currentTerm.endDate).getTime();
  const totalMs = Math.max(1, end - start);
  const elapsedMs = Math.max(0, Math.min(now - start, totalMs));
  const elapsedPercent = Math.round((elapsedMs / totalMs) * 100);
  const daysRemaining = Math.max(
    0,
    Math.ceil((end - now) / 86400000)
  );

  const assessments = assessmentRes?.assessments ?? [];
  const counts = { active: 0, pending: 0, completed: 0, cancelled: 0 };
  assessments.forEach((a) => {
    const s = a.status as keyof typeof counts;
    if (s in counts) counts[s]++;
  });

  return {
    currentTerm: {
      name: currentTerm.name,
      academicYear: currentYear?.year ?? "",
      startDate: currentTerm.startDate,
      endDate: currentTerm.endDate,
      elapsedPercent,
      daysRemaining,
    },
    assessments: counts,
    studentDistribution: [],
  };
};

// Derives pending transfers and leave counts from /transit/dashboard and /leave-requests/school-admin/all.
export const getPendingActions = async (
  schoolId: string
): Promise<PendingActionsData | null> => {
  const [transit, leaveRes] = await Promise.all([
    safeGet<{
      pendingIncoming: number;
      pendingOutgoing: number;
      openPromotionRuns: number;
    }>("/transit/dashboard"),
    safeGet<{ data: Array<{ status: string }> }>(
      "/leave-requests/school-admin/all"
    ),
  ]);

  const leaveData = leaveRes?.data ?? [];
  const pendingLeave = leaveData.filter(
    (r) => r.status?.toLowerCase() === "pending"
  ).length;

  return {
    transfers: {
      incoming: transit?.pendingIncoming ?? 0,
      outgoing: transit?.pendingOutgoing ?? 0,
    },
    leaveRequests: { pending: pendingLeave },
    promotionRuns: {
      open: transit?.openPromotionRuns ?? 0,
      pendingValidation: 0,
    },
    studentsWithoutEnrollment: { count: 0 },
  };
};

export const getRecentPayments = async (
  schoolId: string,
  limit = 5
): Promise<RecentPayment[] | null> => {
  const res = await safeGet<{ success: boolean; data: any[] }>(
    `/payments/admin/transactions?limit=${limit}`
  );
  if (!res?.data?.length) return [];

  return res.data.map((t) => ({
    studentName: t.internalReference ?? "Payment",
    amount: t.schoolAmount ?? t.amount ?? 0,
    method: t.paymentChannel ?? t.providerName ?? "Online",
    createdAt: t.paidAt ?? t.createdAt,
    status: (
      t.status === "successful"
        ? "success"
        : t.status === "pending"
        ? "pending"
        : "failed"
    ) as "success" | "pending" | "failed",
  }));
};

export const getRecentAnnouncements = async (
  schoolId: string,
  userId?: string,
  limit = 5
): Promise<RecentAnnouncement[] | null> => {
  if (!userId) return [];

  const res = await safeGet<{ data: any[]; meta: any }>(
    `/notifications/announcements/sender/${userId}?page=1&limit=${limit}&status=PUBLISHED`
  );
  if (!res?.data?.length) return [];

  return res.data.map((a) => ({
    title: a.title,
    audience: Array.isArray(a.targetAudience ?? a.audience)
      ? (a.targetAudience ?? a.audience).join(", ")
      : (a.targetAudience ?? a.audience ?? "All"),
    publishedAt: a.publishedAt ?? a.createdAt,
    readRate: typeof a.readRate === "number" ? a.readRate : 0,
  }));
};
