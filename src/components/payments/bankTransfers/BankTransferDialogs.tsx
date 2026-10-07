"use client";

import { useId, useRef, useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import { ModalShell } from "@/components/finance/ModalShell";
import { dangerButton, primaryButton, textareaControl } from "@/components/tl/styles";
import { formatCalendarDate, formatNaira } from "@/components/finance/formatters";
import type { AdminBankTransfer } from "@/app/services/payments.service";
import {
  REJECT_REASON_MAX,
  allocationPreview,
  transferClassName,
  validateRejectReason,
} from "./bankTransfers.model";

/** Neutral outlined button used by both dialogs. */
const cancelButtonClass =
  "flex-1 py-2.5 border border-tl-line rounded-xl text-sm text-tl-body hover:bg-tl-bg disabled:opacity-50";

/**
 * Who sent the transfer and for whom, as both dialogs show it.
 *
 * @param props - The transfer.
 * @param props.transfer - The transfer being decided.
 * @returns A short definition list.
 */
function TransferSummary({ transfer }: { transfer: AdminBankTransfer }) {
  const rows: Array<[string, string]> = [
    ["Parent", transfer.parent?.name || "—"],
    [
      "Child",
      `${transfer.child?.name || "—"}${transfer.child?.admissionNumber ? ` · ${transfer.child.admissionNumber}` : ""}`,
    ],
    ["Class", transferClassName(transfer)],
    ["Amount", formatNaira(transfer.amount)],
    ["Transfer reference", transfer.transferReference || "—"],
    ["Paid on", formatCalendarDate(transfer.paidOn)],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-tl-muted">{label}</dt>
          <dd className="text-tl-ink font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Props of {@link ConfirmBankTransferDialog}. */
export interface ConfirmBankTransferDialogProps {
  /** The pending transfer. */
  transfer: AdminBankTransfer;
  /** True while the confirm request is in flight. */
  busy: boolean;
  /** Sends the confirmation. */
  onConfirm: () => void;
  /** Closes without deciding. */
  onCancel: () => void;
}

/**
 * Confirms that a parent's transfer reached the school account. It shows the
 * allocation the server made by due date (what each fee receives), because
 * confirming writes exactly that to the fee ledger and issues a receipt.
 *
 * @param props - See {@link ConfirmBankTransferDialogProps}.
 * @returns The confirm dialog.
 */
export function ConfirmBankTransferDialog({
  transfer,
  busy,
  onConfirm,
  onCancel,
}: ConfirmBankTransferDialogProps) {
  const preview = allocationPreview(transfer);
  const captionId = useId();

  return (
    <ModalShell
      title="Confirm bank transfer"
      onClose={busy ? () => undefined : onCancel}
      maxWidthClass="max-w-lg"
    >
      <div className="p-6 space-y-5">
        <p className="text-sm text-tl-body">
          Confirm only once {formatNaira(transfer.amount)} is in the school&apos;s bank account.
        </p>

        <TransferSummary transfer={transfer} />

        <div>
          <h4 id={captionId} className="text-sm font-semibold text-tl-ink mb-2">
            How it will be applied
          </h4>
          {preview.lines.length === 0 ? (
            <p className="text-sm text-tl-muted">
              The server did not list the fees this transfer pays.
            </p>
          ) : (
            <table
              aria-labelledby={captionId}
              className="w-full text-sm border border-tl-line-soft rounded-xl overflow-hidden"
            >
              <thead className="bg-tl-subtle">
                <tr>
                  <th scope="col" className="text-left px-3 py-2 font-medium text-tl-muted">
                    Fee
                  </th>
                  <th scope="col" className="text-right px-3 py-2 font-medium text-tl-muted">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tl-line-soft">
                {preview.lines.map((line) => (
                  <tr key={line.feeAssignmentId}>
                    <td className="px-3 py-2 text-tl-ink">{line.label}</td>
                    <td className="px-3 py-2 text-right text-tl-ink tabular-nums">
                      {line.amount === null ? "—" : formatNaira(line.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-tl-line">
                  <th scope="row" className="text-left px-3 py-2 font-semibold text-tl-ink">
                    Total
                  </th>
                  <td className="px-3 py-2 text-right font-semibold text-tl-ink tabular-nums">
                    {formatNaira(preview.allocated)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
          {preview.unallocated > 0 && (
            <p className="mt-2 text-xs text-tl-warning flex items-start gap-1.5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
              {formatNaira(preview.unallocated)} of the transfer is not matched to a fee.
            </p>
          )}
        </div>

        <p className="text-xs text-tl-muted flex items-start gap-1.5 bg-tl-subtle rounded-lg px-3 py-2">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          Confirming updates these fee balances, issues a receipt and tells the parent. The money is
          already in your bank, so it is not added to the Talim wallet.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={cancelButtonClass}
            data-autofocus
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`${primaryButton} flex-1`}
          >
            {busy ? "Confirming…" : "Confirm transfer"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/** Props of {@link RejectBankTransferDialog}. */
export interface RejectBankTransferDialogProps {
  /** The pending transfer. */
  transfer: AdminBankTransfer;
  /** True while the reject request is in flight. */
  busy: boolean;
  /** Sends the rejection with a validated, trimmed reason. */
  onReject: (reason: string) => void;
  /** Closes without deciding. */
  onCancel: () => void;
}

/**
 * Rejects a transfer that never arrived. A reason is required (the parent
 * sees it): an empty one is caught here, announced and focused, and nothing
 * is sent.
 *
 * @param props - See {@link RejectBankTransferDialogProps}.
 * @returns The reject dialog.
 */
export function RejectBankTransferDialog({
  transfer,
  busy,
  onReject,
  onCancel,
}: RejectBankTransferDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const errorId = useId();
  const hintId = useId();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = validateRejectReason(reason);
    if (problem) {
      setError(problem);
      fieldRef.current?.focus();
      return;
    }
    onReject(reason.trim());
  };

  return (
    <ModalShell
      title="Reject bank transfer"
      onClose={busy ? () => undefined : onCancel}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={submit} noValidate className="p-6 space-y-5">
        <TransferSummary transfer={transfer} />

        <div>
          <label htmlFor={fieldId} className="block text-sm font-medium text-tl-ink mb-1">
            Reason <span aria-hidden="true">*</span>
          </label>
          <p id={hintId} className="text-xs text-tl-muted mb-2">
            The parent sees this, e.g. &quot;No transfer with this reference reached our
            account.&quot;
          </p>
          <textarea
            id={fieldId}
            ref={fieldRef}
            data-autofocus
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
            rows={3}
            maxLength={REJECT_REASON_MAX}
            required
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            disabled={busy}
            className={textareaControl}
          />
          {error && (
            <p id={errorId} role="alert" className="mt-1 text-xs text-tl-danger">
              {error}
            </p>
          )}
        </div>

        <p className="text-xs text-tl-muted">
          Rejecting releases the fees so the parent can pay them another way.
        </p>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className={cancelButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={`${dangerButton} flex-1`}>
            {busy ? "Rejecting…" : "Reject transfer"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
