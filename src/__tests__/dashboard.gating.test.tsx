/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { Permission } from "@/lib/permissions";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { PendingActions } from "@/components/dashboard/PendingActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import type { PendingActionsData } from "@/app/services/dashboard.service";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

/** A `can()` that answers for exactly the listed permissions. */
function granting(...permissions: string[]) {
  return (permission: string) => permissions.includes(permission);
}

const everything = () => true;

const pending: PendingActionsData = {
  transfers: { incoming: 2, outgoing: 1 },
  leaveRequests: { pending: 4 },
  promotionRuns: { open: 1, pendingValidation: 0 },
  studentsWithoutEnrollment: { count: 3 },
};

// ─── KPI cards ────────────────────────────────────────────────────────────────

describe("KpiCards permission gating", () => {
  it("shows every card to an administrator who governs everything", () => {
    render(<KpiCards base={null} summary={null} isLoading={false} can={everything} />);
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("Fee Collection Rate")).toBeInTheDocument();
    expect(screen.getByText("Wallet Balance")).toBeInTheDocument();
  });

  it("hides the cards whose area the viewer does not govern", () => {
    render(
      <KpiCards
        base={null}
        summary={null}
        isLoading={false}
        can={granting(Permission.MANAGE_STUDENTS)}
      />
    );
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.queryByText("Fee Collection Rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Wallet Balance")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Teachers")).not.toBeInTheDocument();
  });

  it("always shows notifications, which every administrator has", () => {
    render(<KpiCards base={null} summary={null} isLoading={false} can={granting()} />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders skeletons instead of numbers while loading", () => {
    render(<KpiCards base={null} summary={null} isLoading can={everything} />);
    expect(screen.queryByText("Total Students")).not.toBeInTheDocument();
  });
});

// ─── Quick links ──────────────────────────────────────────────────────────────

describe("QuickLinks permission gating", () => {
  it("lists only the areas the viewer governs", () => {
    render(<QuickLinks can={granting(Permission.MANAGE_TIMETABLE)} />);
    expect(screen.getByText("Timetable")).toBeInTheDocument();
    expect(screen.queryByText("Fees")).not.toBeInTheDocument();
  });

  it("renders nothing when the viewer governs no area", () => {
    const { container } = render(<QuickLinks can={granting()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ─── Pending actions ──────────────────────────────────────────────────────────

describe("PendingActions permission gating", () => {
  it("shows only the queues the viewer can act on", () => {
    render(
      <PendingActions
        pendingActions={pending}
        isLoading={false}
        can={granting(Permission.MANAGE_LEAVE_REQUESTS)}
      />
    );
    expect(screen.getByText("Leave Requests")).toBeInTheDocument();
    expect(screen.queryByText("Pending Transfer Requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Open Promotion Runs")).not.toBeInTheDocument();
  });

  it("hides a queue that is empty even when the viewer governs it", () => {
    render(
      <PendingActions
        pendingActions={{ ...pending, leaveRequests: { pending: 0 } }}
        isLoading={false}
        can={granting(Permission.MANAGE_LEAVE_REQUESTS)}
      />
    );
    expect(screen.queryByText("Leave Requests")).not.toBeInTheDocument();
  });
});

// ─── Recent activity ──────────────────────────────────────────────────────────

describe("RecentActivity permission gating", () => {
  it("renders each panel only for a viewer who governs it", () => {
    render(
      <RecentActivity
        payments={[]}
        announcements={[]}
        isLoading={false}
        showPayments
        showAnnouncements={false}
      />
    );
    expect(screen.getByText("Recent Payments")).toBeInTheDocument();
    expect(screen.queryByText("Recent Announcements")).not.toBeInTheDocument();
  });

  it("renders nothing when the viewer governs neither area", () => {
    const { container } = render(
      <RecentActivity
        payments={[]}
        announcements={[]}
        isLoading={false}
        showPayments={false}
        showAnnouncements={false}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an empty state rather than a spinner once a panel has loaded", () => {
    render(
      <RecentActivity
        payments={[]}
        announcements={[]}
        isLoading={false}
        showPayments
        showAnnouncements
      />
    );
    expect(screen.getByText("No recent payments to display")).toBeInTheDocument();
    expect(screen.getByText("No recent announcements")).toBeInTheDocument();
  });
});
