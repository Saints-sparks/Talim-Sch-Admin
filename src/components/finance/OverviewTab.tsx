"use client";

import { ArrowDownCircle, ArrowUpCircle, Building2, Clock, Wallet } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ErrorState } from "@/components/StateComponents";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import type {
  LedgerEntry,
  WalletSummary,
  WithdrawalRequest,
} from "@/app/services/finance.service";
import { useWalletTransactions, useWithdrawals } from "@/hooks/finance/useFinanceQueries";
import { LedgerStatusBadge, WithdrawalStatusBadge } from "./FinanceBadges";
import { StatCard } from "./StatCard";
import { StatCardsSkeleton } from "./FinanceSkeletons";
import { describeFinanceError } from "./financeErrors";
import { formatDate, formatNaira, maskAccountNumber } from "./formatters";
import type { FinanceTab } from "./tabs";

/** How many rows the two "recent" panels show. */
const RECENT_LIMIT = 5;

interface OverviewTabProps {
  /** The wallet query, so this tab shows the same object the page header does. */
  wallet: UseQueryResult<WalletSummary>;
  onWithdraw: () => void;
  onGoToTab: (tab: FinanceTab) => void;
}

/**
 * Balances, a balance trend, and the five most recent ledger entries and
 * withdrawals.
 *
 * The two recent lists are independent requests and are issued in parallel by
 * TanStack Query rather than chained, and both are cached with the live stale
 * time so a withdrawal shows up here the moment it is confirmed.
 *
 * @param props - The shared wallet query and the page's navigation callbacks.
 * @returns The overview tab.
 */
