"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import type { ConfirmedWithdrawal, WithdrawalSummary } from "@/app/services/finance.service";
import { useSecurityStatus } from "@/hooks/finance/useFinanceQueries";
import { useConfirmWithdrawal } from "@/hooks/finance/useFinanceMutations";
import { ModalShell } from "../ModalShell";
import { financeActionMessage } from "../financeErrors";
import { formatNaira } from "../formatters";

/** Authenticator codes are six digits. */
const CODE_LENGTH = 6;

interface ConfirmWithdrawalStepProps {
  /** The figures the server returned when the emailed code verified. */
  summary: WithdrawalSummary;
  onBack: () => void;
  onClose: () => void;
  onConfirmed: (withdrawal: ConfirmedWithdrawal) => void;
}

/**
 * One line of the confirmation summary.
 *
 * @param props - Label, formatted value and whether to highlight it.
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
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-[#003366]" : "text-gray-800"}`}>
        {value}
      </span>
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
    <ModalShell title="Confirm Withdrawal" onClose={onClose}>
      <div className="p-6 space-y-5">
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3">Withdrawal Summary</p>
          <div className="bg-gray-50 rounded-xl p-4">
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
          </div>
        </div>

        <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Please confirm that the details above are correct. This action requires email OTP
            verification and will be subject to review before processing.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]/30"
          />
          <span className="text-sm text-gray-600">
            I confirm that the information above is correct and I want to proceed with this
            withdrawal.
          </span>
        </label>

        {requiresTwoFactor && (
          <label className="block text-sm text-gray-600">
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
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm tracking-widest bg-white text-gray-800"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Your school requires two-factor authentication for withdrawals.
            </span>
          </label>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={confirm.isPending}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={blocked}
            className="flex-1 py-3 bg-[#003366] text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {confirm.isPending ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Submitting…
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
