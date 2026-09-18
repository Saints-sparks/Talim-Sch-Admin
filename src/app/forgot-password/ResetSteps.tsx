/**
 * The three forms of the password reset, plus the dialog that confirms it
 * worked. Each is a plain presentational piece over `usePasswordReset`.
 */
"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import type { PasswordReset } from "@/app/forgot-password/usePasswordReset";

/** Shared styling for every control on this screen. */
const inputCls =
  "mt-1 w-full px-4 py-3 rounded-lg shadow-sm text-gray-900 transition-all duration-200 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-400 bg-white";

/** Shared styling for the submit button on every step. */
const submitCls =
  "w-full sm:w-[60%] bg-[#154473] text-white py-2 px-3 rounded-lg shadow-lg hover:bg-[#123961] focus:outline-none focus:ring focus:ring-[#5A7EA6] mx-auto disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Step 1 — who is resetting.
 *
 * @param props.reset - The flow returned by `usePasswordReset`.
 * @returns The email form.
 */
export function EmailStep({ reset }: { reset: PasswordReset }) {
  return (
    <form
      className="flex flex-col space-y-4 sm:space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void reset.requestCode();
      }}
    >
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email address"
          value={reset.email}
          onChange={(e) => reset.setEmail(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      <button type="submit" disabled={reset.loading} className={submitCls}>
        {reset.loading ? "Sending OTP..." : "Send OTP"}
      </button>
    </form>
  );
}

/**
 * Step 2 — the code from the email, checked with the server.
 *
 * @param props.reset - The flow returned by `usePasswordReset`.
 * @returns The code form.
 */
export function OtpStep({ reset }: { reset: PasswordReset }) {
  return (
    <form
      className="flex flex-col space-y-4 sm:space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void reset.verifyCode();
      }}
    >
      <div>
        <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-2">
          Enter OTP
        </label>
        <input
          type="text"
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit OTP"
          value={reset.otp}
          onChange={(e) => reset.setOtp(e.target.value)}
          className={`${inputCls} text-center text-2xl tracking-widest`}
          maxLength={6}
          required
        />
        <p className="mt-2 text-sm text-gray-700 text-center">
          We&apos;ve sent a 6-digit verification code to {reset.email}
        </p>
      </div>

      <button type="submit" disabled={reset.loading} className={submitCls}>
        {reset.loading ? "Verifying..." : "Verify OTP"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => void reset.resendCode()}
          disabled={reset.loading}
          className="text-sm text-[#154473] hover:underline disabled:opacity-50"
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
 * @param props.reset - The flow returned by `usePasswordReset`.
 * @returns The password form.
 */
export function NewPasswordStep({ reset }: { reset: PasswordReset }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form
      className="flex flex-col space-y-4 sm:space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void reset.resetPassword(newPassword, confirmPassword);
      }}
    >
      <div className="relative">
        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
          New Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={`${inputCls} pr-12`}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((was) => !was)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-10 text-gray-600 focus:outline-none"
        >
          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
        <PasswordRequirements password={newPassword} id="newPassword-rules" />
      </div>

      <div className="relative">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
          Confirm New Password
        </label>
        <input
          type={showConfirmPassword ? "text" : "password"}
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`${inputCls} pr-12`}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((was) => !was)}
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-10 text-gray-600 focus:outline-none"
        >
          {showConfirmPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <button type="submit" disabled={reset.loading} className={submitCls}>
        {reset.loading ? "Resetting Password..." : "Reset Password"}
      </button>
    </form>
  );
}

/**
 * The confirmation shown while the sign-in page is loading.
 *
 * @param props.open - Whether the reset has succeeded.
 * @returns The dialog.
 */
export function ResetSuccessModal({ open }: { open: boolean }) {
  return (
    <div
      role={open ? "dialog" : undefined}
      aria-modal={open || undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md mx-4 text-center transform transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <div className="checkmark-container">
            <svg
              className="checkmark w-12 h-12 text-green-500"
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

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your password has been successfully updated. You will be redirected to the sign-in page.
        </p>

        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-[#154473] rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-[#154473] rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-[#154473] rounded-full animate-bounce"
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
