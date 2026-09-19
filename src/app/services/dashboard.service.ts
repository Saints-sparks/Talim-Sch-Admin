/**
 * Everything the school admin dashboard reads.
 *
 * The API has no single dashboard endpoint beyond `/schools/:id/dashboard`, so
 * the summaries here fan out across the fees, finance, transit, leave,
 * payments and notification endpoints and derive the numbers the cards show.
 *
 * Two error policies live side by side on purpose:
 *  - `getSchoolDashboard` throws `ApiError` — without it the page has nothing
 *    to render, so the page shows a full error state.
 *  - every other reader returns `null` (or `[]`) when its endpoint fails,
 *    through `safeGet`. One unavailable widget must not blank the dashboard;
 *    the card renders its own empty state instead.
 *
 * The school comes from the bearer token on every call except the two that
 * take a path id. Callers must never compare `schoolId` values by identity.
 */

import { api } from "@/lib/apiClient";
import { getTerms, getAcademicYears } from "./academic.service";
import { assessmentService } from "./assessment.service";
import { getUnreadNotificationCount } from "./notification.service";
import { logger } from "@/lib/logger";

// ==================== Types ====================

/** Counts and school profile from `GET /schools/:schoolId/dashboard`. */
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

/** The six KPI cards at the top of the dashboard. */
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

/** Revenue chart and fee-status donut. */
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

/** Term progress, assessment counts and enrolment by class. */
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

/** Queues waiting on an administrator. */
export interface PendingActionsData {
  transfers: { incoming: number; outgoing: number };
  leaveRequests: { pending: number };
  promotionRuns: { open: number; pendingValidation: number };
  studentsWithoutEnrollment: { count: number };
}

/** One row of the recent payments panel. */
export interface RecentPayment {
  studentName: string;
  amount: number;
  method: string;
  createdAt: string;
  status: "success" | "pending" | "failed";
}

/** One row of the recent announcements panel. */
export interface RecentAnnouncement {
  title: string;
  audience: string;
  publishedAt: string;
  readRate: number;
}

/** `GET /fees/dashboard/summary`. */
interface FeesDashboardBody {
  totalExpectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

/** `GET /finance/wallet/summary`. */
interface WalletSummaryBody {
  success: boolean;
  summary: { availableBalance: number; thisMonthRevenue?: number };
}

/** One row of `GET /finance/wallet/transactions`. */
interface WalletTransaction {
  direction?: string;
  amount: number;
  createdAt: string;
}

/** `GET /transit/dashboard`. */
interface TransitDashboardBody {
  pendingIncoming: number;
  pendingOutgoing: number;
  openPromotionRuns: number;
}

/** One row of `GET /payments/admin/transactions` (`PaymentTransaction`). */
interface PaymentTransactionRow {
  internalReference?: string;
  amount?: number;
  schoolAmount?: number;
  paymentChannel?: string;
  providerName?: string;
  paidAt?: string;
  createdAt: string;
  status?: string;
}

/** One row of `GET /notifications/announcements/...` (`Announcement`). */
interface AnnouncementRow {
  title: string;
  targetAudience?: string | string[];
  audience?: string | string[];
  publishedAt?: string;
  createdAt: string;
  readRate?: number;
}

// ==================== Helpers ====================

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

const AUDIENCE_LABELS: Record<string, string> = {
  all_parents: "All Parents",
  parents: "All Parents",
  "all parents": "All Parents",
  all_students: "All Students",
  students: "All Students",
  "all students": "All Students",
  all_teachers: "All Teachers",
  teachers: "All Teachers",
  "all teachers": "All Teachers",
  all: "Everyone",
  custom: "Custom",
};

/**
 * Turns the backend's `AnnouncementAudience` values into something readable,
 * hiding the raw user ids a custom audience is stored as.
 *
 * @param raw - The audience field, one value or many.
 * @returns A comma-joined label, "Custom" when only ids were sent.
 */
function normalizeAudienceLabel(raw?: string | string[]): string {
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!arr.length) return "All";
  const resolved = arr
    .map((item) => (MONGO_ID_RE.test(item) ? null : (AUDIENCE_LABELS[item.toLowerCase()] ?? item)))
    .filter(Boolean) as string[];
  return resolved.length ? [...new Set(resolved)].join(", ") : "Custom";
}

/**
 * A read whose failure only costs one card. Logs for the developer and
 * resolves `null` so the dashboard keeps rendering.
 *
 * @typeParam T - Shape of the successful body.
 * @param url - Path to read.
 * @returns The parsed body, or `null` when the request failed.
 */
async function safeGet<T>(url: string): Promise<T | null> {
  try {
    return await api.get<T>(url);
  } catch (err) {
    logger.error("dashboard", `Optional dashboard read failed: ${url}`, err);
    return null;
  }
}

