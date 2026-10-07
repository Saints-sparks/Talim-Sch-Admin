"use client";

import { CheckCircle, Clock, CreditCard, Shield, TrendingUp, XCircle } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import { StatCard } from "@/components/finance/StatCard";
import { StatCardsSkeleton } from "@/components/finance/FinanceSkeletons";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { formatNaira } from "@/components/finance/formatters";
import { usePaymentsSummary } from "@/hooks/finance/usePaymentsQueries";
import { StatGrid, StatTile } from "@/components/tl";

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
    <StatGrid label="Payment totals">
      <StatCard
        label="Total Collected"
        value={formatNaira(totalPaid)}
        icon={TrendingUp}
        color="text-tl-success"
      />
      <StatCard label="Total Transactions" value={String(totalTransactions)} icon={CreditCard} />
      <StatCard
        label="Successful"
        value={String(successful)}
        sub="payments completed"
        icon={CheckCircle}
        color="text-tl-success"
      />
      <StatCard label="Pending" value={String(totalPending)} icon={Clock} color="text-tl-warning" />
      <StatCard label="Failed" value={String(totalFailed)} icon={XCircle} color="text-tl-danger" />
      <StatTile label="Currency" value={currency || "NGN"} icon={<Shield />} />
    </StatGrid>
  );
}
