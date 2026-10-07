"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import {
  EmptyNote,
  cardFrame,
  iconButton,
  selectControl,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tr,
} from "@/components/tl";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/finance/FinanceSkeletons";
import { TablePager } from "@/components/finance/TablePager";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { formatDate, formatNaira } from "@/components/finance/formatters";
import type { PaymentProviderName, PaymentStatus } from "@/app/services/payments.service";
import { PAYMENTS_PAGE_SIZE, usePaymentTransactions } from "@/hooks/finance/usePaymentsQueries";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PROVIDER_LABELS } from "./tabs";

/** Payment states, matching `PaymentStatus` on the server. */
const STATUS_OPTIONS: PaymentStatus[] = [
  "pending",
  "successful",
  "failed",
  "cancelled",
  "refunded",
  "partial",
];

/** Providers, matching `PaymentProviderName` on the server. */
const PROVIDER_OPTIONS: PaymentProviderName[] = ["paystack", "opay", "stripe"];

/** The table's column headings. */
const COLUMNS = [
  "Reference",
  "Provider",
  "Amount",
  "School Earns",
  "Channel",
  "Status",
  "Date",
];

/**
 * The school's fee transactions, filtered by status and provider and paged on
 * the server.
 *
 * @returns The transactions tab.
 */
export function PaymentTransactionsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [provider, setProvider] = useState<PaymentProviderName | "">("");

  const query = usePaymentTransactions({
    page,
    limit: PAYMENTS_PAGE_SIZE,
    status: status || undefined,
    providerName: provider || undefined,
  });

  const transactions = query.data?.data ?? [];
  const total = query.data?.pagination?.total ?? query.data?.total ?? 0;

  if (query.isError) {
    const copy = describeFinanceError(query.error, "payment transactions");
    return (
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={copy.retryable ? () => void query.refetch() : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PaymentStatus | "");
              setPage(1);
            }}
            aria-label="Filter by payment status"
            className={cn(selectControl, "capitalize")}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} className="capitalize">
                {option}
              </option>
            ))}
          </select>
          <select
            value={provider}
            onChange={(event) => {
              setProvider(event.target.value as PaymentProviderName | "");
              setPage(1);
            }}
            aria-label="Filter by payment provider"
            className={selectControl}
          >
            <option value="">All Providers</option>
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PROVIDER_LABELS[option] ?? option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void query.refetch()}
            aria-label="Refresh transactions"
            className={`${iconButton} border border-tl-control bg-tl-surface`}
          >
            <RefreshCw
              size={16}
              aria-hidden
              className={query.isFetching ? "animate-spin text-tl-brand" : undefined}
            />
          </button>
        </div>
        <p className="text-[13px] font-semibold text-tl-muted">{total} transactions</p>
      </div>

      <div className={cardFrame}>
        {!query.isPending && transactions.length === 0 ? (
          <EmptyNote
            title={
              status || provider ? "No transactions match these filters" : "No transactions found"
            }
          />
        ) : (
          <div className={tableScroll}>
            <table className={cn(table, "min-w-[860px]")}>
              <thead>
                <tr className={theadRow}>
                  {COLUMNS.map((column) => (
                    <th key={column} className={th}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody aria-busy={query.isPending || undefined}>
                {query.isPending ? (
                  <TableSkeleton columns={COLUMNS.length} />
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className={tr}>
                      <td className={cn(td, "font-mono text-xs text-tl-muted")}>
                        {transaction.internalReference}
                      </td>
                      <td className={td}>
                        {PROVIDER_LABELS[transaction.providerName] ?? transaction.providerName}
                      </td>
                      <td className={cn(td, "whitespace-nowrap font-extrabold text-tl-ink")}>
                        {formatNaira(transaction.totalAmount)}
                      </td>
                      <td className={cn(td, "whitespace-nowrap font-bold text-tl-success")}>
                        {formatNaira(transaction.schoolAmount)}
                      </td>
                      <td className={cn(td, "capitalize")}>
                        {transaction.paymentChannel?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className={td}>
                        <PaymentStatusBadge status={transaction.status} />
                      </td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        {formatDate(transaction.paidAt || transaction.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TablePager
        page={page}
        pageSize={PAYMENTS_PAGE_SIZE}
        total={total}
        busy={query.isFetching}
        onChange={setPage}
      />
    </div>
  );
}
