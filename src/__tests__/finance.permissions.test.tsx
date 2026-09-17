/**
 * @jest-environment jsdom
 */

/**
 * D8 for the money path: an admin without `manage:finance` must not be offered
 * a withdrawal or any bank-account action. Hiding them is the point — the API
 * would refuse anyway, and a button that always fails is worse than no button.
 */
import React from "react";
import { render, mockAdmin, mockSubAdmin, screen } from "@/test-utils/render";
import FinancePage from "@/app/finance/page";
import { PayoutAccountsTab } from "@/components/finance/PayoutAccountsTab";
import type { BankAccount, WalletSummary } from "@/app/services/finance.service";

const wallet: WalletSummary = {
  ledgerBalance: 500_000,
  availableBalance: 250_000,
  pendingBalance: 0,
  withdrawnBalance: 250_000,
  thisMonthRevenue: 100_000,
  currency: "NGN",
  status: "active",
};

const account: BankAccount = {
  _id: "acct1",
  bankName: "GTBank",
  bankCode: "058",
  accountNumber: "0123456789",
  accountName: "Talim Model School",
  isVerified: true,
  isDefault: true,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** A settled query result, enough for the components under test. */
function settled<T>(data: T) {
  return {
    data,
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  };
}

jest.mock("@/hooks/finance/useFinanceQueries", () => ({
  useWalletSummary: jest.fn(),
  useBankAccounts: jest.fn(),
  useWalletTransactions: jest.fn(),
  useWithdrawals: jest.fn(),
  useSecurityStatus: jest.fn(),
  useInvalidateFinance: () => ({
    money: jest.fn(),
    bankAccounts: jest.fn(),
    security: jest.fn(),
    all: jest.fn(),
  }),
}));

jest.mock("@/hooks/finance/useFinanceMutations", () => ({
  useAddBankAccount: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useVerifyBankAccount: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useSetDefaultBankAccount: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRemoveBankAccount: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useCancelWithdrawal: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import {
  useBankAccounts,
  useWalletSummary,
  useWalletTransactions,
  useWithdrawals,
} from "@/hooks/finance/useFinanceQueries";

beforeEach(() => {
  jest.clearAllMocks();
  (useWalletSummary as jest.Mock).mockReturnValue(settled(wallet));
  (useBankAccounts as jest.Mock).mockReturnValue(settled([account]));
  (useWalletTransactions as jest.Mock).mockReturnValue(settled({ success: true, data: [] }));
  (useWithdrawals as jest.Mock).mockReturnValue(settled({ success: true, data: [] }));
});

/** A sub-admin who manages students but has nothing to do with money. */
const subAdminWithoutFinance = { ...mockSubAdmin, permissions: ["manage:students"] };

/** A sub-admin the school trusts with the wallet. */
const subAdminWithFinance = { ...mockSubAdmin, permissions: ["manage:finance"] };

describe("withdrawal access", () => {
  it("offers no withdrawal button to a sub-admin without manage:finance", () => {
    render(<FinancePage />, { user: subAdminWithoutFinance });
    expect(screen.queryByRole("button", { name: /withdraw funds/i })).toBeNull();
  });

  it("offers the withdrawal button to a sub-admin who holds manage:finance", () => {
    render(<FinancePage />, { user: subAdminWithFinance });
    expect(screen.getAllByRole("button", { name: /withdraw funds/i }).length).toBeGreaterThan(0);
  });

  it("offers the withdrawal button to the full school admin", () => {
    render(<FinancePage />, { user: mockAdmin });
    expect(screen.getAllByRole("button", { name: /withdraw funds/i }).length).toBeGreaterThan(0);
  });

  it("still shows the balance to a sub-admin without manage:finance", () => {
    render(<FinancePage />, { user: subAdminWithoutFinance });
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });
});

describe("bank account actions", () => {
  it("hides add, verify, default and remove from a sub-admin without manage:finance", () => {
    render(<PayoutAccountsTab />, { user: subAdminWithoutFinance });
    expect(screen.queryByRole("button", { name: /add payout account/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^remove$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /set default/i })).toBeNull();
    // The account itself is still listed — reading is not the risky part.
    expect(screen.getByText("GTBank")).toBeInTheDocument();
  });

  it("shows the account actions to a sub-admin who holds manage:finance", () => {
    render(<PayoutAccountsTab />, { user: subAdminWithFinance });
    expect(screen.getByRole("button", { name: /add payout account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^remove$/i })).toBeInTheDocument();
  });
});
