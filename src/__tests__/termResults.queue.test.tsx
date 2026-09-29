/** @jest-environment jsdom */
/**
 * The Term Results queue against fixtures shaped like the generated contract
 * (Round 3 as built): the list per status with counts, opening a submission
 * (broadsheet and remarks), the publish confirmation, the required return
 * reason, saving principal remarks, the 409s (already published or returned,
 * a subject unlocked, remarks locked), and permission gating of the route,
 * the sidebar and the actions.
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  mockAdmin,
  mockSubAdmin,
} from "@/test-utils/render";
import RouteGuard from "@/components/RouteGuard";
import { TermResultsScreen } from "@/components/termResults/TermResultsScreen";
import { NAV_ITEMS, visibleNavItems } from "@/components/sidebar/navConfig";
import { Permission } from "@/lib/permissions";
import { requiredPermissionFor } from "@/lib/routePermissions";
import { ApiError } from "@/lib/apiError";
import type { Broadsheet, TermRemarkRow, TermResultSubmission } from "@/types/gradingContract";

jest.mock("next/navigation", () => ({
  usePathname: () => "/term-results",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock("@/hooks/queries/reference", () => ({
  useTerms: () => ({
    data: [
      {
        _id: "t1",
        name: "First Term",
        academicYearId: "y1",
        isCurrent: true,
        startDate: "",
        endDate: "",
      },
      {
        _id: "t0",
        name: "Third Term",
        academicYearId: "y0",
        isCurrent: false,
        startDate: "",
        endDate: "",
      },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useAcademicYears: () => ({ data: [{ _id: "y1", year: "2026/2027" }], isLoading: false }),
}));

jest.mock("@/app/services/term-results.service", () => ({
  listTermResults: jest.fn(),
  getTermResultCounts: jest.fn(),
  getTermResult: jest.fn(),
  getBroadsheet: jest.fn(),
  getTermRemarks: jest.fn(),
  savePrincipalRemarks: jest.fn(),
  publishTermResults: jest.fn(),
  returnTermResults: jest.fn(),
}));
import * as service from "@/app/services/term-results.service";
import { toast } from "@/components/CustomToast";

const mocked = service as jest.Mocked<typeof service>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const submitted: TermResultSubmission = {
  id: "sub1",
  class: { id: "c5a", name: "Grade 5A" },
  term: { id: "t1", name: "First Term" },
  basis: { key: "total", label: "Term total" },
  status: "submitted",
  submittedAt: "2026-09-28T09:30:00Z",
  submittedBy: { id: "u9", name: "Tolu Teacher" },
  studentCount: 2,
  missingRemarks: 1,
  returnReason: null,
  returnedAt: null,
  returnedBy: null,
  publishedAt: null,
  publishedBy: null,
};

const returned: TermResultSubmission = {
  ...submitted,
  id: "sub2",
  class: { id: "c5b", name: "Grade 5B" },
  basis: { key: "a1", label: "First CA" },
  status: "returned",
  returnReason: "Ben's English is missing",
  missingRemarks: 0,
};

/** A 409 as the API sends it: the machine-readable fields at the top level of the body. */
const conflict = (message: string, meta: Record<string, unknown>) =>
  new ApiError("CONFLICT", message, 409, [], undefined, meta);

const sheet: Broadsheet = {
  class: { id: "c5a", name: "Grade 5A" },
  term: { id: "t1", name: "First Term" },
  basis: { key: "total", label: "Term total", maxPerSubject: null },
  scale: [
    { letter: "A", min: 70, remark: "Excellent" },
    { letter: "C", min: 50, remark: null },
    { letter: "F", min: 0, remark: "Fail" },
  ],
  passMark: 50,
  subjects: [
    { courseId: "m", code: "MTH", title: "Mathematics", published: true },
    { courseId: "e", code: "ENG", title: "English", published: true },
  ],
  rows: [
    {
      student: { id: "s1", name: "Ada Student", admissionNumber: "GF/001" },
      cells: [82, 74.5],
      total: 156.5,
      average: 78.3,
      position: { rank: 1, of: 2 },
      grade: "A",
      publishedCount: 2,
    },
    {
      student: { id: "s2", name: "Ben Student", admissionNumber: null },
      cells: [55, null],
      total: 55,
      average: 55,
      position: { rank: 2, of: 2 },
      grade: "C",
      publishedCount: 1,
    },
  ],
  ready: true,
  waitingOn: [],
};

