"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import { TableSkeleton } from "@/components/finance/FinanceSkeletons";
import { TablePager } from "@/components/finance/TablePager";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { formatCalendarDate, formatDateTime, formatNaira } from "@/components/finance/formatters";
import { logger } from "@/lib/logger";
import {
  BANK_TRANSFER_STATUSES,
  type AdminBankTransfer,
  type BankTransferStatus,
} from "@/app/services/payments.service";
import {
  BANK_TRANSFERS_PAGE_SIZE,
  useBankTransfers,
  useConfirmBankTransfer,
  usePendingBankTransferCount,
  useRejectBankTransfer,
} from "@/hooks/finance/useBankTransfers";
import { ConfirmBankTransferDialog, RejectBankTransferDialog } from "./BankTransferDialogs";
import {
  BANK_TRANSFER_EMPTY_COPY,
  BANK_TRANSFER_TAB_LABELS,
  bankTransferActionMessage,
  safeProofUrl,
  transferClassName,
} from "./bankTransfers.model";

/** Columns every status shows, before its own last column(s). */
const COMMON_COLUMNS = [
  "Parent",
  "Child",
  "Class",
  "Amount",
  "Transfer reference",
  "Paid on",
  "Proof",
  "Submitted",
] as const;

/** The status-specific columns. */
const STATUS_COLUMNS: Record<BankTransferStatus, readonly string[]> = {
  pending: ["Actions"],
  confirmed: ["Confirmed"],
  rejected: ["Rejected", "Reason"],
};

const headCellClass =
  "text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300 whitespace-nowrap";
const cellClass = "px-4 py-3 text-sm text-gray-800 dark:text-slate-200 align-top";

/** Which decision dialog is open, and for which transfer. */
type OpenDialog = { kind: "confirm" | "reject"; transfer: AdminBankTransfer } | null;

/**
 * The status tabs. Arrow keys move between them, as the ARIA tabs pattern
 * expects; the pending tab carries the waiting count.
 *
 * @param props - The active status, the change handler and the panel id.
 * @param props.active - The selected status.
 * @param props.onChange - Selects a status.
 * @param props.panelId - The id of the panel the tabs control.
 * @param props.pendingCount - Transfers waiting, when known.
 * @returns The tab list.
 */
