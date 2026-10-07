"use client";

import { useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import {
  EmptyNote,
  cardFrame,
  eyebrow,
  iconButton,
  rowButton,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tr,
} from "@/components/tl";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/finance/ModalShell";
import { TableSkeleton } from "@/components/finance/FinanceSkeletons";
import { TablePager } from "@/components/finance/TablePager";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { formatDate, formatNaira } from "@/components/finance/formatters";
import type { Receipt } from "@/app/services/payments.service";
import { PAYMENTS_PAGE_SIZE, usePaymentReceipts } from "@/hooks/finance/usePaymentsQueries";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PROVIDER_LABELS } from "./tabs";

/** The table's column headings. */
const COLUMNS = ["Receipt #", "Total Paid", "Payment Method", "Date", "Status", "Actions"];

/**
 * The school's receipts, with a detail view for one.
 *
 * @returns The receipts tab.
 */
export function ReceiptsTab() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Receipt | null>(null);

  const query = usePaymentReceipts({ page, limit: PAYMENTS_PAGE_SIZE });
  const receipts = query.data?.data ?? [];
  const total = query.data?.pagination?.total ?? query.data?.total ?? 0;

  if (query.isError) {
    const copy = describeFinanceError(query.error, "receipts");
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-tl-muted">
          {total} receipt{total === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          aria-label="Refresh receipts"
          className={`${iconButton} border border-tl-control bg-tl-surface`}
        >
          <RefreshCw
            size={16}
            aria-hidden
            className={query.isFetching ? "animate-spin text-tl-brand" : undefined}
          />
        </button>
      </div>

      <div className={cardFrame}>
        {!query.isPending && receipts.length === 0 ? (
          <EmptyNote title="No receipts found" />
        ) : (
          <div className={tableScroll}>
            <table className={cn(table, "min-w-[720px]")}>
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
                  receipts.map((receipt) => (
                    <tr key={receipt._id} className={tr}>
                      <td className={cn(td, "font-mono text-xs font-bold text-tl-brand")}>
                        {receipt.receiptNumber}
                      </td>
                      <td className={cn(td, "whitespace-nowrap font-extrabold text-tl-ink")}>
                        {formatNaira(receipt.totalPaid)}
                      </td>
                      <td className={cn(td, "capitalize")}>
                        {receipt.paymentMethod?.replace(/_/g, " ")}
                      </td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        {formatDate(receipt.paymentDate)}
                      </td>
                      <td className={td}>
                        <PaymentStatusBadge status={receipt.status} />
                      </td>
                      <td className={cn(td, "py-1.5")}>
                        <button
                          type="button"
                          onClick={() => setSelected(receipt)}
                          className={rowButton}
                        >
                          <Eye size={14} aria-hidden /> View
                        </button>
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

      {selected && <ReceiptDetail receipt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/**
 * One receipt in full: its fee lines, the totals and the verification code a
 * parent can quote.
 *
 * @param props - The receipt and the close handler.
 * @param props.receipt - The receipt.
 * @param props.onClose - Closes it.
 * @returns The receipt detail modal.
 */
function ReceiptDetail({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <ModalShell title={`Receipt ${receipt.receiptNumber}`} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex flex-col gap-4 px-[clamp(20px,3vw,28px)] py-5">
        <p className="text-sm text-tl-muted">{formatDate(receipt.paymentDate)}</p>

        <dl className="flex flex-col gap-2 rounded-2xl border border-tl-line-soft bg-tl-subtle px-4 py-3">
          {receipt.feeItems.map((item, index) => (
            <div key={`${item.feeName}-${index}`} className="flex justify-between gap-3 text-sm">
              <dt className="text-tl-body">{item.feeName}</dt>
              <dd className="font-bold text-tl-ink">{formatNaira(item.amount)}</dd>
            </div>
          ))}
          {receipt.lateFee > 0 && (
            <div className="flex justify-between text-sm font-semibold text-tl-warning">
              <dt>Late Fee</dt>
              <dd>{formatNaira(receipt.lateFee)}</dd>
            </div>
          )}
          {receipt.discount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-tl-success">
              <dt>Discount</dt>
              <dd>-{formatNaira(receipt.discount)}</dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-tl-line pt-2 font-extrabold text-tl-brand">
            <dt>Total Paid</dt>
            <dd>{formatNaira(receipt.totalPaid)}</dd>
          </div>
        </dl>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className={`${eyebrow} mb-1`}>Payment Method</dt>
            <dd className="font-bold capitalize text-tl-ink">
              {receipt.paymentMethod?.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className={`${eyebrow} mb-1`}>Provider</dt>
            <dd className="font-bold text-tl-ink">
              {PROVIDER_LABELS[receipt.paymentProvider] ?? receipt.paymentProvider}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className={`${eyebrow} mb-1`}>Reference</dt>
            <dd className="break-all font-mono text-xs text-tl-body">
              {receipt.transactionReference}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className={`${eyebrow} mb-1`}>Verification</dt>
            <dd className="break-all font-mono text-xs text-tl-body">{receipt.verificationCode}</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-3 pt-1">
          <PaymentStatusBadge status={receipt.status} />
          <p className="text-[13px] text-tl-muted">Issued {formatDate(receipt.issuedAt)}</p>
        </div>
      </div>
    </ModalShell>
  );
}
