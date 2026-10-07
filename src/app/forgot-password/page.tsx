/**
 * `/forgot-password` — reset a password with a code sent by email, in the
 * shared Talim sign-in look (`components/auth/signin-ui`).
 *
 * The page is the frame: `usePasswordReset` owns the three steps and the
 * server calls, and each step is its own form. The code is verified with the
 * server before a new password is asked for, so a wrong code never gets as far
 * as the password screen.
 */
"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import {
  EmailStep,
  NewPasswordStep,
  OtpStep,
  ResetSuccessModal,
} from "@/app/forgot-password/ResetSteps";
import { RESET_COPY, usePasswordReset } from "@/app/forgot-password/usePasswordReset";
import {
  SignInFooter,
  SignInHeading,
  SignInLogoHeader,
  SignInShell,
  signInInlineLinkClass,
  signInLinkClass,
} from "@/components/auth/signin-ui";

/** The steps in the order their dots are drawn. */
const STEP_ORDER = ["email", "otp", "newPassword"] as const;

/**
 * The forgot-password screen: Back, the logo with the "Admin" pill, the
 * step's heading and dots, the step's form, and the way back to sign in.
 *
 * @returns The forgot-password screen.
 */
export default function ForgotPassword() {
  const reset = usePasswordReset();
  const copy = RESET_COPY[reset.step];
  const stepIndex = STEP_ORDER.indexOf(reset.step as (typeof STEP_ORDER)[number]);

  return (
    <>
      <SignInShell
        illustration={
          <Image
            src="/img/Education-rafiki 1.svg"
            alt=""
            fill
            priority
            className="object-contain"
          />
        }
        panelTitle="School Admin Portal"
        panelText="Manage your school, staff, students, and curriculum from one place."
      >
        <button
          type="button"
          onClick={reset.goBack}
          className={`${signInLinkClass} -mt-3 mb-4 gap-2`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <SignInLogoHeader
          appName="Admin"
          logo={
            <Image
              src="/img/treelogo.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
          }
        />
        <SignInHeading title={copy.title} subtitle={copy.description} />

        <div
          className="mt-6 flex gap-2"
          role="img"
          aria-label={`Step ${stepIndex + 1} of ${STEP_ORDER.length}`}
        >
          {STEP_ORDER.map((step) => (
            <span
              key={step}
              className={`h-2 rounded-full ${
                reset.step === step
                  ? "w-8 bg-[#003366] dark:bg-blue-400"
                  : "w-2 bg-gray-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        <div className="mt-6">
          {reset.step === "email" && <EmailStep reset={reset} />}
          {reset.step === "otp" && <OtpStep reset={reset} />}
          {reset.step === "newPassword" && <NewPasswordStep reset={reset} />}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
          Remember your password?{" "}
          <a href="/" className={`${signInInlineLinkClass} font-medium`}>
            Sign In
          </a>
        </p>

        <SignInFooter supportEmail="support@mytalim.com" />
      </SignInShell>

      <ResetSuccessModal open={reset.succeeded} />
    </>
  );
}
