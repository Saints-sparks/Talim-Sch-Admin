"use client";

import { useState } from "react";
import type {
  BankAccount,
  ConfirmedWithdrawal,
  WalletSummary,
  WithdrawalSummary,
} from "@/app/services/finance.service";
import { WithdrawAmountStep } from "./WithdrawAmountStep";
import { EmailOtpStep } from "./EmailOtpStep";
import { ConfirmWithdrawalStep } from "./ConfirmWithdrawalStep";
import { WithdrawalSuccessStep } from "./WithdrawalSuccessStep";

/**
 * Where the withdrawal flow currently is.
 *
 * The backend's state machine is draft → OTP verified → confirmed, and this
 * mirrors it exactly: the draft id is the only thing carried between steps,
 * and the figures shown on the confirm step are the ones the server returned
 * when the code verified — never recomputed on the client.
 */
type WithdrawalStep =
  | { type: "amount" }
  | { type: "otp"; draftId: string; maskedEmail: string }
  | { type: "confirm"; summary: WithdrawalSummary; maskedEmail: string }
  | { type: "success"; withdrawal: ConfirmedWithdrawal };

interface WithdrawalFlowProps {
  /** The school's payout accounts; the step filters these to verified, active ones. */
  accounts: BankAccount[];
  /** Balances, for the available figure and the client-side amount check. */
  summary: WalletSummary | undefined;
  onClose: () => void;
  /** Called when the admin asks to see the withdrawal list from the success step. */
  onViewWithdrawals: () => void;
}

/**
 * The four-step withdrawal: enter an amount, verify the emailed code, confirm
 * the figures (with an authenticator code when the school requires one), then
 * a receipt.
 *
 * Only the confirm step moves money, and it is the only step that invalidates
 * the wallet caches — which it does through `useConfirmWithdrawal` before this
 * component shows the success screen.
 *
 * @param props - Accounts, balances and the flow's exit callbacks.
 * @returns The modal for the current step.
 */
export function WithdrawalFlow({
  accounts,
  summary,
  onClose,
  onViewWithdrawals,
}: WithdrawalFlowProps) {
  const [step, setStep] = useState<WithdrawalStep>({ type: "amount" });

  switch (step.type) {
    case "amount":
      return (
        <WithdrawAmountStep
          accounts={accounts}
          summary={summary}
          onClose={onClose}
          onDraftCreated={(draftId, maskedEmail) => setStep({ type: "otp", draftId, maskedEmail })}
        />
      );

    case "otp":
      return (
        <EmailOtpStep
          draftId={step.draftId}
          maskedEmail={step.maskedEmail}
          onBack={() => setStep({ type: "amount" })}
          onClose={onClose}
          onVerified={(verifiedSummary) =>
            setStep({ type: "confirm", summary: verifiedSummary, maskedEmail: step.maskedEmail })
          }
        />
      );

    case "confirm":
      return (
        <ConfirmWithdrawalStep
          summary={step.summary}
          onBack={() =>
            setStep({
              type: "otp",
              draftId: step.summary.withdrawalDraftId,
              maskedEmail: step.maskedEmail,
            })
          }
          onClose={onClose}
          onConfirmed={(withdrawal) => setStep({ type: "success", withdrawal })}
        />
      );

    case "success":
      return (
        <WithdrawalSuccessStep
          withdrawal={step.withdrawal}
          onClose={onClose}
          onViewWithdrawals={onViewWithdrawals}
        />
      );
  }
}
