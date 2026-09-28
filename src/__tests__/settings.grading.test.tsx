/** @jest-environment jsdom */
/**
 * Settings → Grading: read-only without manage:settings, the scale checks
 * block a save and point at the field, reset to default, reorder, and the
 * PATCH body carries only the grading fields.
 */
import React from "react";
import { fireEvent, render, screen, within } from "@/test-utils/render";
import type { AcademicSettings } from "@/app/services/school-settings.service";
import { ApiError } from "@/lib/apiError";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockSave = jest.fn();
const mockUseUpdate = jest.fn();
jest.mock("@/hooks/settings/useAcademicSettings", () => ({
  useAcademicSettings: jest.fn(),
  useUpdateAcademicSettings: (messages: unknown) => mockUseUpdate(messages),
}));
import { useAcademicSettings } from "@/hooks/settings/useAcademicSettings";
const mockUseAcademicSettings = useAcademicSettings as jest.Mock;

import { GradingSection } from "@/components/settings/GradingSection";
import { AssessmentSettingsSection } from "@/components/settings/AssessmentSettingsSection";
import { SECTIONS, sectionFromQuery } from "@/components/settings/sections";

const settings: AcademicSettings = {
  schoolId: "s1",
  timezone: "Africa/Lagos",
  schoolDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  registerCloseTime: "11:00",
  registerEditUntil: "16:00",
  registerTrackingSince: "2026-09-01",
  periods: [],
  gradeScale: [
    { letter: "A", min: 70, remark: "Excellent" },
    { letter: "B", min: 55, remark: "Credit" },
    { letter: "F", min: 0, remark: "Fail" },
  ],
  passMark: 55,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockResolvedValue(settings);
  mockUseUpdate.mockReturnValue({ save: mockSave, saving: false });
  mockUseAcademicSettings.mockReturnValue({
    data: settings,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
});

const letters = () => screen.getAllByLabelText("Letter").map((el) => (el as HTMLInputElement).value);

describe("GradingSection", () => {
  it("is a Settings section reachable by ?section=grading", () => {
    expect(sectionFromQuery("grading", SECTIONS)).toBe("grading");
    expect(SECTIONS.find((s) => s.id === "grading")?.label).toBe("Grading");
  });

  it("is read-only without manage:settings", () => {
    render(<GradingSection canManage={false} />);
    expect(screen.getAllByLabelText("Letter")[0]).toBeDisabled();
    expect(screen.getByLabelText(/Pass mark/)).toBeDisabled();
    for (const name of [/save changes/i, /add grade/i, /reset to default/i, /move grade/i, /delete grade/i]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(screen.getByText(/needs the Manage Settings permission/)).toBeInTheDocument();
  });

  it("shows the saved scale, pass mark and a preview", () => {
    render(<GradingSection canManage />);
    expect(letters()).toEqual(["A", "B", "F"]);
    expect(screen.getByLabelText(/Pass mark/)).toHaveValue(55);
    expect(screen.getByText("Scores of 55% and above pass: A, B.")).toBeInTheDocument();
    expect(screen.getByText("55% to under 70%")).toBeInTheDocument();
  });

  it("blocks a save that breaks the scale, with the message on the field", () => {
    render(<GradingSection canManage />);
    const bMin = screen.getAllByLabelText("Minimum (%)")[1];
    fireEvent.change(bMin, { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockSave).not.toHaveBeenCalled();
    expect(bMin).toHaveAttribute("aria-invalid", "true");
    const describedBy = bMin.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy.split(" ")[0])).toHaveTextContent("Must be lower than A's 70%.");
    expect(screen.getByRole("alert")).toHaveTextContent("Fix the highlighted fields before saving.");
  });

  it("flags a duplicate letter and a last grade above 0", () => {
    render(<GradingSection canManage />);
    const [, b, f] = screen.getAllByLabelText("Letter");
    fireEvent.change(b, { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText("Minimum (%)")[2], { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockSave).not.toHaveBeenCalled();
    expect(b).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("A is already used. Letters must be unique.")).toBeInTheDocument();
    expect(screen.getByText("The last grade must start at 0% so every score gets a grade.")).toBeInTheDocument();
    expect(f).not.toHaveAttribute("aria-invalid");
  });

  it("adds a grade above the floor and focuses its letter", () => {
    render(<GradingSection canManage />);
    fireEvent.click(screen.getByRole("button", { name: /add grade/i }));
    expect(letters()).toEqual(["A", "B", "", "F"]);
    expect(screen.getAllByLabelText("Letter")[2]).toHaveFocus();
  });

  it("moves and deletes grades from the keyboard-reachable buttons", () => {
    render(<GradingSection canManage />);
    fireEvent.click(screen.getByRole("button", { name: "Move grade B up" }));
    expect(letters()).toEqual(["B", "A", "F"]);
    expect(screen.getAllByLabelText("Minimum (%)").map((el) => (el as HTMLInputElement).value)).toEqual([
      "70",
      "55",
      "0",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Delete grade A" }));
    expect(letters()).toEqual(["B", "F"]);
  });

  it("resets to the default scale and saves only the grading fields", () => {
    render(<GradingSection canManage />);
    fireEvent.click(screen.getByRole("button", { name: /reset to default/i }));
    expect(letters()).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(screen.getByLabelText(/Pass mark/)).toHaveValue(50);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockSave).toHaveBeenCalledWith({
      gradeScale: [
        { letter: "A", min: 70, remark: "Excellent" },
        { letter: "B", min: 60, remark: "Very good" },
        { letter: "C", min: 50, remark: "Good" },
        { letter: "D", min: 45, remark: "Fair" },
        { letter: "E", min: 40, remark: "Pass" },
        { letter: "F", min: 0, remark: "Fail" },
      ],
      passMark: 50,
    });
    expect(mockUseUpdate).toHaveBeenCalledWith(expect.objectContaining({ success: "Grading saved" }));
  });

  it("shows the API's field errors on the rows they name", async () => {
    mockSave.mockRejectedValueOnce(
      new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
        { field: "gradeScale.1.letter", reason: "Letters must be unique" },
      ]),
    );
    render(<GradingSection canManage />);
    fireEvent.change(screen.getByLabelText(/Pass mark/), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(await screen.findByText("Letters must be unique")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Letter")[1]).toHaveAttribute("aria-invalid", "true");
  });
});

describe("AssessmentSettingsSection", () => {
  it("shows the school's own scale and links to the Grading section", () => {
    const onNavigate = jest.fn();
    render(<AssessmentSettingsSection onNavigate={onNavigate} />);
    const table = screen.getByRole("table", { name: /grade scale/i });
    expect(within(table).getByText("Credit")).toBeInTheDocument();
    expect(within(table).queryByText("A+")).not.toBeInTheDocument();
    expect(screen.getByText("Pass mark: 55%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit in Grading" }));
    expect(onNavigate).toHaveBeenCalledWith("grading");
  });
});
