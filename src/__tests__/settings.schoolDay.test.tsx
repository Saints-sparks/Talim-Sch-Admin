/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@/test-utils/render";
import type { AcademicSettings } from "@/app/services/school-settings.service";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockSave = jest.fn();
jest.mock("@/hooks/settings/useAcademicSettings", () => ({
  useAcademicSettings: jest.fn(),
  useUpdateAcademicSettings: () => ({ save: mockSave, saving: false }),
}));
import { useAcademicSettings } from "@/hooks/settings/useAcademicSettings";
const mockUseAcademicSettings = useAcademicSettings as jest.Mock;

import { SchoolDaySection } from "@/components/settings/SchoolDaySection";

const settings: AcademicSettings = {
  schoolId: "s1",
  timezone: "Africa/Lagos",
  schoolDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  registerCloseTime: "11:00",
  registerEditUntil: "16:00",
  registerTrackingSince: "2026-09-01",
  periods: [
    { key: "p1", label: "Period 1", startTime: "08:00", endTime: "08:40", isBreak: false },
    { key: "brk", label: "Break", startTime: "08:40", endTime: "09:00", isBreak: true },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockResolvedValue(settings);
  mockUseAcademicSettings.mockReturnValue({
    data: settings,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
});

describe("SchoolDaySection", () => {
  it("is read-only without manage:settings", () => {
    render(<SchoolDaySection canManage={false} />);
    expect(screen.getByLabelText(/^Timezone/)).toBeDisabled();
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add period/i })).not.toBeInTheDocument();
    expect(screen.getByText(/needs the Manage Settings permission/)).toBeInTheDocument();
  });

  it("shows an overlap on the field and does not save", () => {
    render(<SchoolDaySection canManage />);
    const breakStart = screen.getAllByLabelText("Starts")[1];
    fireEvent.change(breakStart, { target: { value: "08:30" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockSave).not.toHaveBeenCalled();
    expect(breakStart).toHaveAttribute("aria-invalid", "true");
    const describedBy = breakStart.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy.split(" ")[0])).toHaveTextContent(/Overlaps Period 1/);
  });

  it("saves a new period with the existing keys kept", () => {
    render(<SchoolDaySection canManage />);
    fireEvent.click(screen.getByRole("button", { name: /add period/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockSave).toHaveBeenCalledTimes(1);
    const sent = mockSave.mock.calls[0][0];
    expect(sent.periods.map((p: { key: string }) => p.key)).toEqual(["p1", "brk", "p2"]);
    expect(sent.periods[2]).toMatchObject({ startTime: "09:00", endTime: "09:40", label: "Period 2" });
  });
});
