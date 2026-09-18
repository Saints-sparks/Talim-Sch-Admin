"use client";

import { CheckCircle, Clock, CreditCard, Shield, TrendingUp, XCircle } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import { StatCard } from "@/components/finance/StatCard";
import { StatCardsSkeleton } from "@/components/finance/FinanceSkeletons";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { formatNaira } from "@/components/finance/formatters";
import { usePaymentsSummary } from "@/hooks/finance/usePaymentsQueries";

/**
 * Totals for the school's fee payments.
 *
 * The successful count is derived rather than fetched: the summary endpoint
 * returns total, pending and failed, so successful is what's left.
 *
 * @returns The payments overview tab.
 */
export function PaymentsOverviewTab() {
  const summary = usePaymentsSummary();

  if (summary.isPending) return <StatCardsSkeleton count={6} />;

  if (summary.isError || !summary.data) {
    const copy = describeFinanceError(summary.error, "payment totals");
    return (
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={copy.retryable ? () => void summary.refetch() : undefined}
      />
    );
  }

  const { totalTransactions, totalPaid, totalPending, totalFailed, currency } = summary.data;
  const successful = Math.max(0, totalTransactions - totalPending - totalFailed);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Total Collected"
        value={formatNaira(totalPaid)}
        icon={TrendingUp}
        color="text-green-600"
      />
      <StatCard
        label="Total Transactions"
        value={String(totalTransactions)}
        icon={CreditCard}
      />
      <StatCard
        label="Successful"
        value={String(successful)}
        sub="payments completed"
        icon={CheckCircle}
        color="text-green-600"
      />
      <StatCard
        label="Pending"
        value={String(totalPending)}
        icon={Clock}
        color="text-yellow-600"
      />
      <StatCard label="Failed" value={String(totalFailed)} icon={XCircle} color="text-red-500" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#E8EDF3] flex items-center justify-center shrink-0">
          <Shield size={20} className="text-[#003366]" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Currency</p>
          <p className="font-bold text-gray-800 dark:text-slate-100">{currency || "NGN"}</p>
        </div>
      </div>
    </div>
  );
}
