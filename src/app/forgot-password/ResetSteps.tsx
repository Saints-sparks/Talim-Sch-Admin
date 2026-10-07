/**
 * The three forms of the password reset, plus the dialog that confirms it
 * worked, in the shared Talim sign-in look. Each is a plain presentational
 * piece over `usePasswordReset`; ids, labels and button words are unchanged.
 */
"use client";

import { useState } from "react";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import type { PasswordReset } from "@/app/forgot-password/usePasswordReset";
import {
  SignInField,
  SignInPasswordField,
  SignInPrimaryButton,
  signInLinkClass,
} from "@/components/auth/signin-ui";

/**
 * Step 1 — who is resetting.
 *
 * @param props - The step's props.
 * @param props.reset - The flow returned by `usePasswordReset`.
 * @returns The email form.
 */
export function EmailStep({ reset }: { reset: PasswordReset }) {
  return (
    <form
      className="space-y-5"
      aria-label="Email address"
      onSubmit={(e) => {
        e.preventDefault();
        void reset.requestCode();
      }}
    >
      <SignInField
        id="email"
        name="email"
        type="email"
        label="Email Address"
        placeholder="Enter your email address"
        autoComplete="username"
        value={reset.email}
        onChange={(e) => reset.setEmail(e.target.value)}
        required
      />
      <SignInPrimaryButton loading={reset.loading} loadingText="Sending OTP...">
        Send OTP
      </SignInPrimaryButton>
    </form>
  );
}

/**
 * Step 2 — the code from the email, checked with the server.
 *
 * @param props - The step's props.
 * @param props.reset - The flow returned by `usePasswordReset`.
 * @returns The code form.
 */
export function OtpStep({ reset }: { reset: PasswordReset }) {
  return (
    <form
      className="space-y-5"
      aria-label="Verification code"
      onSubmit={(e) => {
        e.preventDefault();
        void reset.verifyCode();
      }}
    >
      <SignInField
        id="otp"
        name="otp"
        label="Enter OTP"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Enter 6-digit OTP"
        value={reset.otp}
        onChange={(e) => reset.setOtp(e.target.value)}
        maxLength={6}
        required
        hint={<>We&apos;ve sent a 6-digit verification code to {reset.email}</>}
      />
      <SignInPrimaryButton loading={reset.loading} loadingText="Verifying...">
        Verify OTP
      </SignInPrimaryButton>
      <div className="text-center">
        <button
          type="button"
          onClick={() => void reset.resendCode()}
          disabled={reset.loading}
          className={`${signInLinkClass} disabled:opacity-50`}
        >
          Resend OTP
        </button>
      </div>
    </form>
  );
}

/**
 * Step 3 — the new password, checked against the shared policy.
 *
 * @param props - The step's props.
 * @param props.reset - The flow returned by `usePasswordReset`.
 * @returns The password form.
 */
export function NewPasswordStep({ reset }: { reset: PasswordReset }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form
      className="space-y-5"
      aria-label="New password"
      onSubmit={(e) => {
        e.preventDefault();
        void reset.resetPassword(newPassword, confirmPassword);
      }}
    >
      <SignInPasswordField
        id="newPassword"
        name="newPassword"
        label="New Password"
        autoComplete="new-password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        describedBy={["newPassword-rules"]}
        after={<PasswordRequirements password={newPassword} id="newPassword-rules" />}
        required
      />
      <SignInPasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm New Password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <SignInPrimaryButton loading={reset.loading} loadingText="Resetting Password...">
        Reset Password
      </SignInPrimaryButton>
    </form>
  );
}

/**
 * The confirmation shown while the sign-in page is loading.
 *
 * @param props - The dialog's props.
 * @param props.open - Whether the reset has succeeded.
 * @returns The dialog.
 */
export function ResetSuccessModal({ open }: { open: boolean }) {
  return (
    <div
      role={open ? "dialog" : undefined}
      aria-modal={open || undefined}
      aria-label={open ? "Password Reset Successful!" : undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,27,46,0.45)] transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`mx-4 max-w-md transform rounded-[24px] bg-white p-8 text-center transition-all duration-300 dark:bg-slate-900 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <div className="checkmark-container">
            <svg
              className="checkmark h-12 w-12 text-green-600 dark:text-green-400"
              aria-hidden
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                className="checkmark-path"
              />
            </svg>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-[#030E18] dark:text-slate-100">
          Password Reset Successful!
        </h2>
        <p className="mb-6 text-gray-600 dark:text-slate-400">
          Your password has been successfully updated. You will be redirected to the sign-in page.
        </p>

        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-[#003366] rounded-full animate-bounce dark:bg-blue-400" />
          <div
            className="w-2 h-2 bg-[#003366] rounded-full animate-bounce dark:bg-blue-400"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-[#003366] rounded-full animate-bounce dark:bg-blue-400"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>

      {/* styled-jsx is scoped to the component holding the markup, so the
          checkmark animation has to be declared here rather than on the page. */}
      <style jsx>{`
        @keyframes checkmark {
          0% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .checkmark-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: checkmark 0.6s ease-in-out 0.3s forwards;
        }

        .checkmark-container {
          animation: scale-up 0.3s ease-in-out;
        }

        @keyframes scale-up {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