/**
 * Buckets wallet credits into the last six calendar months.
 *
 * @param entries - Wallet ledger rows, newest or oldest first.
 * @returns Up to six `{ month, amount }` points, oldest first.
 */
function buildMonthlyRevenue(
  entries: WalletTransaction[]
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
    .sort((a, b) => new Date("1 " + a.month).getTime() - new Date("1 " + b.month).getTime())
    .slice(-6);
}

// ==================== Service Functions ====================

/**
 * The school's headline counts, recent classes and profile.
 *
 * @param schoolId - School to read; the only dashboard call that needs it.
 * @returns The dashboard document.
 * @throws ApiError When the read fails — the page cannot render without it.
 */
export const getSchoolDashboard = async (schoolId: string): Promise<SchoolDashboardData> => {
  return api.get<SchoolDashboardData>(`/schools/${encodeURIComponent(schoolId)}/dashboard`);
};

/** Which money reads the viewer may make; a read they may not make is never sent. */
export interface SummaryAccess {
  /** Holds `manage:fees` (fee collection totals). */
  fees?: boolean;
  /** Holds `manage:finance` (wallet balance). */
  wallet?: boolean;
}

/**
 * The KPI card numbers: fee collection from `/fees/dashboard/summary`, wallet
 * balance from `/finance/wallet/summary`, unread count from notifications, and
 * head counts passed in from the base dashboard rather than fetched twice.
 *
 * @param userId - Viewer, for their unread notification count; omit to skip it.
 * @param baseStats - Student, teacher and class totals already loaded.
 * @param access - Which money reads the viewer may make (default: both). A
 *   sub-admin without `manage:fees` used to send the request anyway and log a 403.
 * @returns The summary, or `null` when every money endpoint that was asked for is unavailable.
 */
export const getDashboardSummary = async (
  userId?: string,
  baseStats?: Pick<SchoolDashboardData, "totalStudents" | "totalTeachers" | "totalClasses">,
  access: SummaryAccess = {}
): Promise<DashboardSummary | null> => {
  const wantFees = access.fees ?? true;
  const wantWallet = access.wallet ?? true;
  const [fees, wallet, unreadCount] = await Promise.all([
    wantFees ? safeGet<FeesDashboardBody>("/fees/dashboard/summary") : Promise.resolve(null),
    wantWallet ? safeGet<WalletSummaryBody>("/finance/wallet/summary") : Promise.resolve(null),
    userId ? getUnreadNotificationCount(userId).catch(() => 0) : Promise.resolve(0),
  ]);

  // Nothing answered although money was asked for: there is no summary. A viewer with no
  // money access at all still gets the head counts and their unread notifications.
  if ((wantFees || wantWallet) && !fees && !wallet) return null;

  const totalExpected = fees?.totalExpectedAmount ?? 0;
  const paid = fees?.paidAmount ?? 0;

  return {
    students: {
      total: baseStats?.totalStudents ?? 0,
      active: baseStats?.totalStudents ?? 0,
      inactive: 0,
      trendPercent: 0,
    },
    teachers: {
      total: baseStats?.totalTeachers ?? 0,
      formTeachers: 0,
      trendPercent: 0,
    },
    classes: {
      total: baseStats?.totalClasses ?? 0,
      capacityUtilization: 0,
      trendPercent: 0,
    },
    fees: {
      collectionRate: totalExpected > 0 ? (paid / totalExpected) * 100 : 0,
      collectedAmount: paid,
      expectedAmount: totalExpected,
      trendPercent: 0,
    },
    wallet: { balance: wallet?.summary?.availableBalance ?? 0 },
    notifications: {
      unreadTotal: unreadCount ?? 0,
      messages: 0,
      alerts: 0,
      trendPercent: 0,
    },
  };
};

/**
 * Revenue and fee status: `/fees/dashboard/summary` for the donut,
 * `/finance/wallet/summary` and the wallet ledger for the monthly bars.
 *
 * @returns The finance summary, or `null` when both endpoints are unavailable.
 */
