/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { ApiError } from "@/lib/apiError";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { withBaseCounts } from "@/hooks/dashboard/useDashboardQueries";
import type { DashboardSummary, SchoolDashboardData } from "@/app/services/dashboard.service";

const summary: DashboardSummary = {
  students: { total: 0, active: 0, inactive: 0, trendPercent: 0 },
  teachers: { total: 0, formTeachers: 2, trendPercent: 0 },
  classes: { total: 0, capacityUtilization: 80, trendPercent: 0 },
  fees: { collectionRate: 25, collectedAmount: 100, expectedAmount: 400, trendPercent: 0 },
  wallet: { balance: 900 },
  notifications: { unreadTotal: 3, messages: 0, alerts: 0, trendPercent: 0 },
};

const base = {
  totalStudents: 30,
  totalTeachers: 5,
  totalClasses: 4,
} as SchoolDashboardData;

// ─── withBaseCounts ───────────────────────────────────────────────────────────

describe("withBaseCounts", () => {
  it("fills the head counts from the base read without touching the money figures", () => {
    const merged = withBaseCounts(summary, base);
    expect(merged?.students.total).toBe(30);
    expect(merged?.students.active).toBe(30);
    expect(merged?.teachers.total).toBe(5);
    expect(merged?.classes.total).toBe(4);
    expect(merged?.teachers.formTeachers).toBe(2);
    expect(merged?.fees.collectionRate).toBe(25);
    expect(merged?.wallet.balance).toBe(900);
  });

  it("returns the summary untouched while the base read is still in flight", () => {
    expect(withBaseCounts(summary, null)).toBe(summary);
  });

  it("stays null when the summary itself is unavailable", () => {
    expect(withBaseCounts(null, base)).toBeNull();
  });
});

// ─── DashboardErrorState ──────────────────────────────────────────────────────

describe("DashboardErrorState", () => {
  const noop = () => undefined;

  it("names the problem when the browser is offline and offers a retry", () => {
    render(
      <DashboardErrorState
        error={new ApiError("NETWORK_OFFLINE", "offline", 0)}
        onRetry={noop}
        isRetrying={false}
      />
    );
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("does not offer a retry for an expired session", () => {
    render(
      <DashboardErrorState
        error={new ApiError("TOKEN_EXPIRED", "expired", 401)}
        onRetry={noop}
        isRetrying={false}
      />
    );
    expect(screen.getByText("Your session expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("explains a forbidden school rather than inviting a pointless retry", () => {
    render(
      <DashboardErrorState
        error={new ApiError("FORBIDDEN", "nope", 403)}
        onRetry={noop}
        isRetrying={false}
      />
    );
    expect(screen.getByText("No access to this school")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("shows the server's own message for an unmapped code", () => {
    render(
      <DashboardErrorState
        error={new ApiError("CONFLICT", "Something specific went wrong", 409)}
        onRetry={noop}
        isRetrying={false}
      />
    );
    expect(screen.getByText("Something specific went wrong")).toBeInTheDocument();
  });

  it("shows the retry as busy while a refresh is in flight", () => {
    render(
      <DashboardErrorState
        error={new ApiError("INTERNAL_ERROR", "boom", 500)}
        onRetry={noop}
        isRetrying
      />
    );
    expect(screen.getByRole("button", { name: /retrying/i })).toBeDisabled();
  });
});