const remarks: TermRemarkRow[] = [
  {
    student: { id: "s1", name: "Ada Student", admissionNumber: "GF/001" },
    position: { rank: 1, of: 2 },
    average: 78.3,
    publishedCount: 2,
    subjectCount: 2,
    classTeacherRemark: "A focused term.",
    principalRemark: "",
  },
  {
    student: { id: "s2", name: "Ben Student", admissionNumber: null },
    position: { rank: 2, of: 2 },
    average: 55,
    publishedCount: 1,
    subjectCount: 2,
    classTeacherRemark: "",
    principalRemark: "See me.",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mocked.listTermResults.mockImplementation(async ({ status } = {}) =>
    status === "submitted" ? [submitted] : status === "returned" ? [returned] : []
  );
  mocked.getTermResultCounts.mockResolvedValue({ submitted: 1, returned: 1, published: 0 });
  mocked.getTermResult.mockImplementation(async (id) => {
    const row = [submitted, returned].find((s) => s.id === id) ?? submitted;
    return { ...row, classId: row.class.id, termId: row.term.id };
  });
  mocked.getBroadsheet.mockResolvedValue(sheet);
  mocked.getTermRemarks.mockResolvedValue(remarks);
  mocked.savePrincipalRemarks.mockImplementation(async (_id, changes) =>
    remarks.map((row) => {
      const change = changes.find((c) => c.studentId === row.student.id);
      return change ? { ...row, principalRemark: change.principalRemark } : row;
    })
  );
  mocked.publishTermResults.mockResolvedValue({ ...submitted, status: "published" });
  mocked.returnTermResults.mockResolvedValue({ ...submitted, status: "returned" });
});

/** Renders the queue and opens the submitted Grade 5A results. */
async function openSubmitted(user = mockAdmin) {
  render(<TermResultsScreen />, { user });
  fireEvent.click(await screen.findByRole("button", { name: /Grade 5A results/ }));
  await screen.findByRole("heading", { name: "Grade 5A · First Term" });
}

// ─── Queue ────────────────────────────────────────────────────────────────────

