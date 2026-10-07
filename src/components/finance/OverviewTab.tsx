"use client";

import { ArrowDownCircle, ArrowUpCircle, Building2, Clock, Wallet } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ErrorState } from "@/components/StateComponents";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  EmptyNote,
  card,
  cardFrame,
  eyebrow,
  primaryButton,
  sectionTitle,
  skeletonBlock,
  textLink,
} from "@/components/tl";
import { Permission } from "@/lib/permissions";
import type {
  LedgerEntry,
  WalletSummary,
  WithdrawalRequest,
} from "@/app/services/finance.service";
import { useWalletTransactions, useWithdrawals } from "@/hooks/finance/useFinanceQueries";
import { WalletSourceNote } from "./WalletSourceNote";
import { LedgerStatusBadge, WithdrawalStatusBadge } from "./FinanceBadges";
import { StatCard } from "./StatCard";
import { StatCardsSkeleton } from "./FinanceSkeletons";
import { describeFinanceError } from "./financeErrors";
import { formatDate, formatNaira, maskAccountNumber } from "./formatters";
import type { FinanceTab } from "./tabs";

/** How many rows the two "recent" panels show. */
const RECENT_LIMIT = 5;

/** Props for {@link OverviewTab}. */
interface OverviewTabProps {
  /** The wallet query, so this tab shows the same object the page header does. */
  wallet: UseQueryResult<WalletSummary>;
  /** Opens the withdrawal flow. */
  onWithdraw: () => void;
  /** Switches the page to another tab ("View All"). */
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
 * @param props.wallet - The wallet query.
 * @param props.onWithdraw - Opens the withdrawal flow.
 * @param props.onGoToTab - Switches tab.
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
  /**
   * What a list of withdrawals adds up to (what was received, else asked).
   *
   * @param items - The withdrawals.
   * @returns The sum.
   */
  const sumOf = (items: WithdrawalRequest[]) =>
    items.reduce((total, item) => total + (item.amountToReceive || item.amount), 0);

