/** @jest-environment jsdom */
/**
 * The students roster's status filter (Active, Graduated, Withdrawn, Left
 * Talim, Deactivated, All) and status badges. The roster endpoint does not
 * send `status` yet, so the filter runs on the rows it returns, reads a
 * missing status as active, and says so when former students are asked for.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { mockAdmin, render, screen, within } from "@/test-utils/render";
import StudentsPage from "@/app/users/students/page";
import type { Student } from "@/app/services/student.service";
import {
  isFormerFilter,
  isFormerStudent,
  matchesStudentStatus,
  rosterHasStatus,
  standingOf,
} from "@/components/users/students/studentStatus";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/users/students",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/hooks/queries/reference", () => ({
  useClasses: () => ({ data: [], isLoading: false }),
}));

const mockRoster = jest.fn();
jest.mock("@/hooks/users/useStudents", () => ({
  useStudentRoster: (params: unknown) => mockRoster(params),
}));

/**
 * A roster row.
 *
 * @param id - Id and first name.
 * @param extra - Status fields.
 * @returns The row.
 */
function row(id: string, extra: Partial<Student>): Student {
  return {
    _id: id,
    userId: { _id: `u-${id}`, firstName: id, lastName: "Student", email: "", phoneNumber: "" },
    classId: { _id: "c1", name: "SS 3A" },
    admissionNumber: `ADM/${id}`,
    gradeLevel: "SS 3",
    isActive: true,
    ...extra,
  } as unknown as Student;
}

const ROWS = [
  row("Ada", { status: "active", isActive: true }),
  row("Bayo", { status: "graduated", isActive: false }),
  row("Chidi", { status: "withdrawn", isActive: false }),
  row("Dayo", { status: "left_talim", isActive: false }),
  row("Efe", { status: "active", isActive: false }),
];

/**
 * Serves the roster.
 *
 * @param rows - The rows the endpoint returns.
 */
function serve(rows: Student[]) {
  mockRoster.mockReturnValue({
    isPending: false,
    isError: false,
    isSuccess: true,
    data: { data: rows, meta: { total: rows.length, page: 1, lastPage: 1, limit: 500 } },
    refetch: jest.fn(),
  });
}

/** The first names on the cards shown. */
function shownNames(): string[] {
  return screen.queryAllByRole("article").map((card) => card.getAttribute("aria-label") ?? "");
}

describe("student standing", () => {
  it("reads the status first, then the roster switch; a missing status is active", () => {
    expect(standingOf({ status: "graduated", isActive: false })).toBe("graduated");
    expect(standingOf({ status: "active", isActive: false })).toBe("deactivated");
    expect(standingOf({ isActive: true })).toBe("active");
    expect(standingOf({ isActive: false })).toBe("deactivated");
    expect(matchesStudentStatus({ status: "withdrawn" }, "withdrawn")).toBe(true);
    expect(matchesStudentStatus({ status: "withdrawn" }, "active")).toBe(false);
    expect(matchesStudentStatus({ isActive: false }, "")).toBe(true);
    expect(isFormerFilter("left_talim")).toBe(true);
    expect(isFormerFilter("deactivated")).toBe(false);
    expect(isFormerStudent("graduated")).toBe(true);
    expect(isFormerStudent("active")).toBe(false);
    expect(isFormerStudent(undefined)).toBe(false);
    expect(rosterHasStatus([{}, { status: "active" }])).toBe(true);
    expect(rosterHasStatus([{}])).toBe(false);
  });
});

describe("students roster status filter", () => {
  beforeEach(() => mockRoster.mockReset());

  it("offers every status and filters the rows by it, with a badge per standing", async () => {
    const user = userEvent.setup();
    serve(ROWS);
    render(<StudentsPage />, { user: mockAdmin });

    const select = screen.getByRole("combobox", { name: "Filter by status" });
    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent)
    ).toEqual(["All statuses", "Active", "Graduated", "Withdrawn", "Left Talim", "Deactivated"]);
    expect(shownNames()).toHaveLength(5);
    const bayo = screen.getByRole("article", { name: "Bayo Student" });
    expect(within(bayo).getByText("Graduated")).toBeInTheDocument();
    expect(
      within(screen.getByRole("article", { name: "Dayo Student" })).getByText("Left Talim")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("article", { name: "Efe Student" })).getByText("Inactive")
    ).toBeInTheDocument();

    await user.selectOptions(select, "graduated");
    expect(shownNames()).toEqual(["Bayo Student"]);
    // A filter scans a wide page, since it runs on the rows the endpoint returns.
    expect(mockRoster).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 500 }));

    await user.selectOptions(select, "withdrawn");
    expect(shownNames()).toEqual(["Chidi Student"]);
    await user.selectOptions(select, "left_talim");
    expect(shownNames()).toEqual(["Dayo Student"]);
    await user.selectOptions(select, "active");
    expect(shownNames()).toEqual(["Ada Student"]);
    await user.selectOptions(select, "deactivated");
    expect(shownNames()).toEqual(["Efe Student"]);
    await user.selectOptions(select, "");
    expect(shownNames()).toHaveLength(5);
    expect(screen.queryByText(/can't be told apart/)).toBeNull();
  });

  it("says so when the endpoint sends no status and former students are asked for", async () => {
    const user = userEvent.setup();
    serve([row("Ada", { isActive: true }), row("Bayo", { isActive: false })]);
    render(<StudentsPage />, { user: mockAdmin });

    expect(
      within(screen.getByRole("article", { name: "Ada Student" })).getByText("Active")
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by status" }),
      "graduated"
    );
    expect(screen.getByText("Former students can't be told apart here yet")).toBeInTheDocument();
    expect(shownNames()).toEqual([]);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by status" }),
      "deactivated"
    );
    expect(shownNames()).toEqual(["Bayo Student"]);
    expect(screen.queryByText("Former students can't be told apart here yet")).toBeNull();
  });
});