describe("queue", () => {
  it("lists the current term's submitted results with basis, submitter, students and missing remarks", async () => {
    render(<TermResultsScreen />);
    const table = await screen.findByRole("table", {
      name: /Submitted results for 2026\/2027 · First Term/,
    });
    const row = within(table).getByRole("row", { name: /Grade 5A/ });
    expect(within(row).getByText("Term total")).toBeInTheDocument();
    expect(within(row).getByText("Tolu Teacher")).toBeInTheDocument();
    expect(within(row).getByText("2")).toBeInTheDocument();
    expect(within(row).getByText("1 missing")).toBeInTheDocument();
    expect(mocked.listTermResults).toHaveBeenCalledWith({ termId: "t1", status: "submitted" });
    expect(screen.getByRole("button", { name: "Submitted (1)" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("counts every tab from the counts route", async () => {
    render(<TermResultsScreen />);
    expect(await screen.findByRole("button", { name: "Returned (1)" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "Published (0)" })).toBeInTheDocument();
    expect(mocked.getTermResultCounts).toHaveBeenCalledWith("t1");
  });

  it("switches status and term", async () => {
    render(<TermResultsScreen />);
    await screen.findByText("Grade 5A");
    fireEvent.click(screen.getByRole("button", { name: /^Returned/ }));
    expect(await screen.findByText("Grade 5B")).toBeInTheDocument();
    expect(screen.getByText("Returned: Ben's English is missing")).toBeInTheDocument();
    expect(screen.getByText("First CA")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Published/ }));
    expect(await screen.findByText(/No results have been published this term/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Term"), { target: { value: "t0" } });
    await waitFor(() =>
      expect(mocked.listTermResults).toHaveBeenCalledWith({ termId: "t0", status: "published" })
    );
  });

  it("reports a failed load with a retry", async () => {
    mocked.listTermResults.mockRejectedValue(
      new ApiError("INTERNAL_ERROR", "Server fell over", 500)
    );
    render(<TermResultsScreen />);
    expect(await screen.findByText("Server fell over")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

// ─── Detail ───────────────────────────────────────────────────────────────────

describe("a submission", () => {
  it("shows the broadsheet read-only and the remarks", async () => {
    await openSubmitted();
    const sheetTable = await screen.findByRole("table", {
      name: /Broadsheet · Grade 5A · First Term · Term total/,
    });
    const ada = within(sheetTable).getByRole("row", { name: /Ada Student/ });
    expect(within(ada).getByText("82%")).toBeInTheDocument();
    expect(within(ada).getByText("1st of 2")).toBeInTheDocument();
    expect(within(ada).getByText("A")).toBeInTheDocument();
    expect(within(sheetTable).queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
    expect(mocked.getBroadsheet).toHaveBeenCalledWith("c5a", { termId: "t1", basis: "total" });

    expect(await screen.findByText("A focused term.")).toBeInTheDocument();
    expect(screen.getByText("No remark yet")).toBeInTheDocument();
    expect(
      screen.getByText("1 student has no class teacher remark yet.", { exact: false })
    ).toBeInTheDocument();
    // The class teacher's remark is text, the principal's a labelled box.
    expect(screen.getByLabelText("Principal remark for Ben Student")).toHaveValue("See me.");
  });

  it("publishes only after the confirmation, which says students and parents are notified", async () => {
    await openSubmitted();
    fireEvent.click(screen.getByRole("button", { name: "Publish results" }));

    const dialog = await screen.findByRole("dialog", { name: "Publish results?" });
    expect(dialog).toHaveTextContent(/2 students and their parents will be notified/);
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(mocked.publishTermResults).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocked.publishTermResults).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Publish results" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: "Publish results?" })).getByRole("button", {
        name: "Publish and notify",
      })
    );
    await waitFor(() => expect(mocked.publishTermResults).toHaveBeenCalledWith("sub1"));
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/published.*notified/));
    // Back on the queue.
    expect(await screen.findByRole("table", { name: /Submitted results/ })).toBeInTheDocument();
  });

  it("keeps the publish dialog open for a retry when the publish fails", async () => {
    mocked.publishTermResults.mockRejectedValue(
      new ApiError("INTERNAL_ERROR", "Server fell over", 500)
    );
    await openSubmitted();
    fireEvent.click(screen.getByRole("button", { name: "Publish results" }));
    const dialog = await screen.findByRole("dialog", { name: "Publish results?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Publish and notify" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Server fell over"));
    expect(screen.getByRole("dialog", { name: "Publish results?" })).toBeInTheDocument();
  });

  it("on a 409 { waitingOn }, names the unlocked subjects, closes the dialog and blocks publishing", async () => {
    await openSubmitted();
    await screen.findByRole("table", { name: /Broadsheet/ });
    mocked.publishTermResults.mockRejectedValue(
      conflict("A subject is no longer published.", {
        waitingOn: [{ courseId: "e", title: "English" }],
      })
    );
    // What the refreshed broadsheet says after the 409.
    mocked.getBroadsheet.mockResolvedValue({
      ...sheet,
      ready: false,
      waitingOn: [{ courseId: "e", title: "English" }],
      subjects: [sheet.subjects[0], { ...sheet.subjects[1], published: false }],
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish results" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: "Publish results?" })).getByRole("button", {
        name: "Publish and notify",
      })
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "English is no longer published. Return the results, or wait until its teacher publishes again."
      )
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Publish results" })).toBeDisabled()
    );
    expect(screen.getByRole("button", { name: "Publish results" })).toHaveAccessibleDescription(
      /English is no longer published/
    );
  });

  it("on a 409 { code, status }, says who got there first and shows where the results stand", async () => {
    await openSubmitted();
    mocked.publishTermResults.mockRejectedValue(
      conflict("These results are already published.", {
        code: "ALREADY_PUBLISHED",
        status: "published",
      })
    );
    mocked.getTermResult.mockResolvedValue({
      ...submitted,
      status: "published",
      publishedAt: "2026-09-29T08:00:00Z",
      publishedBy: { id: "u1", name: "Ada Admin" },
      classId: "c5a",
      termId: "t1",
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish results" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: "Publish results?" })).getByRole("button", {
        name: "Publish and notify",
      })
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Grade 5A results are already published.")
    );
    expect(
      await screen.findByText(/by Ada Admin\. Students and parents can see/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish results" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Remarks are locked: Grade 5A's results for First Term are published."
    );
  });

  it("closes the return dialog on a 409 { code, status }", async () => {
    await openSubmitted();
    mocked.returnTermResults.mockRejectedValue(
      conflict("These results were returned to the class teacher.", {
        code: "RETURNED",
        status: "returned",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Return to class teacher" }));
    const dialog = await screen.findByRole("dialog", { name: "Return to class teacher" });
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: "Fix it" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Return results" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Grade 5A results were already returned to the class teacher."
      )
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("needs a reason to return, tied to the field, and sends it trimmed", async () => {
    await openSubmitted();
    fireEvent.click(screen.getByRole("button", { name: "Return to class teacher" }));
    const dialog = await screen.findByRole("dialog", { name: "Return to class teacher" });
    const reason = within(dialog).getByLabelText(/Reason/);
    expect(reason).toHaveFocus();

    fireEvent.click(within(dialog).getByRole("button", { name: "Return results" }));
    expect(mocked.returnTermResults).not.toHaveBeenCalled();
    expect(reason).toHaveAttribute("aria-invalid", "true");
    const describedBy = (reason.getAttribute("aria-describedby") ?? "").split(" ");
    expect(document.getElementById(describedBy[0])).toHaveTextContent(/Give a reason/);

    fireEvent.change(reason, { target: { value: "  Ben's remark is missing  " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Return results" }));
    await waitFor(() =>
      expect(mocked.returnTermResults).toHaveBeenCalledWith("sub1", "Ben's remark is missing")
    );
    expect(await screen.findByRole("table", { name: /Submitted results/ })).toBeInTheDocument();
  });

  it("saves only changed principal remarks and blocks publishing while any are unsaved", async () => {
    await openSubmitted();
    const ada = await screen.findByLabelText("Principal remark for Ada Student");
    fireEvent.change(ada, { target: { value: "An excellent term." } });

    const publish = screen.getByRole("button", { name: "Publish results" });
    expect(publish).toBeDisabled();
    expect(publish).toHaveAccessibleDescription(
      "Save or discard the principal's remarks before publishing."
    );

    // What the API answers once the save has landed.
    mocked.getTermRemarks.mockResolvedValue([
      { ...remarks[0], principalRemark: "An excellent term." },
      remarks[1],
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Save remarks (1)" }));
    await waitFor(() =>
      expect(mocked.savePrincipalRemarks).toHaveBeenCalledWith("sub1", [
        { studentId: "s1", principalRemark: "An excellent term." },
      ])
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Publish results" })).toBeEnabled()
    );
    expect(screen.getByLabelText("Principal remark for Ada Student")).toHaveValue(
      "An excellent term."
    );
  });

  it("locks the remarks when a save answers 409 RESULTS_PUBLISHED", async () => {
    await openSubmitted();
    mocked.savePrincipalRemarks.mockRejectedValue(
      conflict("This class's results are published; remarks can no longer change.", {
        code: "RESULTS_PUBLISHED",
      })
    );
    fireEvent.change(await screen.findByLabelText("Principal remark for Ada Student"), {
      target: { value: "An excellent term." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save remarks (1)" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Remarks are locked: Grade 5A's results for First Term are published."
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Not saved: Grade 5A's results for First Term are published, so the remarks are locked."
    );
    expect(screen.queryByLabelText("Principal remark for Ada Student")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save remarks/ })).not.toBeInTheDocument();
    expect(screen.getByText("See me.")).toBeInTheDocument();
    // The unsaved edit is gone, so it no longer blocks publishing.
    expect(screen.getByRole("button", { name: "Publish results" })).toBeEnabled();
  });

  it("blocks publishing when a subject is no longer published", async () => {
    mocked.getBroadsheet.mockResolvedValue({
      ...sheet,
      ready: false,
      waitingOn: [{ courseId: "e", title: "English" }],
      subjects: [sheet.subjects[0], { ...sheet.subjects[1], published: false }],
    });
    await openSubmitted();
    expect(await screen.findByText(/waiting on English/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish results" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Return to class teacher" })).toBeEnabled();
  });

  it("offers no actions on returned results", async () => {
    render(<TermResultsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: /^Returned/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Open Grade 5B results" }));
    expect(
      await screen.findByText(/Returned to the class teacher: Ben's English is missing/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish results" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Return to class teacher" })
    ).not.toBeInTheDocument();
    expect(mocked.getBroadsheet).toHaveBeenCalledWith("c5b", { termId: "t1", basis: "a1" });
  });
});

// ─── Permission gating ────────────────────────────────────────────────────────

describe("gating", () => {
  const sub = (...permissions: string[]) => ({ ...mockSubAdmin, permissions });

  it("puts the route behind manage:assessments", () => {
    expect(requiredPermissionFor("/term-results")).toBe(Permission.MANAGE_ASSESSMENTS);
  });

  it("refuses a sub-admin without manage:assessments and lets one with it in", async () => {
    const { unmount } = render(
      <RouteGuard>
        <p>queue</p>
      </RouteGuard>,
      { user: sub(Permission.MANAGE_STUDENTS) }
    );
    expect(screen.getByRole("heading", { name: "Access Denied" })).toBeInTheDocument();
    expect(screen.queryByText("queue")).not.toBeInTheDocument();
    unmount();

    render(
      <RouteGuard>
        <p>queue</p>
      </RouteGuard>,
      { user: sub(Permission.MANAGE_ASSESSMENTS) }
    );
    expect(screen.getByText("queue")).toBeInTheDocument();
  });

  it("shows the sidebar link next to Assessments only to those who may open it", () => {
    const labels = (held: string[], isFullAdmin = false) =>
      visibleNavItems(NAV_ITEMS, {
        isFullAdmin,
        hasPermission: (p) => isFullAdmin || held.includes(p),
      }).map((item) => item.label);
    const all = labels([], true);
    expect(all.indexOf("Term Results")).toBe(all.indexOf("Assessments") + 1);
    expect(labels([Permission.MANAGE_ASSESSMENTS])).toEqual([
      "Dashboard",
      "Assessments",
      "Term Results",
    ]);
    expect(labels([Permission.MANAGE_STUDENTS])).not.toContain("Term Results");
  });

  it("hides publish, return and remark editing from a viewer without manage:assessments", async () => {
    await openSubmitted(sub());
    await screen.findByText("A focused term.");
    expect(screen.queryByRole("button", { name: "Publish results" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Return to class teacher" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save remarks/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Principal remark for Ben Student")).not.toBeInTheDocument();
    expect(screen.getByText("See me.")).toBeInTheDocument();
  });
});
