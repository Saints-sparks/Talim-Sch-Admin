"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { logger } from "@/lib/logger";
import { WITHDRAWAL_LIMITS, type WithdrawalSummary } from "@/app/services/finance.service";
import {
  useResendWithdrawalOtp,
  useVerifyWithdrawalOtp,
} from "@/hooks/finance/useFinanceMutations";
import { ghostButton, primaryButton, textLink } from "@/components/tl";
import { ModalShell } from "../ModalShell";
import { WithdrawalSteps, withdrawalStepEyebrow } from "./WithdrawalSteps";
import { OtpInput } from "../OtpInput";
import { financeActionMessage } from "../financeErrors";

/** Emailed codes are six digits. */
const OTP_LENGTH = 6;

/** Props for {@link EmailOtpStep}. */
interface EmailOtpStepProps {
  /** The draft the code belongs to. */
  draftId: string;
  /** The masked address the code went to, e.g. `a***n@school.ng`. */
  maskedEmail: string;
  /** Back to the amount step. */
  onBack: () => void;
  /** Closes the flow. */
  onClose: () => void;
  /** Hands the server's figures to the confirm step. */
  onVerified: (summary: WithdrawalSummary) => void;
}

/**
 * Formats the resend countdown as mm:ss.
 *
 * @param seconds - Seconds left on the cooldown.
 * @returns The countdown, e.g. `00:47`.
 */
function formatCountdown(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Step 2: enter the code emailed by step 1.
 *
 * The resend button is held for the same 60 seconds the backend enforces, so
 * the admin isn't invited to press a button that would be refused. A wrong
 * code clears the boxes and keeps the server's message, which counts down the
 * attempts left before the draft is burned.
 *
 * @param props - The draft, the masked email and the step's callbacks.
 * @param props.draftId - The draft.
 * @param props.maskedEmail - Where the code went.
 * @param props.onBack - Back to the amount step.
 * @param props.onClose - Closes the flow.
 * @param props.onVerified - Moves on with the verified figures.
 * @returns The OTP step.
 */
export function EmailOtpStep({
  draftId,
  maskedEmail,
  onBack,
  onClose,
  onVerified,
}: EmailOtpStepProps) {
  const verify = useVerifyWithdrawalOtp();
  const resend = useResendWithdrawalOtp();
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState<number>(WITHDRAWAL_LIMITS.resendCooldownSeconds);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /**
   * Verifies the code; a wrong one clears the boxes.
   *
   * @param event - The form's submit event.
   */
  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    try {
      onVerified(await verify.mutateAsync({ withdrawalDraftId: draftId, otp }));
    } catch (error) {
      logger.error("finance", "withdrawal OTP verification failed", error);
      toast.error(financeActionMessage(error, "That code wasn't accepted"));
      setOtp("");
    }
  };

  /** Sends a new code once the cooldown is over. */
  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resend.mutateAsync(draftId);
      toast.success("A new code is on its way to your email");
      setCooldown(WITHDRAWAL_LIMITS.resendCooldownSeconds);
      setOtp("");
    } catch (error) {
      logger.error("finance", "withdrawal OTP resend failed", error);
      toast.error(financeActionMessage(error, "Couldn't resend the code"));
    }
  };

  return (
    <ModalShell
      title="Verify Withdrawal (Email OTP)"
      eyebrowText={withdrawalStepEyebrow(1)}
      onClose={onClose}
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-6 px-[clamp(20px,3vw,28px)] py-5">
        <WithdrawalSteps current={1} />

        <div className="flex justify-center">
          <span
            aria-hidden
            className="flex h-20 w-20 items-center justify-center rounded-full bg-tl-select text-tl-brand"
          >
            <Mail size={34} />
          </span>
        </div>

        <div className="text-center">
          <p className="font-semibold text-tl-body">We have sent a 6-digit OTP to</p>
          <p className="mt-0.5 break-all text-lg font-extrabold text-tl-brand">
            {maskedEmail || "your email"}
          </p>
          <p className="mt-1 text-sm text-tl-muted">
            Please enter the OTP below to confirm your withdrawal.
          </p>
        </div>

        <div>
          <p className="mb-3 text-center text-[13px] font-bold text-tl-muted">Enter 6-digit OTP</p>
          <OtpInput value={otp} onChange={setOtp} disabled={verify.isPending} />
        </div>

        <div className="text-center text-sm text-tl-muted">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={cooldown > 0 || resend.isPending}
            className={`${textLink} disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50`}
          >
            {resend.isPending
              ? "Sending…"
              : cooldown > 0
                ? `Resend OTP (${formatCountdown(cooldown)})`
                : "Resend OTP"}
          </button>
          <br />
          <span className="text-[13px] text-tl-muted">Check your spam or junk folder.</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={onBack} className={`${ghostButton} flex-1`}>
            <ArrowLeft size={16} aria-hidden /> Cancel
          </button>
          <button
            type="submit"
            disabled={otp.length !== OTP_LENGTH || verify.isPending}
            className={`${primaryButton} flex-1`}
          >
            {verify.isPending ? (
              <>
                <RefreshCw size={15} className="animate-spin" aria-hidden /> Verifying…
              </>
            ) : (
              "Verify OTP"
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
