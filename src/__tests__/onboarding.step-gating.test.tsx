/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { Permission } from "@/lib/permissions";
import { STEP_PERMISSIONS, permissionForStep } from "@/components/onboarding/steps/stepPermissions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

jest.mock("@/hooks/usePermissions");
import { usePermissions } from "@/hooks/usePermissions";
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

// The step forms themselves are exercised elsewhere; here only the gate matters.
jest.mock("@/components/onboarding/steps/AcademicYearStep", () => ({
  __esModule: true,
  default: () => <div>academic year form</div>,
}));
jest.mock("@/components/onboarding/steps/CreateClassStep", () => ({
  __esModule: true,
  default: () => <div>create class form</div>,
}));
jest.mock("@/components/onboarding/steps/PeopleSteps", () => ({
  AddTeacherStep: () => <div>add teacher form</div>,
  AddStudentStep: () => <div>add student form</div>,
}));
jest.mock("@/components/onboarding/steps/CurriculumSteps", () => ({
  CreateSubjectStep: () => <div>create subject form</div>,
  CreateCourseStep: () => <div>create course form</div>,
}));
jest.mock("@/components/onboarding/steps/ExtrasSteps", () => ({
  CreateAnnouncementStep: () => <div>announcement form</div>,
  TimetableStep: () => <div>timetable form</div>,
  CreateAssessmentStep: () => <div>assessment form</div>,
}));

import { StepContent } from "@/components/onboarding/steps/StepContent";

/** Makes usePermissions answer for a role holding exactly `granted`. */
function withPermissions(granted: string[], isFullAdmin = false) {
  mockUsePermissions.mockReturnValue({
    isFullAdmin,
    isSubAdmin: !isFullAdmin,
    hasPermission: (p: string) => isFullAdmin || granted.includes(p),
    hasAllPermissions: (...ps: string[]) => isFullAdmin || ps.every((p) => granted.includes(p)),
    hasAnyPermission: (...ps: string[]) => isFullAdmin || ps.some((p) => granted.includes(p)),
    permissions: granted,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  withPermissions([]);
});

// ─── The map itself ───────────────────────────────────────────────────────────

describe("step permissions", () => {
  it("maps each writing step to the permission its backend route requires", () => {
    expect(permissionForStep("academic-year")).toBe(Permission.MANAGE_SETTINGS);
    expect(permissionForStep("create-class")).toBe(Permission.MANAGE_CLASSES);
    expect(permissionForStep("add-teacher")).toBe(Permission.MANAGE_TEACHERS);
    expect(permissionForStep("add-student")).toBe(Permission.MANAGE_STUDENTS);
    expect(permissionForStep("create-subject")).toBe(Permission.MANAGE_CURRICULUM);
    expect(permissionForStep("create-course")).toBe(Permission.MANAGE_CURRICULUM);
    expect(permissionForStep("create-announcement")).toBe(Permission.MANAGE_ANNOUNCEMENTS);
    expect(permissionForStep("timetable-entry")).toBe(Permission.MANAGE_TIMETABLE);
    expect(permissionForStep("create-assessment")).toBe(Permission.MANAGE_ASSESSMENTS);
  });

  it("only leaves the administrator's own profile ungated", () => {
    const ungated = Object.entries(STEP_PERMISSIONS)
      .filter(([, permission]) => permission === null)
      .map(([id]) => id);
    expect(ungated).toEqual(["personal-profile"]);
  });
});

// ─── The gate ─────────────────────────────────────────────────────────────────

describe("StepContent", () => {
  const noop = jest.fn();

  it("blocks a step the role cannot perform instead of showing its form", () => {
    withPermissions([Permission.MANAGE_STUDENTS]);
    render(
      <StepContent stepId="create-class" isComplete={false} onComplete={noop} onSkip={noop} />
    );
    expect(screen.queryByText("create class form")).not.toBeInTheDocument();
    expect(screen.getByText(/can.t complete/i)).toBeInTheDocument();
  });

  it("shows the form when the role holds the permission", () => {
    withPermissions([Permission.MANAGE_CLASSES]);
    render(
      <StepContent stepId="create-class" isComplete={false} onComplete={noop} onSkip={noop} />
    );
    expect(screen.getByText("create class form")).toBeInTheDocument();
  });

  it("lets a full admin through every step", () => {
    withPermissions([], true);
    render(
      <StepContent stepId="create-assessment" isComplete={false} onComplete={noop} onSkip={noop} />
    );
    expect(screen.getByText("assessment form")).toBeInTheDocument();
  });

  it("shows the done card before any permission check", () => {
    withPermissions([]);
    render(<StepContent stepId="create-class" isComplete onComplete={noop} onSkip={noop} />);
    expect(screen.getByText(/Done!/)).toBeInTheDocument();
    expect(screen.queryByText(/can.t complete/i)).not.toBeInTheDocument();
  });
});
