import {
  buildAcademicSummary,
  getDashboardSummary,
  getFinanceSummary,
  getPendingActions,
  getRecentAnnouncements,
  getRecentPayments,
  getSchoolDashboard,
} from "@/app/services/dashboard.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";
import { assessmentService } from "@/app/services/assessment.service";
import { getUnreadNotificationCount } from "@/app/services/notification.service";

jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

jest.mock("@/app/services/assessment.service", () => ({
  assessmentService: { getAssessmentsBySchool: jest.fn() },
}));

jest.mock("@/app/services/notification.service", () => ({
  getUnreadNotificationCount: jest.fn(),
}));

// Optional reads log their own failures; the tests exercise those paths on purpose.
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockAssessments = assessmentService.getAssessmentsBySchool as jest.Mock;
const mockUnread = getUnreadNotificationCount as jest.Mock;

/** Answers each optional dashboard read by matching on the path it asks for. */
function routeGet(routes: Record<string, unknown>) {
  mockGet.mockImplementation((url: string) => {
    const match = Object.keys(routes).find((path) => url.includes(path));
    if (!match) return Promise.reject(new ApiError("NOT_FOUND", "No route", 404));
    const value = routes[match];
    return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUnread.mockResolvedValue(0);
  mockAssessments.mockResolvedValue({ assessments: [] });
});

// ─── getSchoolDashboard ───────────────────────────────────────────────────────

describe("getSchoolDashboard", () => {
  it("reads the school's dashboard document", async () => {
    mockGet.mockResolvedValueOnce({ totalStudents: 12 });
    await expect(getSchoolDashboard("sc1")).resolves.toEqual({ totalStudents: 12 });
    expect(mockGet.mock.calls[0][0]).toContain("/schools/sc1/dashboard");
  });

  it("propagates the error — the page cannot render without it", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("FORBIDDEN", "You don't have access", 403));
    await expect(getSchoolDashboard("sc1")).rejects.toThrow("You don't have access");
  });
});

// ─── getDashboardSummary ──────────────────────────────────────────────────────

describe("getDashboardSummary", () => {
  it("derives the fee collection rate and carries the wallet balance", async () => {
    routeGet({
      "/fees/dashboard/summary": {
        totalExpectedAmount: 400,
        paidAmount: 100,
        outstandingAmount: 300,
      },
      "/finance/wallet/summary": { success: true, summary: { availableBalance: 5000 } },
    });
    mockUnread.mockResolvedValue(7);

    const summary = await getDashboardSummary("user-1", {
      totalStudents: 30,
      totalTeachers: 4,
      totalClasses: 3,
    });

    expect(summary?.fees.collectionRate).toBe(25);
    expect(summary?.wallet.balance).toBe(5000);
    expect(summary?.notifications.unreadTotal).toBe(7);
    expect(summary?.students.total).toBe(30);
  });

  it("returns null when neither money endpoint answers", async () => {
    routeGet({});
    await expect(getDashboardSummary("user-1")).resolves.toBeNull();
  });

  it("does not divide by zero when nothing is expected", async () => {
    routeGet({
      "/fees/dashboard/summary": { totalExpectedAmount: 0, paidAmount: 0, outstandingAmount: 0 },
    });
    const summary = await getDashboardSummary();
    expect(summary?.fees.collectionRate).toBe(0);
  });

  it("skips the unread count when there is no viewer", async () => {
    routeGet({
      "/finance/wallet/summary": { success: true, summary: { availableBalance: 1 } },
    });
    await getDashboardSummary(undefined);
    expect(mockUnread).not.toHaveBeenCalled();
  });
});

// ─── getFinanceSummary ────────────────────────────────────────────────────────

