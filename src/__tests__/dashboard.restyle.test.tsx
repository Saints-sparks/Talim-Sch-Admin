/** @jest-environment jsdom */
import React from "react";
import { render, screen, within, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import { ApiError } from "@/lib/apiError";
import { Permission } from "@/lib/permissions";
import Dashboard from "@/app/dashboard/page";
import { PendingActions } from "@/components/dashboard/PendingActions";
import { SubAdminBanner } from "@/components/dashboard/SubAdminBanner";
import type { DashboardOverview } from "@/hooks/useDashboard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/dashboard",
}));

jest.mock("@/context/OnboardingContext", () => {
  const actual = jest.requireActual("@/context/OnboardingContext");
  return {
    ...actual,
    useOnboarding: () => ({
      progressPercent: 40,
      completedCount: 4,
      totalCount: 10,
      isStepComplete: () => false,
      isFullyComplete: false,
      setupDismissed: false,
      dismissSetup: jest.fn(),
      phase1Completed: true,
    }),
  };
});

const overview = jest.fn<DashboardOverview, []>();
jest.mock("@/hooks/useDashboard", () => ({
  useDashboardOverview: () => overview(),
}));

/** Every panel visible, nothing loading, nothing returned. */
function emptyOverview(patch: Partial<DashboardOverview> = {}): DashboardOverview {
  return {
    base: null,
    summary: null,
    finance: null,
    academic: null,
    pendingActions: null,
    recentPayments: [],
    recentAnnouncements: [],
    loading: {
      base: false,
      summary: false,
      finance: false,
      academic: false,
      pendingActions: false,
      recentActivity: false,
    },
    visibility: {
      finance: true,
      academics: true,
      assessments: true,
      classes: true,
      pendingActions: true,
      recentPayments: true,
      recentAnnouncements: true,
    },
    error: null,
    isRefreshing: false,
    refresh: jest.fn(),
    ...patch,
  };
}

const admin = { ...mockAdmin, firstName: "Sade", schoolName: "Greenfield" };

describe("dashboard page, restyled", () => {
  beforeEach(() => overview.mockReset());

  it("greets the administrator by first name in the page heading", () => {
    overview.mockReturnValue(emptyOverview());
    render(<Dashboard />, { user: admin });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /^Good (morning|afternoon|evening), Sade!$/
    );
    expect(screen.getByText("Greenfield")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh dashboard" })).toBeInTheDocument();
  });

  it("shows pulsing skeletons, announced as busy, while every panel loads", () => {
    overview.mockReturnValue(
      emptyOverview({
        loading: {
          base: true,
          summary: true,
          finance: true,
          academic: true,
          pendingActions: true,
          recentActivity: true,
        },
      })
    );
    const { container } = render(<Dashboard />, { user: admin });
    expect(screen.getByRole("status", { name: "Loading key figures" })).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading the finance snapshot" })
    ).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading academic activity" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading pending actions" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading recent activity" })).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total Students")).not.toBeInTheDocument();
  });

  it("settles into tiles and empty notes, with nothing pulsing, once loaded with no data", () => {
    overview.mockReturnValue(emptyOverview());
    const { container } = render(<Dashboard />, { user: admin });
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
    const figures = screen.getByRole("group", { name: "Key figures" });
    expect(within(figures).getByRole("link", { name: /Total Students/ })).toHaveAttribute(
      "href",
      "/users/students"
    );
    expect(screen.getByText("No revenue data available")).toBeInTheDocument();
    expect(screen.getByText("No fee data available")).toBeInTheDocument();
    expect(screen.getByText("No term data available")).toBeInTheDocument();
    expect(screen.getByText("No recent payments to display")).toBeInTheDocument();
    expect(screen.getByText("No recent announcements")).toBeInTheDocument();
    // Nothing is waiting, so the pending-actions card is not drawn at all.
    expect(screen.queryByText("Pending Actions")).not.toBeInTheDocument();
    expect(screen.getByText("Setup progress")).toBeInTheDocument();
  });

  it("shows the whole-page error card with a retry when the base read fails", () => {
    overview.mockReturnValue(emptyOverview({ error: new ApiError("CONFLICT", "Boom", 409) }));
    render(<Dashboard />, { user: admin });
    expect(screen.getByRole("heading", { name: "Failed to Load Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("opens for a sub-admin with the access banner and no Access Denied", () => {
    overview.mockReturnValue(emptyOverview());
    render(<Dashboard />, { user: { ...mockSubAdmin, firstName: "Sam" } as typeof mockAdmin });
    expect(screen.queryByRole("heading", { name: "Access Denied" })).not.toBeInTheDocument();
    expect(screen.getByText("Sub-Administrator · Your Access")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Areas you can manage" })).toHaveTextContent(
      "Students"
    );
    expect(screen.queryByText("Setup progress")).not.toBeInTheDocument();
  });
});

describe("dashboard parts, restyled", () => {
  it("lists each open queue as a row with a Review link", () => {
    render(
      <PendingActions
        pendingActions={{
          transfers: { incoming: 0, outgoing: 0 },
          leaveRequests: { pending: 4 },
          promotionRuns: { open: 0, pendingValidation: 0 },
          studentsWithoutEnrollment: { count: 0 },
        }}
        isLoading={false}
        can={(p) => p === Permission.MANAGE_LEAVE_REQUESTS}
      />
    );
    expect(screen.getByRole("heading", { name: "Pending Actions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review Leave Requests" })).toHaveAttribute(
      "href",
      "/leave-requests"
    );
    expect(screen.getByText("4 pending approval")).toBeInTheDocument();
  });

  it("warns a sub-admin who holds no permissions yet", () => {
    render(<SubAdminBanner permissions={[]} />);
    expect(screen.getByText(/no permissions assigned yet/)).toBeInTheDocument();
  });
});
