/** @jest-environment jsdom */
/**
 * Leave requests in the tl design system: the queue's loading, empty and
 * filled states, the segmented status filter with counts, and the card's
 * status pill and decision buttons.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within, mockAdmin } from "@/test-utils/render";
import LeaveRequestsPage from "@/app/leave-requests/page";
import type { LeaveRequest } from "@/app/services/leave.service";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockQueue = jest.fn();
jest.mock("@/hooks/leave/useLeaveRequests", () => ({
  useLeaveRequests: () => mockQueue(),
  useUpdateLeaveStatus: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

/** A pending request from Ben. */
const request = {
  _id: "l1",
  status: "Pending",
  leaveType: "sick",
  startDate: "2026-10-05T00:00:00.000Z",
  endDate: "2026-10-06T00:00:00.000Z",
  reason: "Fever",
  attachments: [],
  studentProfile: { firstName: "Ben", lastName: "Student" },
} as unknown as LeaveRequest;

describe("leave requests, restyled", () => {
  it("shows a labelled busy skeleton while loading", () => {
    mockQueue.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<LeaveRequestsPage />, { user: mockAdmin });
    expect(screen.getByRole("heading", { level: 1, name: "Request Leave" })).toBeTruthy();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading leave requests")).toBeTruthy();
  });

  it("says when there are no requests yet", () => {
    mockQueue.mockReturnValue({ isLoading: false, isError: false, data: [] });
    render(<LeaveRequestsPage />, { user: mockAdmin });
    expect(screen.getByText("No Leave Requests Yet")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Show requests that are" })).toHaveTextContent(
      "All (0)"
    );
  });

  it("filters by status with the segmented control and shows the card's pill and actions", async () => {
    const user = userEvent.setup();
    mockQueue.mockReturnValue({ isLoading: false, isError: false, data: [request] });
    render(<LeaveRequestsPage />, { user: mockAdmin });
    const card = screen.getByRole("button", { name: /Open .*leave request/ }).parentElement!;
    expect(within(card).getByText("pending")).toBeTruthy();
    expect(within(card).getByRole("button", { name: "Approve" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Approved (0)" }));
    expect(screen.getByRole("button", { name: "Approved (0)" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("No Approved Requests")).toBeTruthy();
  });
});
