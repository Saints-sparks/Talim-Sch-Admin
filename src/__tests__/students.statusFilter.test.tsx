/** @jest-environment jsdom */
/**
 * The students roster's status filter (All, Active, Graduated, Withdrawn,
 * Left Talim, Deactivated) and status badges. Active, Graduated, Withdrawn
 * and Left Talim go to the server as `?status=` (it pages and counts);
 * Deactivated, a class plus a status, and the search scan a wide page here.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { mockAdmin, render, screen, within } from "@/test-utils/render";
import StudentsPage from "@/app/users/students/page";
import type { Student } from "@/app/services/student.service";
import {
  isFormerStudent,
  matchesStudentStatus,
  serverStatusOf,
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
  useClasses: () => ({ data: [{ _id: "c1", name: "SS 3A" }], isLoading: false }),
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
 * Answers the roster like the server: `?status=` filters the school's rows,
 * the class endpoint ignores it, and `meta.total` counts what matched.
 */
function serveLikeServer() {
  mockRoster.mockImplementation(
    (params: { status?: string | null; page: number; limit: number }) => {
      const rows = params.status
        ? ROWS.filter((r) => (r.status ?? "active") === params.status)
        : ROWS;
      return {
        isPending: false,
        isError: false,
        isSuccess: true,
        data: {
          data: rows,
          meta: { total: rows.length, page: params.page, lastPage: 1, limit: params.limit },
        },
        refetch: jest.fn(),
      };
    }
  );
}

/** The names on the cards shown. */
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
    expect(isFormerStudent("graduated")).toBe(true);
    expect(isFormerStudent("active")).toBe(false);
    expect(isFormerStudent(undefined)).toBe(false);
  });

  it("sends the four server statuses, not All or Deactivated", () => {
    expect(serverStatusOf("")).toBeNull();
    expect(serverStatusOf("deactivated")).toBeNull();
    expect(serverStatusOf("active")).toBe("active");
    expect(serverStatusOf("graduated")).toBe("graduated");
    expect(serverStatusOf("withdrawn")).toBe("withdrawn");
    expect(serverStatusOf("left_talim")).toBe("left_talim");
  });
});

describe("students roster status filter", () => {
  beforeEach(() => {
    mockRoster.mockReset();
    serveLikeServer();
  });

  it("filters by status on the server, a page at a time, with a badge per standing", async () => {
    const user = userEvent.setup();
    render(<StudentsPage />, { user: mockAdmin });

    const select = screen.getByRole("combobox", { name: "Filter by status" });
    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent)
    ).toEqual(["All statuses", "Active", "Graduated", "Withdrawn", "Left Talim", "Deactivated"]);
    expect(mockRoster).toHaveBeenLastCalledWith({
      page: 1,
      limit: 12,
      classId: null,
      status: null,
    });
    expect(shownNames()).toHaveLength(5);
    expect(
      within(screen.getByRole("article", { name: "Bayo Student" })).getByText("Graduated")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("article", { name: "Dayo Student" })).getByText("Left Talim")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("article", { name: "Efe Student" })).getByText("Inactive")
    ).toBeInTheDocument();

    await user.selectOptions(select, "graduated");
    expect(mockRoster).toHaveBeenLastCalledWith({
      page: 1,
      limit: 12,
      classId: null,
      status: "graduated",
    });
    expect(shownNames()).toEqual(["Bayo Student"]);
    await user.selectOptions(select, "withdrawn");
    expect(shownNames()).toEqual(["Chidi Student"]);
    await user.selectOptions(select, "left_talim");
    expect(shownNames()).toEqual(["Dayo Student"]);
    // The server's Active is every current student; a deactivated one says Inactive.
    await user.selectOptions(select, "active");
    expect(mockRoster).toHaveBeenLastCalledWith({
      page: 1,
      limit: 12,
      classId: null,
      status: "active",
    });
    expect(shownNames()).toEqual(["Ada Student", "Efe Student"]);
    await user.selectOptions(select, "");
    expect(shownNames()).toHaveLength(5);
  });

  it("scans a wide page for Deactivated, which the server does not filter by", async () => {
    const user = userEvent.setup();
    render(<StudentsPage />, { user: mockAdmin });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by status" }),
      "deactivated"
    );
    expect(mockRoster).toHaveBeenLastCalledWith({
      page: 1,
      limit: 500,
      classId: null,
      status: null,
    });
    expect(shownNames()).toEqual(["Efe Student"]);
  });

  it("filters a class's students here, as the class endpoint has no status filter", async () => {
    const user = userEvent.setup();
    render(<StudentsPage />, { user: mockAdmin });
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by class" }), "c1");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by status" }),
      "graduated"
    );
    expect(mockRoster).toHaveBeenLastCalledWith({
      page: 1,
      limit: 500,
      classId: "c1",
      status: null,
    });
    expect(shownNames()).toEqual(["Bayo Student"]);
  });
});
