/**
 * The three-step password reset: ask for a code, prove you have it, choose a
 * new password.
 *
 * The middle step is a real server call, not a client-side length check — a
 * wrong code is caught before the user picks a password, and wrong codes count
 * towards the server's attempt limit. All three calls are `skipAuth`: there is
 * no session yet.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/CustomToast";
import { authService } from "@/app/services/auth.service";
import { getErrorMessage } from "@/lib/apiError";
import { isPasswordValid } from "@/lib/passwordPolicy";

/** Which step of the reset the user is on. */
export type ResetStep = "email" | "otp" | "newPassword";

/** How long the success dialog stays up before the sign-in page loads. */
const SUCCESS_DWELL_MS = 3000;

/** What {@link usePasswordReset} returns. */
export interface PasswordReset {
  /** The step being shown. */
  step: ResetStep;
  /** The email the code was sent to. */
  email: string;
  /** Sets the email on the first step. */
  setEmail: (value: string) => void;
  /** The 6-digit code, digits only. */
  otp: string;
  /** Sets the code; anything but digits is dropped. */
  setOtp: (value: string) => void;
  /** True while a request is in flight. */
  loading: boolean;
  /** True once the password has been reset. */
  succeeded: boolean;
  /** Requests a reset code for `email`. */
  requestCode: () => Promise<void>;
  /** Sends the same code again. */
  resendCode: () => Promise<void>;
  /** Checks the code with the server. */
  verifyCode: () => Promise<void>;
  /** Sets the new password and starts the redirect to sign-in. */
  resetPassword: (newPassword: string, confirmPassword: string) => Promise<void>;
  /** Goes back a step, or leaves for sign-in from the first one. */
  goBack: () => void;
}

/**
 * Drives the reset flow.
 *
 * @returns The flow's state and its four actions.
 */
export function usePasswordReset(): PasswordReset {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Cleared on unmount so a redirect never fires from a page that has gone.
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  const setOtp = useCallback((value: string) => {
    setOtpValue(value.replace(/\D/g, "").slice(0, 6));
  }, []);

  /** Asks the server for a code; the wording never reveals whether the email exists. */
  const sendCode = useCallback(
    async (advance: boolean) => {
      if (!email.trim()) {
        toast.error("Please enter your email address");
        return;
      }
      setLoading(true);
      try {
        await authService.forgotPassword(email.trim());
        toast.success("If that email has an account, a reset code is on its way.");
        if (advance) setStep("otp");
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to send reset code. Please try again."));
      } finally {
        setLoading(false);
      }
    },
    [email, toast]
  );

  const verifyCode = useCallback(async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      // A 200 carrying `valid: false` is still a refusal.
      const result = await authService.verifyResetCode(email, otp);
      if (result?.valid === false) {
        toast.error(result.message || "That code is invalid or has expired. Request a new one.");
        return;
      }
      toast.success("Code verified");
      setStep("newPassword");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "That code is invalid or has expired. Request a new one.")
      );
    } finally {
      setLoading(false);
    }
  }, [email, otp, toast]);

  const resetPassword = useCallback(
    async (newPassword: string, confirmPassword: string) => {
      if (!isPasswordValid(newPassword)) {
        toast.error("Choose a password that meets every requirement below");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      setLoading(true);
      try {
        await authService.resetPassword(email, otp, newPassword);
        setSucceeded(true);
        redirectTimer.current = setTimeout(() => router.push("/"), SUCCESS_DWELL_MS);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to reset password. Please try again."));
      } finally {
        setLoading(false);
      }
    },
    [email, otp, router, toast]
  );

  const goBack = useCallback(() => {
    if (step === "email") router.push("/");
    else if (step === "otp") setStep("email");
    else setStep("otp");
  }, [step, router]);

  return {
    step,
    email,
    setEmail,
    otp,
    setOtp,
    loading,
    succeeded,
    requestCode: () => sendCode(true),
    resendCode: () => sendCode(false),
    verifyCode,
    resetPassword,
    goBack,
  };
}

/** The heading and the sentence under it for each step. */
export const RESET_COPY: Record<ResetStep, { title: string; description: string }> = {
  email: {
    title: "Forgot Password?",
    description: "Enter your email address and we'll send you an OTP to reset your password.",
  },
  otp: {
    title: "Verify OTP",
    description: "Enter the 6-digit verification code sent to your email.",
  },
  newPassword: {
    title: "Set New Password",
    description: "Create a new password for your account.",
  },
};
