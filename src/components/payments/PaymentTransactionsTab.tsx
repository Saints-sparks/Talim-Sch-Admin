"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PaymentStatus | "");
              setPage(1);
            }}
            aria-label="Filter by payment status"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 capitalize focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
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
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
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
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw
              size={15}
              className={query.isFetching ? "animate-spin text-[#003366]" : "text-gray-500"}
            />
          </button>
        </div>
        <p className="text-xs text-gray-400">{total} transactions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {query.isPending ? (
                <TableSkeleton columns={COLUMNS.length} />
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400">
                    {status || provider
                      ? "No transactions match these filters"
                      : "No transactions found"}
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {transaction.internalReference}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {PROVIDER_LABELS[transaction.providerName] ?? transaction.providerName}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatNaira(transaction.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {formatNaira(transaction.schoolAmount)}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">
                      {transaction.paymentChannel?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={transaction.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(transaction.paidAt || transaction.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
