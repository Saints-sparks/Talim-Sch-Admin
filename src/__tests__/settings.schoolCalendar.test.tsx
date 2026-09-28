/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import type { CalendarEvent } from "@/app/services/calendar-events.service";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockCreate = jest.fn();
const mockRemove = jest.fn();
jest.mock("@/hooks/calendar/useCalendarEvents", () => ({
  useCalendarEvents: jest.fn(),
  useCalendarEventActions: () => ({
    create: mockCreate,
    update: jest.fn(),
    remove: mockRemove,
    saving: false,
    deleting: false,
  }),
}));
jest.mock("@/hooks/queries/reference", () => ({
  useTerms: () => ({
    isLoading: false,
    data: [
      {
        _id: "t1",
        name: "First Term",
        startDate: "2026-09-07T00:00:00.000Z",
        endDate: "2026-12-11T00:00:00.000Z",
        academicYearId: "y1",
        isCurrent: true,
      },
    ],
  }),
  useAcademicYears: () => ({ data: [{ _id: "y1", year: "2026/2027" }] }),
}));
import { useCalendarEvents } from "@/hooks/calendar/useCalendarEvents";
const mockUseCalendarEvents = useCalendarEvents as jest.Mock;

import { SchoolCalendarSection } from "@/components/settings/SchoolCalendarSection";

const events: CalendarEvent[] = [
  { id: "e1", termId: "t1", title: "Independence Day", type: "holiday", startDate: "2026-10-01", endDate: "2026-10-01", endsAt: null },
  { id: "e2", termId: "t1", title: "Staff training", type: "early_close", startDate: "2026-11-06", endDate: "2026-11-06", endsAt: "12:00" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue(events[0]);
  mockRemove.mockResolvedValue(undefined);
  mockUseCalendarEvents.mockReturnValue({ data: events, isLoading: false, isError: false, refetch: jest.fn() });
});

describe("SchoolCalendarSection", () => {
  it("reads the current term's window and groups events by month", () => {
    render(<SchoolCalendarSection canManage />);
    expect(mockUseCalendarEvents).toHaveBeenCalledWith("2026-09-07", "2026-12-11", expect.anything());
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(screen.getByText(/closes at 12:00/)).toBeInTheDocument();
  });

  it("asks for ends-at only for an early close, and sends it", async () => {
    render(<SchoolCalendarSection canManage />);
    fireEvent.click(screen.getByRole("button", { name: /add event/i }));
    expect(screen.queryByLabelText(/school ends at/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: "Sports day" } });
    fireEvent.change(screen.getByLabelText(/^Type/), { target: { value: "early_close" } });
    fireEvent.change(screen.getByLabelText(/^First day/), { target: { value: "2026-10-16" } });
    fireEvent.click(screen.getByRole("button", { name: /save event/i }));
    expect(mockCreate).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/school ends at/i)).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(screen.getByLabelText(/school ends at/i), { target: { value: "13:00" } });
    fireEvent.click(screen.getByRole("button", { name: /save event/i }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        title: "Sports day",
        type: "early_close",
        startDate: "2026-10-16",
        endDate: "2026-10-16",
        endsAt: "13:00",
        termId: "t1",
      })
    );
  });

  it("confirms before deleting", async () => {
    render(<SchoolCalendarSection canManage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Independence Day" }));
    expect(mockRemove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("e1"));
  });

  it("hides every write without manage rights", () => {
    render(<SchoolCalendarSection canManage={false} />);
    expect(screen.queryByRole("button", { name: /add event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});
