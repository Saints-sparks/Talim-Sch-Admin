"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import {
  EmptyNote,
  Page,
  PageHeader,
  cardFrame,
  dangerGhostButton,
  focusRing,
  iconButton,
  primaryButton,
  segment,
  segmentTrack,
  table,
  tableScroll,
  th,
  theadRow,
  tr,
} from "@/components/tl";
import { cn } from "@/lib/utils";
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

/** A header cell. */
const headCellClass = th;

/** A body cell: text sits at the top so a long reason doesn't push the row's others down. */
const cellClass = "px-4 py-3.5 text-sm text-tl-body align-top";

/** A compact action button inside a row. */
const rowActionSize = "min-h-[44px] rounded-[11px] px-3.5 py-2 text-[13px]";

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

  /**
   * Arrow keys, Home and End move between the tabs.
   *
   * @param event - The key press.
   * @param index - The tab it was on.
   */
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
      className={cn(segmentTrack, "w-fit flex-nowrap overflow-x-auto")}
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
            className={segment(selected)}
          >
            {BANK_TRANSFER_TAB_LABELS[status]}
            {status === "pending" && pendingCount !== undefined && pendingCount > 0 && (
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tl-warning-bg px-1.5 text-xs font-extrabold text-tl-warning">
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
    <tr className={tr}>
      <td className={cellClass}>{transfer.parent?.name || "—"}</td>
      <td className={cellClass}>
        <span className="block font-bold text-tl-ink">{transfer.child?.name || "—"}</span>
        {transfer.child?.admissionNumber && (
          <span className="block text-[13px] text-tl-muted">
            {transfer.child.admissionNumber}
          </span>
        )}
      </td>
      <td className={cellClass}>{transferClassName(transfer)}</td>
      <td className={cn(cellClass, "whitespace-nowrap font-extrabold tabular-nums text-tl-ink")}>
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
            className={`inline-flex min-h-[44px] items-center gap-1 rounded-md font-bold text-tl-link underline underline-offset-2 ${focusRing}`}
          >
            View proof
            <ExternalLink size={12} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span className="text-tl-muted">None</span>
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
              className={cn(primaryButton, rowActionSize)}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={onReject}
              aria-label={`Reject transfer from ${who}`}
              className={dangerGhostButton}
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
          <td className={cn(cellClass, "max-w-xs")}>{transfer.rejectionReason || "—"}</td>
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

  /**
   * Shows another status's list, from its first page.
   *
   * @param next - The status.
   */
  const changeStatus = (next: BankTransferStatus) => {
    setStatus(next);
    setPage(1);
  };

  /** Confirms the open transfer and reports the receipt. */
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

  /**
   * Rejects the open transfer with the parent-facing reason.
   *
   * @param reason - The trimmed reason.
   */
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
    <Page>
      <Link
        href="/fees-management"
        className={`-mb-2 inline-flex min-h-[44px] w-fit items-center gap-1.5 rounded-md text-sm font-bold text-tl-link hover:underline ${focusRing}`}
      >
        <ArrowLeft size={15} aria-hidden /> Fees Management
      </Link>

      <PageHeader
        title="Bank transfers"
        subtitle={
          <span className="block max-w-2xl">
            Transfers parents reported to the school&apos;s account. Confirm one once the money has
            arrived: the fee balances update and the parent gets a receipt.
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => void query.refetch()}
            aria-label="Refresh bank transfers"
            className={`${iconButton} border border-tl-control bg-tl-surface`}
          >
            <RefreshCw
              size={17}
              aria-hidden
              className={query.isFetching ? "animate-spin text-tl-brand" : undefined}
            />
          </button>
        }
      />

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
        className="flex flex-col gap-[18px]"
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
        ) : !query.isPending && transfers.length === 0 ? (
          <div className={cardFrame}>
            <EmptyNote title={BANK_TRANSFER_EMPTY_COPY[status]} />
          </div>
        ) : (
          <div className={cardFrame}>
            <div className={tableScroll}>
              <table className={cn(table, "min-w-[960px]")}>
                <caption className="sr-only">
                  {BANK_TRANSFER_TAB_LABELS[status]} bank transfers
                </caption>
                <thead>
                  <tr className={theadRow}>
                    {columns.map((column) => (
                      <th key={column} scope="col" className={headCellClass}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody aria-busy={query.isPending || undefined}>
                  {query.isPending ? (
                    <TableSkeleton columns={columns.length} rows={4} />
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
    </Page>
  );
}
