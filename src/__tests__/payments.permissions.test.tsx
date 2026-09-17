/**
 * @jest-environment jsdom
 */

/**
 * D8 for payments. Recording a manual payment credits the wallet and issues a
 * receipt, so it sits behind `manage:payments` — a different permission from
 * the wallet's `manage:finance`, and holding one must not imply the other.
 */
import React from "react";
import { render, mockAdmin, mockSubAdmin, screen } from "@/test-utils/render";
import PaymentsPage from "@/app/payments/page";
import type { AdminSummary } from "@/app/services/payments.service";

const summary: AdminSummary = {
  totalTransactions: 12,
  totalPaid: 480_000,
  totalPending: 2,
  totalFailed: 1,
  currency: "NGN",
};

jest.mock("@/hooks/finance/usePaymentsQueries", () => ({
  PAYMENTS_PAGE_SIZE: 20,
  usePaymentsSummary: jest.fn(),
  usePaymentTransactions: jest.fn(),
  usePaymentReceipts: jest.fn(),
  usePaymentProviders: jest.fn(),
  useCreateManualPayment: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import { usePaymentsSummary } from "@/hooks/finance/usePaymentsQueries";

beforeEach(() => {
  jest.clearAllMocks();
  (usePaymentsSummary as jest.Mock).mockReturnValue({
    data: summary,
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  });
});

/** A sub-admin trusted with the wallet but not with recording payments. */
const financeOnlySubAdmin = { ...mockSubAdmin, permissions: ["manage:finance"] };

/** A sub-admin who records payments at the front desk. */
const paymentsSubAdmin = { ...mockSubAdmin, permissions: ["manage:payments"] };

describe("recording a manual payment", () => {
  it("is hidden from a sub-admin without manage:payments", () => {
    render(<PaymentsPage />, { user: financeOnlySubAdmin });
    expect(screen.queryByRole("button", { name: /record payment/i })).toBeNull();
  });

  it("is offered to a sub-admin who holds manage:payments", () => {
    render(<PaymentsPage />, { user: paymentsSubAdmin });
    expect(screen.getByRole("button", { name: /record payment/i })).toBeInTheDocument();
  });

  it("is offered to the full school admin", () => {
    render(<PaymentsPage />, { user: mockAdmin });
    expect(screen.getByRole("button", { name: /record payment/i })).toBeInTheDocument();
  });
});

describe("reading payments", () => {
  it("still shows the totals to a sub-admin without manage:payments", () => {
    render(<PaymentsPage />, { user: financeOnlySubAdmin });
    expect(screen.getByText("₦480,000.00")).toBeInTheDocument();
  });
});
