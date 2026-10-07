"use client";

import { useState } from "react";
import { ArrowUpCircle, RefreshCw, Shield } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { OverviewTab } from "@/components/finance/OverviewTab";
import { PayoutAccountsTab } from "@/components/finance/PayoutAccountsTab";
import { SecurityTab } from "@/components/finance/SecurityTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";
import { WithdrawalsTab } from "@/components/finance/WithdrawalsTab";
import { WithdrawalFlow } from "@/components/finance/withdrawal/WithdrawalFlow";
import { FINANCE_TABS, type FinanceTab } from "@/components/finance/tabs";
import { Page, PageHeader, Tabs, ghostButton, iconButton, primaryButton } from "@/components/tl";
import { useBankAccounts, useWalletSummary } from "@/hooks/finance/useFinanceQueries";

/** The tab list's options: each tab with an id-safe value. */
const TAB_OPTIONS = FINANCE_TABS.map((tab) => ({
  value: tab.toLowerCase().replace(/\s+/g, "-"),
  label: tab,
}));

/**
 * The tab a tab-list value stands for.
 *
 * @param value - The option's value ("payout-accounts").
 * @returns The tab ("Payout Accounts").
 */
function tabFor(value: string): FinanceTab {
  return TAB_OPTIONS.find((option) => option.value === value)?.label ?? "Overview";
}

/**
 * School finance: the wallet, its ledger, withdrawals, payout accounts and
 * withdrawal security.
 *
 * The route itself is gated on `manage:finance` by `RouteGuard`
 * (`src/lib/routePermissions.ts`), and every action that moves money is gated
 * again here and inside each tab — an admin without the permission sees no
 * withdrawal button and no bank-account actions at all, rather than buttons
 * the API would refuse.
 *
 * Wallet balances and the account list are fetched once here and shared with
 * the tabs and the withdrawal flow through TanStack Query, so the figure in
 * the header and the one in the withdrawal modal are always the same object.
 *
 * @returns The finance page.
 */
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("Overview");
  const [showWithdraw, setShowWithdraw] = useState(false);

  const wallet = useWalletSummary();
  const accounts = useBankAccounts();

  const refreshing = wallet.isFetching || accounts.isFetching;

  const activeValue = TAB_OPTIONS.find((option) => option.label === activeTab)?.value ?? "overview";

  return (
    <Page>
      <PageHeader
        title="Finance"
        subtitle="Manage your school wallet, transactions and withdrawals."
        actions={
          <>
            <button type="button" onClick={() => setActiveTab("Settings")} className={ghostButton}>
              <Shield size={16} aria-hidden /> Finance Settings
            </button>
            <button
              type="button"
              onClick={() => {
                void wallet.refetch();
                void accounts.refetch();
              }}
              aria-label="Refresh wallet"
              className={`${iconButton} border border-tl-control bg-tl-surface`}
            >
              <RefreshCw
                size={17}
                aria-hidden
                className={refreshing ? "animate-spin text-tl-brand" : undefined}
              />
            </button>
            <PermissionGate permission={Permission.MANAGE_FINANCE}>
              <button type="button" onClick={() => setShowWithdraw(true)} className={primaryButton}>
                <ArrowUpCircle size={16} aria-hidden /> Withdraw Funds
              </button>
            </PermissionGate>
          </>
        }
      />

      <Tabs
        options={TAB_OPTIONS}
        value={activeValue}
        onChange={(value) => setActiveTab(tabFor(value))}
        label="Finance sections"
        idPrefix="finance"
      />

      <div role="tabpanel" id="finance-panel" aria-labelledby={`finance-tab-${activeValue}`}>
        {activeTab === "Overview" && (
          <OverviewTab
            wallet={wallet}
            onWithdraw={() => setShowWithdraw(true)}
            onGoToTab={setActiveTab}
          />
        )}
        {activeTab === "Transactions" && <TransactionsTab />}
        {activeTab === "Withdrawals" && (
          <WithdrawalsTab onNewWithdrawal={() => setShowWithdraw(true)} />
        )}
        {activeTab === "Payout Accounts" && <PayoutAccountsTab />}
        {activeTab === "Settings" && <SecurityTab />}
      </div>

      {showWithdraw && (
        <PermissionGate permission={Permission.MANAGE_FINANCE}>
          <WithdrawalFlow
            accounts={accounts.data ?? []}
            summary={wallet.data}
            onClose={() => setShowWithdraw(false)}
            onViewWithdrawals={() => setActiveTab("Withdrawals")}
          />
        </PermissionGate>
      )}
    </Page>
  );
}