export const getFinanceSummary = async (): Promise<FinanceSummary | null> => {
  const [fees, wallet, txnRes] = await Promise.all([
    safeGet<FeesDashboardBody>("/fees/dashboard/summary"),
    safeGet<WalletSummaryBody>("/finance/wallet/summary"),
    safeGet<{ success: boolean; data: WalletTransaction[] }>(
      "/finance/wallet/transactions?limit=200"
    ),
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

/**
 * Term progress and assessment counts.
 *
 * @param terms - The school's terms, already cached by `useTerms()`.
 * @param years - The school's academic years, already cached by `useAcademicYears()`.
 * @returns The academic summary, or `null` when no term is marked current.
 */
export const buildAcademicSummary = async (
  terms: Array<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>,
  years: Array<{ year: string; isCurrent: boolean }>
): Promise<AcademicSummary | null> => {
  const currentTerm = terms.find((t) => t.isCurrent);
  if (!currentTerm) return null;

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];

  const now = Date.now();
  const start = new Date(currentTerm.startDate).getTime();
  const end = new Date(currentTerm.endDate).getTime();
  const totalMs = Math.max(1, end - start);
  const elapsedMs = Math.max(0, Math.min(now - start, totalMs));
  const elapsedPercent = Math.round((elapsedMs / totalMs) * 100);
  const daysRemaining = Math.max(0, Math.ceil((end - now) / 86400000));

  const assessmentRes = await assessmentService
    .getAssessmentsBySchool(1, 200)
    .catch(() => ({ assessments: [] }));

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

/**
 * Term progress and assessment counts, fetching terms and years itself.
 *
 * Prefer `buildAcademicSummary` with the cached reference lists; this wrapper
 * exists for callers that have no query client.
 *
 * @returns The academic summary, or `null` when no term is marked current.
 */
export const getAcademicSummary = async (): Promise<AcademicSummary | null> => {
  const [terms, years] = await Promise.all([
    getTerms().catch(() => []),
    getAcademicYears().catch(() => []),
  ]);
  return buildAcademicSummary(terms, years);
};

/** Which queues the viewer may read; a queue they may not read is never requested. */
export interface PendingAccess {
  /** Holds `manage:transit`. */
  transit?: boolean;
  /** Holds `manage:leave_requests`. */
  leave?: boolean;
}

/**
 * The queues waiting on an administrator: transfers and promotion runs from
 * `/transit/dashboard`, pending leave from the school-admin leave list.
 *
 * @param access - Which queues the viewer may read (default: both). Each read
 *   the viewer may not make is skipped rather than sent and refused with a 403.
 * @returns The pending-action counts; zeroes when an endpoint is unavailable or not permitted.
 */
export const getPendingActions = async (access: PendingAccess = {}): Promise<PendingActionsData> => {
  const [transit, leaveRes] = await Promise.all([
    access.transit ?? true ? safeGet<TransitDashboardBody>("/transit/dashboard") : Promise.resolve(null),
    access.leave ?? true
      ? safeGet<{ data: Array<{ status: string }> }>("/leave-requests/school-admin/all")
      : Promise.resolve(null),
  ]);

  const leaveData = leaveRes?.data ?? [];
  const pendingLeave = leaveData.filter((r) => r.status?.toLowerCase() === "pending").length;

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

/**
 * The newest payment transactions for the recent-payments panel.
 *
 * @param limit - How many rows to show.
 * @returns The rows, or `[]` when the endpoint is unavailable.
 */
export const getRecentPayments = async (limit = 5): Promise<RecentPayment[]> => {
  const res = await safeGet<{ success: boolean; data: PaymentTransactionRow[] }>(
    `/payments/admin/transactions?limit=${limit}`
  );
  if (!res?.data?.length) return [];

  return res.data.map((t) => ({
    studentName: t.internalReference ?? "Payment",
    amount: t.schoolAmount ?? t.amount ?? 0,
    method: t.paymentChannel ?? t.providerName ?? "Online",
    createdAt: t.paidAt ?? t.createdAt,
    status:
      t.status === "successful" ? "success" : t.status === "pending" ? "pending" : "failed",
  }));
};

/**
 * The newest published announcements. Falls back to the viewer's own
 * announcements when the school list comes back empty, which is what a
 * sub-admin who only posts their own sees.
 *
 * @param schoolId - School whose announcements to read.
 * @param userId - Viewer, for the sender fallback; omit to skip it.
 * @param limit - How many rows to show.
 * @returns The rows, or `[]` when neither list has anything.
 */
export const getRecentAnnouncements = async (
  schoolId: string,
  userId?: string,
  limit = 5
): Promise<RecentAnnouncement[]> => {
  const bySchool = await safeGet<{ data: AnnouncementRow[] }>(
    `/notifications/announcements/school/${schoolId}?page=1&limit=${limit}&status=PUBLISHED`
  );
  const bySender =
    !bySchool?.data?.length && userId
      ? await safeGet<{ data: AnnouncementRow[] }>(
          `/notifications/announcements/sender/${userId}?page=1&limit=${limit}&status=PUBLISHED`
        )
      : null;
  const res = bySchool?.data?.length ? bySchool : bySender;
  if (!res?.data?.length) return [];

  return res.data.map((a) => ({
    title: a.title,
    audience: normalizeAudienceLabel(a.targetAudience ?? a.audience),
    publishedAt: a.publishedAt ?? a.createdAt,
    readRate: typeof a.readRate === "number" ? a.readRate : 0,
  }));
};
