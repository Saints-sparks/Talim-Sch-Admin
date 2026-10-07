"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import type { ConfirmedWithdrawal, WithdrawalSummary } from "@/app/services/finance.service";
import { useSecurityStatus } from "@/hooks/finance/useFinanceQueries";
import { useConfirmWithdrawal } from "@/hooks/finance/useFinanceMutations";
import {
  Banner,
  fieldControl,
  fieldHint,
  fieldLabel,
  ghostButton,
  primaryButton,
} from "@/components/tl";
import { cn } from "@/lib/utils";
import { ModalShell } from "../ModalShell";
import { WithdrawalSteps, withdrawalStepEyebrow } from "./WithdrawalSteps";
import { financeActionMessage } from "../financeErrors";
import { formatNaira } from "../formatters";

/** Authenticator codes are six digits. */
const CODE_LENGTH = 6;

/** Props for {@link ConfirmWithdrawalStep}. */
interface ConfirmWithdrawalStepProps {
  /** The figures the server returned when the emailed code verified. */
  summary: WithdrawalSummary;
  /** Back to the code step. */
  onBack: () => void;
  /** Closes the flow. */
  onClose: () => void;
  /** Hands the created withdrawal to the success step. */
  onConfirmed: (withdrawal: ConfirmedWithdrawal) => void;
}

/**
 * One line of the confirmation summary.
 *
 * @param props - Label, formatted value and whether to highlight it.
 * @param props.label - The label.
 * @param props.value - The value.
 * @param props.highlight - Whether to show it in navy.
 * @returns The summary row.
 */
function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-tl-line-soft py-2.5 last:border-0">
      <dt className="text-sm text-tl-muted">{label}</dt>
      <dd
        className={`text-right text-sm ${highlight ? "font-extrabold text-tl-brand" : "font-bold text-tl-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Step 3: check the figures and commit the withdrawal.
 *
 * When the school requires two-factor for withdrawals, the authenticator code
 * field appears and is sent as `twoFactorCode`. The requirement is read from
 * the cached security status, and re-checked against the server's answer: if
 * the setting was switched on while this flow was open, the confirm comes back
 * `VALIDATION_FAILED` on `twoFactorCode` and the field appears then instead of
 * the admin hitting a dead end.
 *
 * @param props - The verified summary and the step's callbacks.
 * @param props.summary - The verified figures.
 * @param props.onBack - Back to the code step.
 * @param props.onClose - Closes the flow.
 * @param props.onConfirmed - Moves on with the withdrawal.
 * @returns The confirmation step.
 */
export function ConfirmWithdrawalStep({
  summary,
  onBack,
  onClose,
  onConfirmed,
}: ConfirmWithdrawalStepProps) {
  const security = useSecurityStatus();
  const confirm = useConfirmWithdrawal();
  const [agreed, setAgreed] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    if (security.data?.requireTwoFactorForWithdrawals) setRequiresTwoFactor(true);
  }, [security.data]);

  /** Commits the withdrawal (with the authenticator code when required). */
  const handleConfirm = async () => {
    if (!agreed) return;
    if (requiresTwoFactor && twoFactorCode.length !== CODE_LENGTH) return;
    try {
      const withdrawal = await confirm.mutateAsync({
        withdrawalDraftId: summary.withdrawalDraftId,
        confirmationAccepted: true,
        ...(requiresTwoFactor ? { twoFactorCode } : {}),
      });
      onConfirmed(withdrawal);
    } catch (error) {
      logger.error("finance", "confirm withdrawal failed", error);
      // The server also asks for the code when the setting changed meanwhile.
      if (error instanceof ApiError && error.fieldErrors().twoFactorCode) {
        setRequiresTwoFactor(true);
      }
      toast.error(financeActionMessage(error, "Confirmation failed"));
    }
  };

  const blocked = !agreed || confirm.isPending || (requiresTwoFactor && twoFactorCode.length !== CODE_LENGTH);

  return (
    <ModalShell title="Confirm Withdrawal" eyebrowText={withdrawalStepEyebrow(2)} onClose={onClose}>
      <div className="flex flex-col gap-5 px-[clamp(20px,3vw,28px)] py-5">
        <WithdrawalSteps current={2} />

        <div>
          <p className="mb-2 text-[15px] font-extrabold text-tl-ink">Withdrawal Summary</p>
          <dl className="rounded-2xl border border-tl-line-soft bg-tl-subtle px-4 py-1.5">
            {summary.bankAccount && (
              <>
                <SummaryRow
                  label="Withdraw to"
                  value={`${summary.bankAccount.bankName} · ${summary.bankAccount.accountNumber}`}
                />
                <SummaryRow label="Account Name" value={summary.bankAccount.accountName} />
              </>
            )}
            <SummaryRow label="Requested Amount" value={formatNaira(summary.amount)} />
            <SummaryRow label="Platform Charge" value={formatNaira(summary.platformCharge)} />
            <SummaryRow
              label="You Will Receive"
              value={formatNaira(summary.amountToReceive)}
              highlight
            />
            <SummaryRow label="Available Balance" value={formatNaira(summary.availableBalance)} />
            <SummaryRow
              label="After Withdrawal Balance"
              value={formatNaira(summary.balanceAfterWithdrawal)}
            />
          </dl>
        </div>

        <Banner tone="warning">
          Please confirm that the details above are correct. This action requires email OTP
          verification and will be subject to review before processing.
        </Banner>

        <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded accent-tl-brand"
          />
          <span className="text-sm text-tl-body">
            I confirm that the information above is correct and I want to proceed with this
            withdrawal.
          </span>
        </label>

        {requiresTwoFactor && (
          <label className={`${fieldLabel} block`}>
            Authenticator code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={twoFactorCode}
              onChange={(event) =>
                setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
              }
              placeholder="6-digit code"
              aria-label="Authenticator code"
              className={cn(fieldControl, "mt-1.5 font-mono tracking-widest")}
            />
            <span className={`${fieldHint} mt-1.5 block font-normal`}>
              Your school requires two-factor authentication for withdrawals.
            </span>
          </label>
        )}

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={confirm.isPending}
            className={`${ghostButton} flex-1`}
          >
            <ArrowLeft size={16} aria-hidden /> Back
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={blocked}
            className={`${primaryButton} flex-1`}
          >
            {confirm.isPending ? (
              <>
                <RefreshCw size={15} className="animate-spin" aria-hidden /> Submitting…
              </>
            ) : (
              "Confirm & Submit"
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
