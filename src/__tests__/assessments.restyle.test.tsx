/** @jest-environment jsdom */
/**
 * Assessments in the tl design system: the page header keeps its words and
 * the Create Assessment action, the counters are stat tiles, and the empty
 * and loading states show.
 */
import React from "react";
import { render, screen, mockAdmin } from "@/test-utils/render";
import AssessmentManagementPage from "@/components/assessment/AssessmentManagementPage";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockAssessments = jest.fn();
jest.mock("@/hooks/assessments/queries", () => ({
  useAssessments: () => mockAssessments(),
  useAssessmentMutations: () => ({
    create: { mutateAsync: jest.fn(), isPending: false },
    update: { mutateAsync: jest.fn(), isPending: false },
    deactivate: { mutateAsync: jest.fn(), isPending: false },
  }),
}));

describe("assessments, restyled", () => {
  it("shows the header, stat tiles and the empty state", () => {
    mockAssessments.mockReturnValue({
      data: { assessments: [], pagination: { currentPage: 1, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      isError: false,
    });
    render(<AssessmentManagementPage terms={[]} />, { user: mockAdmin });
    expect(screen.getByRole("heading", { level: 1, name: "Assessment Management" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Create Assessment/ })[0]).toBeTruthy();
    expect(screen.getByRole("group", { name: "Assessment counts" })).toHaveTextContent(
      "Total Assessments"
    );
    expect(screen.getByText("No assessments created yet")).toBeTruthy();
  });

  it("shows the skeleton while the first page loads", () => {
    mockAssessments.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
    });
    const { container } = render(<AssessmentManagementPage terms={[]} />, { user: mockAdmin });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
