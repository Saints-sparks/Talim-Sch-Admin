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

/** The table's column headings. */
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
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as WalletEntryType | "");
              setPage(1);
            }}
            aria-label="Filter by transaction type"
            className={selectControl}
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
        {!query.isPending && entries.length === 0 ? (
          <EmptyNote title={type ? "No transactions of this type" : "No transactions found"} />
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
                  entries.map((entry) => (
                    <tr key={entry._id} className={tr}>
                      <td className={cn(td, "whitespace-nowrap")}>{formatDate(entry.createdAt)}</td>
                      <td className={td}>
                        <LedgerStatusBadge status={entry.direction} />
                      </td>
                      <td className={cn(td, "max-w-[220px] truncate")}>{entry.description}</td>
                      <td className={cn(td, "font-mono text-xs text-tl-muted")}>
                        {entry.reference}
                      </td>
                      <td
                        className={cn(
                          td,
                          "whitespace-nowrap font-extrabold",
                          entry.direction === "credit" ? "text-tl-success" : "text-tl-danger"
                        )}
                      >
                        {entry.direction === "credit" ? "+" : "-"}
                        {formatNaira(entry.amount)}
                      </td>
                      <td className={cn(td, "whitespace-nowrap font-bold text-tl-ink")}>
                        {formatNaira(entry.balanceAfter)}
                      </td>
                      <td className={td}>
                        <LedgerStatusBadge status={entry.status} />
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
        pageSize={FINANCE_PAGE_SIZE}
        total={total}
        busy={query.isFetching}
        onChange={setPage}
      />
    </div>
  );
}
