/** @jest-environment jsdom */
/**
 * Transit in the tl design system: the transfers list's loading and empty
 * states keep their words, and the page wears the tl page title.
 */
import React from "react";
import { render, screen, mockAdmin } from "@/test-utils/render";
import TransfersPage from "@/app/transit/transfers/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/transit/transfers",
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockTransfers = jest.fn();
jest.mock("@/hooks/transit/useTransfers", () => ({
  useTransfers: () => mockTransfers(),
}));

describe("transfers list, restyled", () => {
  it("shows pulsing rows while loading", () => {
    mockTransfers.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    const { container } = render(<TransfersPage />, { user: mockAdmin });
    expect(screen.getByRole("heading", { level: 1, name: "Transfers" })).toHaveClass("text-tl-ink");
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("says when there are no transfers", () => {
    mockTransfers.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    const { container } = render(<TransfersPage />, { user: mockAdmin });
    expect(screen.getByText("No transfers found")).toBeTruthy();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
  });
});
