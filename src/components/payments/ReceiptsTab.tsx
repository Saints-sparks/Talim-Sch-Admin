"use client";

import { useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import { ModalShell } from "@/components/finance/ModalShell";
import { TableSkeleton } from "@/components/finance/FinanceSkeletons";
import { TablePager } from "@/components/finance/TablePager";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { formatDate, formatNaira } from "@/components/finance/formatters";
import type { Receipt } from "@/app/services/payments.service";
import { PAYMENTS_PAGE_SIZE, usePaymentReceipts } from "@/hooks/finance/usePaymentsQueries";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PROVIDER_LABELS } from "./tabs";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} receipt{total === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          aria-label="Refresh receipts"
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <RefreshCw
            size={15}
            className={query.isFetching ? "animate-spin text-[#003366]" : "text-gray-500"}
          />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
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
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400">
                    No receipts found
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#003366]">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatNaira(receipt.totalPaid)}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {receipt.paymentMethod?.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(receipt.paymentDate)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={receipt.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(receipt)}
                        className="text-xs text-[#003366] hover:underline flex items-center gap-1"
                      >
                        <Eye size={13} /> View
                      </button>
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

      {selected && <ReceiptDetail receipt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/**
 * One receipt in full: its fee lines, the totals and the verification code a
 * parent can quote.
 *
 * @param props - The receipt and the close handler.
 * @returns The receipt detail modal.
 */
function ReceiptDetail({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <ModalShell title={`Receipt ${receipt.receiptNumber}`} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-400 -mt-2">{formatDate(receipt.paymentDate)}</p>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {receipt.feeItems.map((item, index) => (
            <div key={`${item.feeName}-${index}`} className="flex justify-between gap-3 text-sm">
              <span className="text-gray-600">{item.feeName}</span>
              <span className="font-medium text-gray-800">{formatNaira(item.amount)}</span>
            </div>
          ))}
          {receipt.lateFee > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Late Fee</span>
              <span>{formatNaira(receipt.lateFee)}</span>
            </div>
          )}
          {receipt.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatNaira(receipt.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#003366] border-t border-gray-200 pt-2 mt-2">
            <span>Total Paid</span>
            <span>{formatNaira(receipt.totalPaid)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Payment Method</p>
            <p className="font-medium capitalize text-gray-800">
              {receipt.paymentMethod?.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Provider</p>
            <p className="font-medium text-gray-800">
              {PROVIDER_LABELS[receipt.paymentProvider] ?? receipt.paymentProvider}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-400 text-xs mb-0.5">Reference</p>
            <p className="font-mono text-xs text-gray-700 break-all">
              {receipt.transactionReference}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-400 text-xs mb-0.5">Verification</p>
            <p className="font-mono text-xs text-gray-700 break-all">{receipt.verificationCode}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <PaymentStatusBadge status={receipt.status} />
          <p className="text-xs text-gray-400">Issued {formatDate(receipt.issuedAt)}</p>
        </div>
      </div>
    </ModalShell>
  );
}
