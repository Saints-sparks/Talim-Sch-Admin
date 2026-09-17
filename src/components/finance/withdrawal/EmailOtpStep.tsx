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
import { ModalShell } from "../ModalShell";
import { OtpInput } from "../OtpInput";
import { financeActionMessage } from "../financeErrors";

/** Emailed codes are six digits. */
const OTP_LENGTH = 6;

interface EmailOtpStepProps {
  draftId: string;
  /** The masked address the code went to, e.g. `a***n@school.ng`. */
  maskedEmail: string;
  onBack: () => void;
  onClose: () => void;
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
    <ModalShell title="Verify Withdrawal (Email OTP)" onClose={onClose}>
      <form onSubmit={handleVerify} className="p-6 space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <Mail size={36} className="text-[#003366]" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-700 font-medium">We have sent a 6-digit OTP to</p>
          <p className="font-bold text-[#003366] text-lg mt-0.5">{maskedEmail || "your email"}</p>
          <p className="text-sm text-gray-400 mt-1">
            Please enter the OTP below to confirm your withdrawal.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 text-center mb-3">Enter 6-digit OTP</p>
          <OtpInput value={otp} onChange={setOtp} disabled={verify.isPending} />
        </div>

        <div className="text-center text-sm text-gray-500">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={cooldown > 0 || resend.isPending}
            className="text-[#003366] font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
          >
            {resend.isPending
              ? "Sending…"
              : cooldown > 0
                ? `Resend OTP (${formatCountdown(cooldown)})`
                : "Resend OTP"}
          </button>
          <br />
          <span className="text-xs text-gray-400">Check your spam or junk folder.</span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center justify-center gap-1"
          >
            <ArrowLeft size={15} /> Cancel
          </button>
          <button
            type="submit"
            disabled={otp.length !== OTP_LENGTH || verify.isPending}
            className="flex-1 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {verify.isPending ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Verifying…
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
