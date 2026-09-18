/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const markStepComplete = jest.fn();
jest.mock("@/context/OnboardingContext", () => ({
  useOnboarding: () => ({ markStepComplete }),
}));

let mockUser: { userId: string } | null = { userId: "user-1" };
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("@/app/services/academic.service", () => ({
  getAcademicYears: jest.fn(),
  getTimetableEntries: jest.fn(),
}));
jest.mock("@/app/services/school.service", () => ({ getClasses: jest.fn() }));
jest.mock("@/app/services/subjects.service", () => ({
  getSubjectsBySchool: jest.fn(),
  getCoursesBySchool: jest.fn(),
}));
jest.mock("@/app/services/teacher.service", () => ({
  teacherService: { getTeachers: jest.fn() },
}));
jest.mock("@/app/services/student.service", () => ({
  studentService: { getStudents: jest.fn() },
}));
jest.mock("@/app/services/assessment.service", () => ({
  assessmentService: { getAssessmentsBySchool: jest.fn() },
}));
jest.mock("@/app/services/announcement.service", () => ({
  getAnnouncementsBySender: jest.fn(),
}));

import { getAcademicYears, getTimetableEntries } from "@/app/services/academic.service";
import { getClasses } from "@/app/services/school.service";
import { getSubjectsBySchool, getCoursesBySchool } from "@/app/services/subjects.service";
import { teacherService } from "@/app/services/teacher.service";
import { studentService } from "@/app/services/student.service";
import { assessmentService } from "@/app/services/assessment.service";
import { getAnnouncementsBySender } from "@/app/services/announcement.service";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";

/** An empty answer from every probe, so a test only sets the one it cares about. */
function everythingEmpty() {
  (getAcademicYears as jest.Mock).mockResolvedValue([]);
  (getClasses as jest.Mock).mockResolvedValue([]);
  (getSubjectsBySchool as jest.Mock).mockResolvedValue([]);
  (getCoursesBySchool as jest.Mock).mockResolvedValue([]);
  (teacherService.getTeachers as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });
  (studentService.getStudents as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });
  (assessmentService.getAssessmentsBySchool as jest.Mock).mockResolvedValue({
    assessments: [],
    pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 1 },
  });
  (getAnnouncementsBySender as jest.Mock).mockResolvedValue({ data: [], meta: {} });
  (getTimetableEntries as jest.Mock).mockResolvedValue({});
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { userId: "user-1" };
  everythingEmpty();
});

async function sync() {
  const { result } = renderHook(() => useOnboardingSync());
  await act(async () => {
    await result.current.syncProgress();
  });
}

describe("useOnboardingSync", () => {
  it("ticks off nothing for a brand-new school", async () => {
    await sync();
    expect(markStepComplete).not.toHaveBeenCalled();
  });

  it("ticks off a step whose data already exists", async () => {
    (getClasses as jest.Mock).mockResolvedValue([{ _id: "c1" }]);
    await sync();
    expect(markStepComplete).toHaveBeenCalledWith("create-class");
    expect(markStepComplete).toHaveBeenCalledTimes(1);
  });

  it("trusts meta.total from a one-row page", async () => {
    (teacherService.getTeachers as jest.Mock).mockResolvedValue({
      data: [{ _id: "t1" }],
      meta: { total: 12 },
    });
    await sync();
    expect(markStepComplete).toHaveBeenCalledWith("add-teacher");
  });

  it("reads the day-keyed timetable response", async () => {
    (getTimetableEntries as jest.Mock).mockResolvedValue({ Monday: [], Tuesday: [{ _id: "e1" }] });
    await sync();
    expect(markStepComplete).toHaveBeenCalledWith("timetable-entry");
  });

  it("leaves a step alone when its probe fails", async () => {
    (getClasses as jest.Mock).mockRejectedValue(new Error("offline"));
    await sync();
    expect(markStepComplete).not.toHaveBeenCalledWith("create-class");
  });

  it("skips the announcement probe when the session carries no user id", async () => {
    mockUser = null;
    await sync();
    expect(getAnnouncementsBySender).not.toHaveBeenCalled();
    expect(markStepComplete).not.toHaveBeenCalled();
  });
});