describe("getFinanceSummary", () => {
  it("buckets wallet credits into months and ignores debits", async () => {
    routeGet({
      "/fees/dashboard/summary": {
        totalExpectedAmount: 100,
        paidAmount: 60,
        outstandingAmount: 40,
      },
      "/finance/wallet/summary": {
        success: true,
        summary: { availableBalance: 10, thisMonthRevenue: 25 },
      },
      "/finance/wallet/transactions": {
        success: true,
        data: [
          { direction: "credit", amount: 100, createdAt: "2025-01-10T00:00:00.000Z" },
          { direction: "credit", amount: 50, createdAt: "2025-01-20T00:00:00.000Z" },
          { direction: "debit", amount: 999, createdAt: "2025-01-21T00:00:00.000Z" },
          { direction: "credit", amount: 70, createdAt: "2025-02-02T00:00:00.000Z" },
        ],
      },
    });

    const finance = await getFinanceSummary();

    expect(finance?.revenueThisMonth).toBe(25);
    expect(finance?.monthlyRevenue).toHaveLength(2);
    expect(finance?.monthlyRevenue[0].amount).toBe(150);
    expect(finance?.monthlyRevenue[1].amount).toBe(70);
    expect(finance?.feeStatus).toEqual({
      totalExpected: 100,
      paid: 60,
      pending: 40,
      overdue: 0,
    });
  });

  it("falls back to the amount paid when the wallet has no month figure", async () => {
    routeGet({
      "/fees/dashboard/summary": {
        totalExpectedAmount: 100,
        paidAmount: 60,
        outstandingAmount: 40,
      },
    });
    const finance = await getFinanceSummary();
    expect(finance?.revenueThisMonth).toBe(60);
  });

  it("returns null when neither money endpoint answers", async () => {
    routeGet({});
    await expect(getFinanceSummary()).resolves.toBeNull();
  });
});

// ─── buildAcademicSummary ─────────────────────────────────────────────────────

describe("buildAcademicSummary", () => {
  const term = {
    name: "First Term",
    startDate: "2025-01-01T00:00:00.000Z",
    endDate: "2025-01-11T00:00:00.000Z",
    isCurrent: true,
  };

  it("returns null when no term is marked current", async () => {
    await expect(buildAcademicSummary([{ ...term, isCurrent: false }], [])).resolves.toBeNull();
  });

  it("reports elapsed percentage and days remaining against the current term", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-06T00:00:00.000Z"));
    const summary = await buildAcademicSummary([term], [{ year: "2024/2025", isCurrent: true }]);
    jest.useRealTimers();

    expect(summary?.currentTerm.elapsedPercent).toBe(50);
    expect(summary?.currentTerm.daysRemaining).toBe(5);
    expect(summary?.currentTerm.academicYear).toBe("2024/2025");
  });

  it("counts assessments by status and ignores unknown statuses", async () => {
    mockAssessments.mockResolvedValue({
      assessments: [
        { status: "active" },
        { status: "active" },
        { status: "completed" },
        { status: "archived" },
      ],
    });
    const summary = await buildAcademicSummary([term], []);
    expect(summary?.assessments).toEqual({
      active: 2,
      pending: 0,
      completed: 1,
      cancelled: 0,
    });
  });

  it("still returns term progress when the assessments read fails", async () => {
    mockAssessments.mockRejectedValue(new Error("assessments down"));
    const summary = await buildAcademicSummary([term], []);
    expect(summary?.currentTerm.name).toBe("First Term");
    expect(summary?.assessments.active).toBe(0);
  });
});

// ─── getPendingActions ────────────────────────────────────────────────────────

