"use client";

import { CheckCircle } from "lucide-react";
import type { ConfirmedWithdrawal } from "@/app/services/finance.service";
import { ghostButton, primaryButton } from "@/components/tl";
import { ModalShell } from "../ModalShell";
import { WithdrawalStatusBadge } from "../FinanceBadges";
import { formatDateTime, formatNaira } from "../formatters";

/** Props for {@link WithdrawalSuccessStep}. */
interface WithdrawalSuccessStepProps {
  /** The withdrawal the server created. */
  withdrawal: ConfirmedWithdrawal;
  /** Closes the flow. */
  onClose: () => void;
  /** Opens the Withdrawals tab. */
  onViewWithdrawals: () => void;
}

/**
 * Step 4: the receipt for a submitted withdrawal.
 *
 * Everything shown here comes from the confirm response, so the reference and
 * amounts are the server's record rather than the figures typed at step 1.
 *
 * @param props - The created withdrawal and the exit callbacks.
 * @param props.withdrawal - The withdrawal.
 * @param props.onClose - Closes the flow.
 * @param props.onViewWithdrawals - Opens the Withdrawals tab.
 * @returns The success step.
 */
export function WithdrawalSuccessStep({
  withdrawal,
  onClose,
  onViewWithdrawals,
}: WithdrawalSuccessStepProps) {
  const rows: [string, string][] = [
    ["Withdrawal Reference", withdrawal.reference],
    ["Requested Date", formatDateTime(withdrawal.requestedAt)],
    ["You Will Receive", formatNaira(withdrawal.amountToReceive)],
    ["Estimated Review Time", withdrawal.estimatedReviewTime],
  ];

  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center px-[clamp(20px,3vw,28px)] py-7 text-center">
        <span
          aria-hidden
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-tl-success-bg text-tl-success"
        >
          <CheckCircle size={38} />
        </span>

        <h3 className="mb-2 text-[21px] font-extrabold tracking-[-0.4px] text-tl-ink">
          Withdrawal Request Submitted!
        </h3>
        <p className="mb-5 text-sm text-tl-muted">
          Your withdrawal request of{" "}
          <span className="font-extrabold text-tl-brand">{formatNaira(withdrawal.amount)}</span>{" "}
          has been submitted successfully.
        </p>

        <WithdrawalStatusBadge status={withdrawal.status} />

        <p className="mb-6 mt-2 text-[13px] text-tl-muted">
          We will send you an email once your withdrawal request has been reviewed.
        </p>

        <dl className="mb-6 flex w-full flex-col gap-2 rounded-2xl border border-tl-line-soft bg-tl-subtle px-4 py-3 text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 text-sm">
              <dt className="text-tl-muted">{label}</dt>
              <dd className="text-right font-bold text-tl-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex w-full flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              onViewWithdrawals();
              onClose();
            }}
            className={`${primaryButton} flex-1`}
          >
            View Withdrawals
          </button>
          <button type="button" onClick={onClose} className={`${ghostButton} flex-1`}>
            Back to Finance
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
