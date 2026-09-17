"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import type { WalletEntryType } from "@/app/services/finance.service";
import { useWalletTransactions } from "@/hooks/finance/useFinanceQueries";
import { LedgerStatusBadge } from "./FinanceBadges";
import { TableSkeleton } from "./FinanceSkeletons";
import { TablePager } from "./TablePager";
import { describeFinanceError } from "./financeErrors";
import { formatDate, formatNaira } from "./formatters";
import { FINANCE_PAGE_SIZE } from "./tabs";

/** Ledger entry types the filter offers, matching `WalletEntryType` on the server. */
const TYPE_FILTERS: { value: WalletEntryType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "credit_payment", label: "Credit Payment" },
  { value: "debit_withdrawal", label: "Debit Withdrawal" },
  { value: "withdrawal_reversal", label: "Withdrawal Reversal" },
  { value: "platform_fee", label: "Platform Fee" },
  { value: "refund", label: "Refund" },
  { value: "manual_adjustment", label: "Manual Adjustment" },
];

const COLUMNS = ["Date", "Type", "Description", "Reference", "Amount", "Balance After", "Status"];

/**
 * The wallet ledger, filtered by entry type and paged on the server.
 *
 * @returns The transactions tab.
 */
export function TransactionsTab() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<WalletEntryType | "">("");

  const query = useWalletTransactions({
    page,
    limit: FINANCE_PAGE_SIZE,
    type: type || undefined,
  });

  const entries = query.data?.data ?? [];
  const total = query.data?.pagination?.total ?? 0;

  if (query.isError) {
    const copy = describeFinanceError(query.error, "the wallet ledger");
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
        <div className="flex items-center gap-3">
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as WalletEntryType | "");
              setPage(1);
            }}
            aria-label="Filter by transaction type"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
          >
            {TYPE_FILTERS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
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
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400">
                    {type ? "No transactions of this type" : "No transactions found"}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <LedgerStatusBadge status={entry.direction} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{entry.reference}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        entry.direction === "credit" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {entry.direction === "credit" ? "+" : "-"}
                      {formatNaira(entry.amount)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#003366]">
                      {formatNaira(entry.balanceAfter)}
                    </td>
                    <td className="px-4 py-3">
                      <LedgerStatusBadge status={entry.status} />
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
        pageSize={FINANCE_PAGE_SIZE}
        total={total}
        busy={query.isFetching}
        onChange={setPage}
      />
    </div>
  );
}
