/** @jest-environment jsdom */
/**
 * The enrollment history page: the student's name in the heading, and the
 * session's dates as the days the school set, west of Greenwich too.
 */
const originalTz = process.env.TZ;
process.env.TZ = "America/Los_Angeles";

import React from "react";
import { render, screen } from "@/test-utils/render";
import StudentEnrollmentHistoryPage from "@/app/transit/enrollments/[studentId]/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useParams: () => ({ studentId: "stu-1" }),
  usePathname: () => "/transit/enrollments/stu-1",
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseStudent = jest.fn();
jest.mock("@/hooks/users/useStudents", () => ({
  useStudent: (id: string) => mockUseStudent(id),
}));

jest.mock("@/hooks/transit/useEnrollments", () => ({
  useEnrollmentHistory: () => ({
    isLoading: false,
    isError: false,
    data: [
      {
        _id: "e1",
        studentId: "stu-1",
        schoolId: "school-1",
        classId: { _id: "c1", name: "JSS 2A" },
        academicYearId: { _id: "y1", year: "2025/2026" },
        status: "graduated",
        source: "promotion",
        startDate: "2025-09-15T00:00:00.000Z",
        endDate: "2026-07-24T00:00:00.000Z",
        createdAt: "2025-09-15T09:30:00.000Z",
        updatedAt: "2026-07-24T12:00:00.000Z",
      },
    ],
  }),
}));

jest.mock("@/hooks/transit/useTransitReference", () => ({
  useClassOptions: () => ({ classes: [], isLoading: false, isError: false }),
}));

jest.mock("@/hooks/queries/reference", () => ({
  useAcademicYears: () => ({ data: [], isLoading: false }),
  useTerms: () => ({ data: [], isLoading: false }),
}));

afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

beforeEach(() => mockUseStudent.mockReset());

describe("StudentEnrollmentHistoryPage", () => {
  it("heads the page with the student's name from their record", () => {
    mockUseStudent.mockReturnValue({
      isLoading: false,
      data: { _id: "stu-1", userId: { firstName: "Ada", lastName: "Obi" } },
    });
    render(<StudentEnrollmentHistoryPage />);
    expect(mockUseStudent).toHaveBeenCalledWith("stu-1");
    expect(screen.getByRole("heading", { level: 1, name: "Ada Obi" })).toBeInTheDocument();
  });

  it("shows the session as 15 Sep 2025 to 24 Jul 2026", () => {
    mockUseStudent.mockReturnValue({ isLoading: false, data: undefined });
    render(<StudentEnrollmentHistoryPage />);
    expect(screen.getByText(/^15 Sept? 2025$/)).toBeInTheDocument();
    expect(screen.getByText(/24 Jul 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/14 Sept? 2025/)).not.toBeInTheDocument();
  });

  it("falls back to an admission number, then to 'Student'", () => {
    mockUseStudent.mockReturnValue({
      isLoading: false,
      data: { _id: "stu-1", admissionNumber: "ADM/001", userId: { firstName: "", lastName: "" } },
    });
    const { unmount } = render(<StudentEnrollmentHistoryPage />);
    expect(screen.getByRole("heading", { level: 1, name: "ADM/001" })).toBeInTheDocument();
    unmount();

    mockUseStudent.mockReturnValue({ isLoading: false, isError: true, data: undefined });
    render(<StudentEnrollmentHistoryPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Student" })).toBeInTheDocument();
  });
});
