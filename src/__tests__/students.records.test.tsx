/** @jest-environment jsdom */
/**
 * The student profile's Records tab (the transcript, Issue transcript, the
 * printable view with code and QR), Mark as left and Reinstate with their
 * 409s, and the records-only page for a student who moved to another Talim
 * school.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import type { UseQueryResult } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@/test-utils/render";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import type { StudentTranscript } from "@/app/services/student.service";
import { getStudentTranscript, issueStudentTranscript } from "@/app/services/student.service";
import { leaveStudent, reinstateStudent } from "@/app/services/transit.service";
import { StudentRecordsTab } from "@/components/users/students/records/StudentRecordsTab";
import {
  StudentStandingActions,
  canReinstate,
} from "@/components/users/students/records/StudentStandingActions";
import {
  attendanceText,
  ordinal,
  positionText,
} from "@/components/users/students/records/transcriptFormat";
import { qrPath } from "@/components/ui/QrCode";
import StudentProfilePage from "@/app/users/students/[id]/view/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "s1" }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/users/students/s1/view",
}));
jest.mock("@/components/CustomToast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/hooks/queries/reference", () => ({
  useClasses: () => ({ data: [{ _id: "c2", name: "JSS 2A" }], isLoading: false, isError: false }),
  useAcademicYears: () => ({ data: [{ _id: "y1", year: "2025/2026" }], isLoading: false }),
}));
jest.mock("@/app/services/student.service", () => ({
  ...jest.requireActual("@/app/services/student.service"),
  getStudentTranscript: jest.fn(),
  issueStudentTranscript: jest.fn(),
  studentService: {
    getStudentById: jest.fn(),
    getStudents: jest.fn(),
    getStudentsByClass: jest.fn(),
  },
}));
jest.mock("@/app/services/transit.service", () => ({
  ...jest.requireActual("@/app/services/transit.service"),
  leaveStudent: jest.fn(),
  reinstateStudent: jest.fn(),
}));

const mocked = {
  transcript: getStudentTranscript as jest.MockedFunction<typeof getStudentTranscript>,
  issue: issueStudentTranscript as jest.MockedFunction<typeof issueStudentTranscript>,
  leave: leaveStudent as jest.MockedFunction<typeof leaveStudent>,
  reinstate: reinstateStudent as jest.MockedFunction<typeof reinstateStudent>,
};

const TRANSCRIPT: StudentTranscript = {
  student: {
    id: "s1",
    name: "Tolu Adebayo",
    gender: "female",
    dateOfBirth: "2008-04-12",
    status: "graduated",
    leftAt: "2026-07-24",
    photoUrl: null,
  },
  schools: [
    {
      id: "sch1",
      name: "Crestview College",
      logo: null,
      admissionNumber: "CVC/2020/0143",
      from: "2020-09-14",
      to: "2026-07-24",
      outcome: "graduated",
    },
  ],
  sessions: [
    {
      session: "2021/2022",
      schoolId: "sch1",
      className: "JSS 2A",
      outcome: "promoted",
      average: 63.8,
      terms: [
        {
          termId: "t1",
          term: "First Term",
          subjects: [
            {
              code: "MTH",
              name: "Mathematics",
              score: 71.5,
              max: 100,
              percent: 71.5,
              grade: "A",
              remark: "Excellent",
            },
          ],
          average: 64.2,
          grade: "B",
          position: 7,
          of: 49,
          attendance: { daysOpen: 62, present: 59, absent: 3 },
        },
      ],
    },
  ],
  cumulativeAverage: 61.9,
  gradeScale: [{ letter: "A", min: 70, remark: "Excellent" }],
  generatedAt: "2026-10-13T10:00:00Z",
};

/**
 * A loaded transcript query.
 *
 * @param data - The transcript.
 * @returns The query result the tab reads.
 */
function loaded(data: StudentTranscript): UseQueryResult<StudentTranscript> {
  return {
    isPending: false,
    isError: false,
    isSuccess: true,
    data,
    error: null,
    refetch: jest.fn(),
  } as unknown as UseQueryResult<StudentTranscript>;
}

beforeEach(() => jest.clearAllMocks());