describe("getPendingActions", () => {
  it("counts transfers, promotion runs and pending leave", async () => {
    routeGet({
      "/transit/dashboard": {
        pendingIncoming: 2,
        pendingOutgoing: 1,
        openPromotionRuns: 3,
      },
      "/leave-requests/school-admin/all": {
        data: [{ status: "Pending" }, { status: "approved" }, { status: "pending" }],
      },
    });

    const pending = await getPendingActions();
    expect(pending.transfers).toEqual({ incoming: 2, outgoing: 1 });
    expect(pending.promotionRuns.open).toBe(3);
    expect(pending.leaveRequests.pending).toBe(2);
  });

  it("reports zeroes rather than failing when both endpoints are down", async () => {
    routeGet({});
    const pending = await getPendingActions();
    expect(pending).toEqual({
      transfers: { incoming: 0, outgoing: 0 },
      leaveRequests: { pending: 0 },
      promotionRuns: { open: 0, pendingValidation: 0 },
      studentsWithoutEnrollment: { count: 0 },
    });
  });
});

// ─── getRecentPayments ────────────────────────────────────────────────────────

describe("getRecentPayments", () => {
  it("maps provider statuses onto the three the panel renders", async () => {
    routeGet({
      "/payments/admin/transactions": {
        success: true,
        data: [
          {
            internalReference: "TLM-1",
            schoolAmount: 900,
            amount: 1000,
            paymentChannel: "card",
            paidAt: "2025-01-02T00:00:00.000Z",
            createdAt: "2025-01-01T00:00:00.000Z",
            status: "successful",
          },
          { amount: 10, createdAt: "2025-01-01T00:00:00.000Z", status: "pending" },
          { amount: 10, createdAt: "2025-01-01T00:00:00.000Z", status: "abandoned" },
        ],
      },
    });

    const rows = await getRecentPayments();
    expect(rows.map((r) => r.status)).toEqual(["success", "pending", "failed"]);
    expect(rows[0]).toMatchObject({
      studentName: "TLM-1",
      amount: 900,
      method: "card",
      createdAt: "2025-01-02T00:00:00.000Z",
    });
    expect(rows[1].studentName).toBe("Payment");
  });

  it("returns an empty list when the endpoint is unavailable", async () => {
    routeGet({});
    await expect(getRecentPayments()).resolves.toEqual([]);
  });

  it("asks for the requested number of rows", async () => {
    routeGet({ "/payments/admin/transactions": { success: true, data: [] } });
    await getRecentPayments(3);
    expect(mockGet.mock.calls[0][0]).toContain("limit=3");
  });
});

// ─── getRecentAnnouncements ───────────────────────────────────────────────────

describe("getRecentAnnouncements", () => {
  it("labels known audiences and hides raw user ids behind Custom", async () => {
    routeGet({
      "/notifications/announcements/school/": {
        data: [
          {
            title: "Midterm break",
            audience: ["all_parents", "all_teachers"],
            publishedAt: "2025-01-02T00:00:00.000Z",
            createdAt: "2025-01-01T00:00:00.000Z",
            readRate: 42,
          },
          {
            title: "For a few people",
            targetAudience: ["507f1f77bcf86cd799439011"],
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    const rows = await getRecentAnnouncements("sc1", "user-1");
    expect(rows[0]).toEqual({
      title: "Midterm break",
      audience: "All Parents, All Teachers",
      publishedAt: "2025-01-02T00:00:00.000Z",
      readRate: 42,
    });
    expect(rows[1].audience).toBe("Custom");
    expect(rows[1].readRate).toBe(0);
    expect(rows[1].publishedAt).toBe("2025-01-01T00:00:00.000Z");
  });

  it("falls back to the viewer's own announcements when the school list is empty", async () => {
    routeGet({
      "/notifications/announcements/school/": { data: [] },
      "/notifications/announcements/sender/": {
        data: [{ title: "Mine", createdAt: "2025-01-01T00:00:00.000Z" }],
      },
    });

    const rows = await getRecentAnnouncements("sc1", "user-1");
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Mine");
    expect(rows[0].audience).toBe("All");
  });

  it("does not try the sender fallback without a viewer", async () => {
    routeGet({ "/notifications/announcements/school/": { data: [] } });
    await expect(getRecentAnnouncements("sc1")).resolves.toEqual([]);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