function StatusTabs({
  active,
  onChange,
  panelId,
  pendingCount,
}: {
  active: BankTransferStatus;
  onChange: (status: BankTransferStatus) => void;
  panelId: string;
  pendingCount?: number;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = BANK_TRANSFER_STATUSES.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    onChange(BANK_TRANSFER_STATUSES[next]);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Transfer status"
      className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 w-fit max-w-full overflow-x-auto"
    >
      {BANK_TRANSFER_STATUSES.map((status, index) => {
        const selected = status === active;
        return (
          <button
            key={status}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${panelId}-tab-${status}`}
            aria-selected={selected}
            aria-controls={panelId}
            aria-label={
              status === "pending" && pendingCount
                ? `${BANK_TRANSFER_TAB_LABELS[status]}, ${pendingCount} waiting`
                : undefined
            }
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(status)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              selected
                ? "bg-white dark:bg-slate-900 text-[#003366] dark:text-blue-300 shadow-sm"
                : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {BANK_TRANSFER_TAB_LABELS[status]}
            {status === "pending" && pendingCount !== undefined && pendingCount > 0 && (
              <span className="min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One transfer as a table row, with the cells its status needs.
 *
 * @param props - The transfer, its status and the decision openers.
 * @param props.transfer - The row.
 * @param props.status - Which list it is in.
 * @param props.onConfirm - Opens the confirm dialog.
 * @param props.onReject - Opens the reject dialog.
 * @returns The row.
 */
function TransferRow({
  transfer,
  status,
  onConfirm,
  onReject,
}: {
  transfer: AdminBankTransfer;
  status: BankTransferStatus;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const proof = safeProofUrl(transfer.proofUrl);
  const who = `${transfer.parent?.name || "parent"} for ${transfer.child?.name || "child"}`;
  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
      <td className={cellClass}>{transfer.parent?.name || "—"}</td>
      <td className={cellClass}>
        <span className="block font-medium text-gray-900 dark:text-slate-100">
          {transfer.child?.name || "—"}
        </span>
        {transfer.child?.admissionNumber && (
          <span className="block text-xs text-gray-500 dark:text-slate-400">
            {transfer.child.admissionNumber}
          </span>
        )}
      </td>
      <td className={cellClass}>{transferClassName(transfer)}</td>
      <td className={`${cellClass} font-semibold tabular-nums whitespace-nowrap`}>
        {formatNaira(transfer.amount)}
      </td>
      <td className={`${cellClass} font-mono text-xs break-all`}>
        {transfer.transferReference || "—"}
      </td>
      <td className={`${cellClass} whitespace-nowrap`}>{formatCalendarDate(transfer.paidOn)}</td>
      <td className={cellClass}>
        {proof ? (
          <a
            href={proof}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#003366] dark:text-blue-300 underline underline-offset-2"
          >
            View proof
            <ExternalLink size={12} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span className="text-gray-500 dark:text-slate-400">None</span>
        )}
      </td>
      <td className={`${cellClass} whitespace-nowrap`}>{formatDateTime(transfer.submittedAt)}</td>
      {status === "pending" && (
        <td className={cellClass}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              aria-label={`Confirm transfer from ${who}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#003366] hover:bg-[#003366]/90"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={onReject}
              aria-label={`Reject transfer from ${who}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Reject
            </button>
          </div>
        </td>
      )}
      {status === "confirmed" && (
        <td className={`${cellClass} whitespace-nowrap`}>{formatDateTime(transfer.reviewedAt)}</td>
      )}
      {status === "rejected" && (
        <>
          <td className={`${cellClass} whitespace-nowrap`}>
            {formatDateTime(transfer.reviewedAt)}
          </td>
          <td className={`${cellClass} max-w-xs`}>{transfer.rejectionReason || "—"}</td>
        </>
      )}
    </tr>
  );
}

/**
 * Bank-transfer reconciliation (C4): the transfers parents reported, by
 * status. A pending transfer is confirmed once the money is in the school's
 * account (the dialog previews how it is applied to the fees), or rejected
 * with a reason the parent sees.
 *
 * The page that renders this is behind `manage:fees`, the permission the
 * routes require.
 *
 * @returns The reconciliation screen.
 */
export function BankTransfersScreen() {
  const [status, setStatus] = useState<BankTransferStatus>("pending");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const panelId = useId();

  const query = useBankTransfers({ status, page, limit: BANK_TRANSFERS_PAGE_SIZE });
  const pendingCount = usePendingBankTransferCount();
  const confirm = useConfirmBankTransfer();
  const reject = useRejectBankTransfer();

  const transfers = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const columns = [...COMMON_COLUMNS, ...STATUS_COLUMNS[status]];

  const changeStatus = (next: BankTransferStatus) => {
    setStatus(next);
    setPage(1);
  };

  const runConfirm = async () => {
    if (dialog?.kind !== "confirm" || confirm.isPending) return;
    try {
      const result = await confirm.mutateAsync(dialog.transfer.id);
      const receipt = result.receipt?.receiptNumber;
      toast.success(
        receipt
          ? `Transfer confirmed. Receipt ${receipt} issued and the parent told.`
          : "Transfer confirmed and the parent told."
      );
      setDialog(null);
    } catch (error) {
      logger.error("payments/bank-transfers", "confirm failed", error);
      toast.error(bankTransferActionMessage(error, "confirm"));
      setDialog(null);
    }
  };

  const runReject = async (reason: string) => {
    if (dialog?.kind !== "reject" || reject.isPending) return;
    try {
      await reject.mutateAsync({ transactionId: dialog.transfer.id, reason });
      toast.success("Transfer rejected. The parent has been told why.");
      setDialog(null);
    } catch (error) {
      logger.error("payments/bank-transfers", "reject failed", error);
      toast.error(bankTransferActionMessage(error, "reject"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/fees-management"
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-slate-300 hover:text-[#003366] dark:hover:text-blue-300 mb-2"
            >
              <ArrowLeft size={14} aria-hidden /> Fees Management
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bank transfers</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5 max-w-2xl">
              Transfers parents reported to the school&apos;s account. Confirm one once the money
              has arrived: the fee balances update and the parent gets a receipt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void query.refetch()}
            aria-label="Refresh bank transfers"
            className="p-2 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
              aria-hidden
              className={
                query.isFetching
                  ? "animate-spin text-[#003366] dark:text-blue-300"
                  : "text-gray-600 dark:text-slate-300"
              }
            />
          </button>
        </div>

        <StatusTabs
          active={status}
          onChange={changeStatus}
          panelId={panelId}
          pendingCount={pendingCount}
        />

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${panelId}-tab-${status}`}
          className="space-y-4"
        >
          {query.isError ? (
            (() => {
              const copy = describeFinanceError(query.error, "bank transfers");
              return (
                <ErrorState
                  title={copy.title}
                  message={copy.message}
                  onRetry={copy.retryable ? () => void query.refetch() : undefined}
                />
              );
            })()
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <caption className="sr-only">
                  {BANK_TRANSFER_TAB_LABELS[status]} bank transfers
                </caption>
                <thead className="bg-gray-50 dark:bg-slate-800/60">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} scope="col" className={headCellClass}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {query.isPending ? (
                    <TableSkeleton columns={columns.length} rows={4} />
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-12 text-center text-sm text-gray-600 dark:text-slate-400"
                      >
                        {BANK_TRANSFER_EMPTY_COPY[status]}
                      </td>
                    </tr>
                  ) : (
                    transfers.map((transfer) => (
                      <TransferRow
                        key={transfer.id}
                        transfer={transfer}
                        status={status}
                        onConfirm={() => setDialog({ kind: "confirm", transfer })}
                        onReject={() => setDialog({ kind: "reject", transfer })}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <TablePager
            page={page}
            pageSize={BANK_TRANSFERS_PAGE_SIZE}
            total={total}
            busy={query.isFetching}
            onChange={setPage}
          />
        </div>
      </div>

      {dialog?.kind === "confirm" && (
        <ConfirmBankTransferDialog
          transfer={dialog.transfer}
          busy={confirm.isPending}
          onConfirm={() => void runConfirm()}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "reject" && (
        <RejectBankTransferDialog
          transfer={dialog.transfer}
          busy={reject.isPending}
          onReject={(reason) => void runReject(reason)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