describe("transcript wording", () => {
  it("words positions, ordinals and attendance", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "101st",
    ]);
    expect(positionText({ position: 7, of: 49 })).toBe("7th of 49");
    expect(positionText({ position: null, of: null })).toBe("—");
    expect(attendanceText({ attendance: { daysOpen: 62, present: 59, absent: 3 } })).toBe(
      "59 of 62 days"
    );
    expect(attendanceText({ attendance: null })).toBe("—");
  });

  it("draws a QR for the verification link", () => {
    const { d, size } = qrPath("https://students.mytalim.com/verify/ABCDEFGHJK");
    expect(size).toBeGreaterThanOrEqual(21);
    expect(d).toMatch(/^M\d+ \d+h1v1h-1z/);
  });
});

describe("Records tab", () => {
  it("renders the transcript like a report", () => {
    render(<StudentRecordsTab studentId="s1" transcriptQuery={loaded(TRANSCRIPT)} />);
    const report = screen.getByRole("article", { name: "Transcript of Tolu Adebayo" });
    expect(within(report).getByText("Crestview College")).toBeInTheDocument();
    expect(within(report).getByText(/CVC\/2020\/0143/)).toBeInTheDocument();
    const session = within(report).getByRole("region", { name: "2021/2022 JSS 2A" });
    expect(within(session).getByText("Promoted")).toBeInTheDocument();
    expect(within(session).getByText("Mathematics")).toBeInTheDocument();
    expect(within(session).getByText("71.5 / 100")).toBeInTheDocument();
    expect(within(session).getByText("7th of 49")).toBeInTheDocument();
    expect(within(session).getByText("59 of 62 days")).toBeInTheDocument();
    expect(within(report).getByText("61.9%")).toBeInTheDocument();
    // The printable box holds the transcript alone.
    expect(report.closest("[data-print-root]")).toHaveAttribute("data-print-page", "portrait");
  });

  it("issues the transcript and shows the code, the link and a QR", async () => {
    const user = userEvent.setup();
    mocked.issue.mockResolvedValue({
      code: "ABCDEFGHJK",
      issuedAt: "2026-10-15T09:00:00Z",
      verifyUrl: "https://students.mytalim.com/verify/ABCDEFGHJK",
    });
    render(<StudentRecordsTab studentId="s1" transcriptQuery={loaded(TRANSCRIPT)} />);
    await user.click(screen.getByRole("button", { name: /Issue transcript/ }));
    expect(mocked.issue).toHaveBeenCalledWith("s1");
    expect(await screen.findByText("Issued with code ABCDEFGHJK")).toBeInTheDocument();
    const report = screen.getByRole("article", { name: "Transcript of Tolu Adebayo" });
    expect(within(report).getByText("ABCDEFGHJK")).toBeInTheDocument();
    expect(
      within(report).getByRole("img", {
        name: "QR code for https://students.mytalim.com/verify/ABCDEFGHJK",
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Issue transcript/ })).toBeNull();
  });

  it("issues before printing so the printout carries the code", async () => {
    const user = userEvent.setup();
    const print = jest.spyOn(window, "print").mockImplementation(() => undefined);
    mocked.issue.mockResolvedValue({
      code: "ZZZZZZZZZZ",
      issuedAt: "2026-10-15",
      verifyUrl: "https://x.test/verify/ZZZZZZZZZZ",
    });
    render(<StudentRecordsTab studentId="s1" transcriptQuery={loaded(TRANSCRIPT)} />);
    await user.click(screen.getByRole("button", { name: /Print \/ Save as PDF/ }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(mocked.issue).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /Print \/ Save as PDF/ }));
    expect(print).toHaveBeenCalledTimes(2);
    expect(mocked.issue).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });

  it("says when there are no published results, and offers no issue", () => {
    render(
      <StudentRecordsTab studentId="s1" transcriptQuery={loaded({ ...TRANSCRIPT, sessions: [] })} />
    );
    expect(screen.getByText("No published results yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Issue transcript/ })).toBeNull();
  });
});

describe("Mark as left and Reinstate", () => {
  it("offers Mark as left to an active student and Reinstate only to withdrawn or left-Talim ones", () => {
    expect(canReinstate("withdrawn")).toBe(true);
    expect(canReinstate("left_talim")).toBe(true);
    expect(canReinstate("graduated")).toBe(false);
    expect(canReinstate("active")).toBe(false);
    const { rerender } = render(
      <StudentStandingActions studentId="s1" studentName="Tolu" status="active" />
    );
    expect(screen.getByRole("button", { name: /Mark as left/ })).toBeInTheDocument();
    rerender(<StudentStandingActions studentId="s1" studentName="Tolu" status="graduated" />);
    expect(screen.queryByRole("button", { name: /Mark as left|Reinstate/ })).toBeNull();
    rerender(<StudentStandingActions studentId="s1" studentName="Tolu" status="withdrawn" />);
    expect(screen.getByRole("button", { name: /Reinstate/ })).toBeInTheDocument();
  });

  it("marks a student as withdrawn with a session and a note", async () => {
    const user = userEvent.setup();
    mocked.leave.mockResolvedValue({
      studentId: "s1",
      status: "withdrawn",
      isActive: false,
      leftAt: "2026-10-15T00:00:00Z",
      leftAcademicYearId: "y1",
      enrollment: null,
      warnings: ["Check the class levels."],
    });
    render(<StudentStandingActions studentId="s1" studentName="Tolu" status="active" />);
    await user.click(screen.getByRole("button", { name: /Mark as left/ }));
    const sheet = screen.getByRole("dialog", { name: "Mark as left" });
    await user.click(within(sheet).getByRole("button", { name: "Withdrawn" }));
    await user.selectOptions(within(sheet).getByLabelText("Session"), "y1");
    await user.type(within(sheet).getByLabelText("Note"), "Family moved abroad");
    await user.click(within(sheet).getByRole("button", { name: "Mark as withdrawn" }));
    await waitFor(() =>
      expect(mocked.leave).toHaveBeenCalledWith("s1", {
        reason: "withdrawn",
        academicYearId: "y1",
        note: "Family moved abroad",
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Tolu is marked as withdrawn.");
    expect(toast.warning).toHaveBeenCalledWith("Check the class levels.");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("explains STUDENT_NOT_ACTIVE", async () => {
    const user = userEvent.setup();
    mocked.leave.mockRejectedValue(
      new ApiError("CONFLICT", "This student has already left the school.", 409, [], undefined, {
        code: "STUDENT_NOT_ACTIVE",
      })
    );
    render(<StudentStandingActions studentId="s1" studentName="Tolu" status="active" />);
    await user.click(screen.getByRole("button", { name: /Mark as left/ }));
    await user.click(screen.getByRole("button", { name: "Mark as graduated" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /already left the school\. Reload the page/
    );
  });

  it("reinstates into a class and explains STUDENT_NOT_WITHDRAWN", async () => {
    const user = userEvent.setup();
    mocked.reinstate.mockRejectedValueOnce(
      new ApiError("CONFLICT", "A graduate cannot be reinstated.", 409, [], undefined, {
        code: "STUDENT_NOT_WITHDRAWN",
      })
    );
    render(<StudentStandingActions studentId="s1" studentName="Tolu" status="left_talim" />);
    await user.click(screen.getByRole("button", { name: /Reinstate/ }));
    const sheet = screen.getByRole("dialog", { name: "Reinstate" });
    const confirm = within(sheet).getByRole("button", { name: "Reinstate" });
    expect(confirm).toBeDisabled();
    await user.selectOptions(within(sheet).getByLabelText(/Class/), "c2");
    await user.click(confirm);
    expect(await within(sheet).findByRole("alert")).toHaveTextContent(
      /Only a student who withdrew or left Talim/
    );
    expect(mocked.reinstate).toHaveBeenCalledWith("s1", { classId: "c2" });

    mocked.reinstate.mockResolvedValueOnce({
      studentId: "s1",
      status: "active",
      isActive: true,
      leftAt: null,
      leftAcademicYearId: null,
      enrollment: null,
      warnings: [],
    });
    await user.click(confirm);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Tolu is back on the roster."));
  });
});

describe("a student who moved to another Talim school", () => {
  it("shows this school's records when the profile itself is no longer this school's", async () => {
    const { studentService } = jest.requireMock("@/app/services/student.service");
    studentService.getStudentById.mockRejectedValue(new ApiError("NOT_FOUND", "Not found", 404));
    mocked.transcript.mockResolvedValue({
      ...TRANSCRIPT,
      student: { ...TRANSCRIPT.student, status: "active", leftAt: null },
    });
    render(<StudentProfilePage />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Tolu Adebayo" })
    ).toBeInTheDocument();
    expect(screen.getByText("Former student")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Transcript of Tolu Adebayo" })).toBeInTheDocument();
    expect(mocked.transcript).toHaveBeenCalledWith("s1");
  });
});