export function OverviewTab({ wallet, onWithdraw, onGoToTab }: OverviewTabProps) {
  const ledger = useWalletTransactions({ limit: RECENT_LIMIT });
  const withdrawals = useWithdrawals({ limit: RECENT_LIMIT });

  if (wallet.isPending) return <StatCardsSkeleton />;

  if (wallet.isError || !wallet.data) {
    const copy = describeFinanceError(wallet.error, "wallet balances");
    return (
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={copy.retryable ? () => void wallet.refetch() : undefined}
      />
    );
  }

  const summary = wallet.data;
  const entries: LedgerEntry[] = ledger.data?.data ?? [];
  const recentWithdrawals: WithdrawalRequest[] = withdrawals.data?.data ?? [];

  const trend = [...entries]
    .reverse()
    .map((entry) => ({ label: formatDate(entry.createdAt), value: entry.balanceAfter || 0 }))
    .slice(-7);
  const maxTrend = Math.max(...trend.map((point) => point.value), summary.availableBalance, 1);
  const pendingCount = recentWithdrawals.filter((item) => item.status === "pending").length;
  const succeeded = recentWithdrawals.filter((item) => item.status === "completed");
  const unsuccessful = recentWithdrawals.filter((item) =>
    ["failed", "cancelled", "rejected"].includes(item.status)
  );
  const sumOf = (items: WithdrawalRequest[]) =>
    items.reduce((total, item) => total + (item.amountToReceive || item.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-[#003366]" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Wallet Balance</p>
          </div>
          <p className="text-3xl font-bold text-[#003366]">{formatNaira(summary.availableBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Available for withdrawal</p>
          <PermissionGate permission={Permission.MANAGE_FINANCE}>
            <button
              type="button"
              onClick={onWithdraw}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90 transition"
            >
              <ArrowUpCircle size={15} /> Withdraw Funds
            </button>
          </PermissionGate>
        </div>
        <StatCard
          label="Total Received"
          value={formatNaira(summary.ledgerBalance)}
          sub="This academic year"
          icon={ArrowDownCircle}
        />
        <StatCard
          label="Total Withdrawn"
          value={formatNaira(summary.withdrawnBalance)}
          sub="This academic year"
          icon={ArrowUpCircle}
          color="text-orange-600"
        />
        <StatCard
          label="Pending Withdrawals"
          value={formatNaira(summary.pendingBalance)}
          sub={`${pendingCount} pending request${pendingCount === 1 ? "" : "s"}`}
          icon={Clock}
          color="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-4">
        <RecentPanel
          title="Recent Transactions"
          onViewAll={() => onGoToTab("Transactions")}
          loading={ledger.isPending}
          failed={ledger.isError}
          empty={entries.length === 0}
          emptyLabel="No transactions yet"
          subject="recent transactions"
        >
          {entries.map((entry) => (
            <div key={entry._id} className="px-5 py-3 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  entry.direction === "credit" ? "bg-green-50" : "bg-red-50"
                }`}
              >
                {entry.direction === "credit" ? (
                  <ArrowDownCircle size={17} className="text-green-600" />
                ) : (
                  <ArrowUpCircle size={17} className="text-red-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                  {entry.description || entry.reference}
                </p>
                <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
              </div>
              <p
                className={`text-sm font-bold ${
                  entry.direction === "credit" ? "text-green-600" : "text-red-500"
                }`}
              >
                {entry.direction === "credit" ? "+" : "-"}
                {formatNaira(entry.amount)}
              </p>
            </div>
          ))}
        </RecentPanel>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 dark:text-slate-100">Wallet Balance Trend</h3>
            <span className="text-xs text-gray-400">Latest activity</span>
          </div>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              No trend data yet
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2 border-b border-l border-gray-100 dark:border-slate-800 px-2 pt-4">
              {trend.map((point, index) => (
                <div
                  key={`${point.label}-${index}`}
                  className="flex-1 flex flex-col items-center gap-2 min-w-0"
                >
                  <div className="w-full bg-blue-50 rounded-t-lg overflow-hidden flex items-end h-36">
                    <div
                      className="w-full bg-[#0066FF] rounded-t-lg"
                      style={{ height: `${Math.max(12, (point.value / maxTrend) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-4">
        <RecentPanel
          title="Recent Withdrawals"
          onViewAll={() => onGoToTab("Withdrawals")}
          loading={withdrawals.isPending}
          failed={withdrawals.isError}
          empty={recentWithdrawals.length === 0}
          emptyLabel="No withdrawals yet"
          subject="recent withdrawals"
        >
          {recentWithdrawals.map((item) => {
            const account = typeof item.bankAccountId === "object" ? item.bankAccountId : null;
            return (
              <div key={item._id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8EDF3] flex items-center justify-center">
                  <Building2 size={17} className="text-[#003366]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                    {formatNaira(item.amountToReceive || item.amount)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {account
                      ? `${account.bankName} · ${maskAccountNumber(account.accountNumber)}`
                      : item.reference}
                  </p>
                </div>
                <WithdrawalStatusBadge status={item.status} />
              </div>
            );
          })}
        </RecentPanel>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4">Withdrawals Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Total Withdrawn", formatNaira(summary.withdrawnBalance), "text-[#003366]"],
              ["Successful", formatNaira(sumOf(succeeded)), "text-green-600"],
              ["Pending", formatNaira(summary.pendingBalance), "text-orange-600"],
              ["Failed/Cancelled", formatNaira(sumOf(unsuccessful)), "text-red-500"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-gray-100 dark:border-slate-800 p-4">
                <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
                <p className={`mt-2 text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Wallet Status</p>
              <p className="font-bold text-gray-800 dark:text-slate-100 capitalize mt-1">{summary.status}</p>
            </div>
            <LedgerStatusBadge status={summary.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentPanelProps {
  title: string;
  onViewAll: () => void;
  loading: boolean;
  failed: boolean;
  empty: boolean;
  emptyLabel: string;
  /** What the panel was loading, used in the failure line. */
  subject: string;
  children: React.ReactNode;
}

/**
 * The card the two "recent" lists share, including their loading, failed and
 * empty lines — a failed panel says so rather than spinning forever.
 *
 * @param props - Panel copy, its three states and the rows to render.
 * @returns The panel.
 */
function RecentPanel({
  title,
  onViewAll,
  loading,
  failed,
  empty,
  emptyLabel,
  subject,
  children,
}: RecentPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
        <h3 className="font-bold text-gray-800 dark:text-slate-100">{title}</h3>
        <button type="button" onClick={onViewAll} className="text-sm font-semibold text-[#003366]">
          View All
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Loading…</p>
        ) : failed ? (
          <p className="px-5 py-8 text-center text-sm text-red-500">
            Couldn&apos;t load {subject}.
          </p>
        ) : empty ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
