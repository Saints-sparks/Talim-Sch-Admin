/** @jest-environment jsdom */
/**
 * The users rosters in the tl design system: the students roster keeps its
 * heading and Add Student action, shows a busy skeleton while loading and
 * the tl empty state when the school has no students.
 */
import React from "react";
import { render, screen, mockAdmin } from "@/test-utils/render";
import StudentsPage from "@/app/users/students/page";

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
  useStudentRoster: () => mockRoster(),
}));

describe("students roster, restyled", () => {
  it("shows a skeleton while the roster loads", () => {
    mockRoster.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
      refetch: jest.fn(),
    });
    const { container } = render(<StudentsPage />, { user: mockAdmin });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows the tl empty state when there are no students", () => {
    mockRoster.mockReturnValue({
      isPending: false,
      isError: false,
      data: { data: [], meta: { total: 0 } },
      refetch: jest.fn(),
    });
    render(<StudentsPage />, { user: mockAdmin });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Students/);
    expect(screen.getByText("No Students Yet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Add Student/ }).length).toBeGreaterThan(0);
  });
});