  return (
    <div className="flex flex-col gap-[18px]">
      <WalletSourceNote />
      <div
        role="group"
        aria-label="Wallet figures"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="flex flex-col rounded-[18px] border border-tl-control bg-tl-select px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.05em] text-tl-brand">
              Wallet Balance
            </p>
            <Wallet size={18} className="text-tl-brand" aria-hidden />
          </div>
          <p className="mt-1.5 text-[28px] font-extrabold tracking-[-0.5px] text-tl-brand">
            {formatNaira(summary.availableBalance)}
          </p>
          <p className="mt-0.5 text-[13px] text-tl-body">Available for withdrawal</p>
          <PermissionGate permission={Permission.MANAGE_FINANCE}>
            <button type="button" onClick={onWithdraw} className={`${primaryButton} mt-3 w-full`}>
              <ArrowUpCircle size={16} aria-hidden /> Withdraw Funds
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
          color="text-tl-accent"
        />
        <StatCard
          label="Pending Withdrawals"
          value={formatNaira(summary.pendingBalance)}
          sub={`${pendingCount} pending request${pendingCount === 1 ? "" : "s"}`}
          icon={Clock}
          color="text-tl-warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[1fr_0.95fr]">
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
            <li key={entry._id} className="flex items-center gap-3 px-5 py-3">
              <span
                aria-hidden
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  entry.direction === "credit"
                    ? "bg-tl-success-bg text-tl-success"
                    : "bg-tl-danger-bg text-tl-danger"
                }`}
              >
                {entry.direction === "credit" ? (
                  <ArrowDownCircle size={18} />
                ) : (
                  <ArrowUpCircle size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-tl-ink">
                  {entry.description || entry.reference}
                </p>
                <p className="text-[13px] text-tl-muted">{formatDate(entry.createdAt)}</p>
              </div>
              <p
                className={`whitespace-nowrap text-sm font-extrabold ${
                  entry.direction === "credit" ? "text-tl-success" : "text-tl-danger"
                }`}
              >
                {entry.direction === "credit" ? "+" : "-"}
                {formatNaira(entry.amount)}
              </p>
            </li>
          ))}
        </RecentPanel>

        <section className={card}>
          <div className="mb-5 flex items-center justify-between gap-2">
            <h3 className={sectionTitle}>Wallet Balance Trend</h3>
            <span className="text-[13px] text-tl-muted">Latest activity</span>
          </div>
          {trend.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-tl-muted">
              No trend data yet
            </div>
          ) : (
            <div className="flex h-48 items-end gap-2 border-b border-l border-tl-line px-2 pt-4">
              {trend.map((point, index) => (
                <div
                  key={`${point.label}-${index}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-36 w-full items-end overflow-hidden rounded-t-lg bg-tl-select">
                    <div
                      className="w-full rounded-t-lg bg-tl-link"
                      style={{ height: `${Math.max(12, (point.value / maxTrend) * 100)}%` }}
                    />
                  </div>
                  <span className="w-full truncate text-center text-[11px] text-tl-muted">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[1fr_0.95fr]">
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
              <li key={item._id} className="flex items-center gap-3 px-5 py-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tl-select text-tl-brand"
                >
                  <Building2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-tl-ink">
                    {formatNaira(item.amountToReceive || item.amount)}
                  </p>
                  <p className="truncate text-[13px] text-tl-muted">
                    {account
                      ? `${account.bankName} · ${maskAccountNumber(account.accountNumber)}`
                      : item.reference}
                  </p>
                </div>
                <WithdrawalStatusBadge status={item.status} />
              </li>
            );
          })}
        </RecentPanel>

        <section className={card}>
          <h3 className={`${sectionTitle} mb-4`}>Withdrawals Summary</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["Total Withdrawn", formatNaira(summary.withdrawnBalance), "text-tl-brand"],
              ["Successful", formatNaira(sumOf(succeeded)), "text-tl-success"],
              ["Pending", formatNaira(summary.pendingBalance), "text-tl-warning"],
              ["Failed/Cancelled", formatNaira(sumOf(unsuccessful)), "text-tl-danger"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-2xl border border-tl-line-soft bg-tl-subtle px-4 py-3"
              >
                <p className={eyebrow}>{label}</p>
                <p className={`mt-1.5 text-lg font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-tl-line-soft px-4 py-3">
            <div>
              <p className={eyebrow}>Wallet Status</p>
              <p className="mt-1 font-extrabold capitalize text-tl-ink">{summary.status}</p>
            </div>
            <LedgerStatusBadge status={summary.status} />
          </div>
        </section>
      </div>
    </div>
  );
}

/** Props for {@link RecentPanel}. */
interface RecentPanelProps {
  /** The panel's heading. */
  title: string;
  /** Opens the full list. */
  onViewAll: () => void;
  /** True while the list loads. */
  loading: boolean;
  /** True when the list failed to load. */
  failed: boolean;
  /** True when it loaded with nothing. */
  empty: boolean;
  /** The empty-state line ("No transactions yet"). */
  emptyLabel: string;
  /** What the panel was loading, used in the failure line. */
  subject: string;
  /** The rows (`li` elements). */
  children: React.ReactNode;
}

/**
 * The card the two "recent" lists share, including their loading, failed and
 * empty states — a failed panel says so rather than spinning forever.
 *
 * @param props - Panel copy, its three states and the rows to render.
 * @param props.title - The heading.
 * @param props.onViewAll - Opens the full list.
 * @param props.loading - Whether it is loading.
 * @param props.failed - Whether it failed.
 * @param props.empty - Whether it is empty.
 * @param props.emptyLabel - The empty line.
 * @param props.subject - What it loads.
 * @param props.children - The rows.
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
    <section className={cardFrame}>
      <div className="flex items-center justify-between gap-3 border-b border-tl-line-soft px-5 py-2">
        <h3 className={sectionTitle}>{title}</h3>
        <button type="button" onClick={onViewAll} className={textLink}>
          View All
        </button>
      </div>
      {loading ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3 px-5 py-4">
          <span className="sr-only">Loading {subject}</span>
          {[0, 1, 2].map((row) => (
            <div key={row} aria-hidden className={`${skeletonBlock} h-10 rounded-xl`} />
          ))}
        </div>
      ) : failed ? (
        <p role="alert" className="px-5 py-8 text-center text-sm font-semibold text-tl-danger">
          Couldn&apos;t load {subject}.
        </p>
      ) : empty ? (
        <EmptyNote compact title={emptyLabel} />
      ) : (
        <ul className="divide-y divide-tl-line-soft">{children}</ul>
      )}
    </section>
  );
}
