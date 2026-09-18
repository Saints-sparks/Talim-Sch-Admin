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
import { useBankAccounts, useWalletSummary } from "@/hooks/finance/useFinanceQueries";

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Finance</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your school wallet, transactions and withdrawals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("Settings")}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50"
            >
              <Shield size={16} /> Finance Settings
            </button>
            <button
              type="button"
              onClick={() => {
                void wallet.refetch();
                void accounts.refetch();
              }}
              aria-label="Refresh wallet"
              className="p-2 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin text-[#003366]" : "text-gray-500"}
              />
            </button>
            <PermissionGate permission={Permission.MANAGE_FINANCE}>
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
              >
                <ArrowUpCircle size={16} /> Withdraw Funds
              </button>
            </PermissionGate>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {FINANCE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
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
      </div>
    </div>
  );
}
