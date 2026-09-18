/**
 * `/forgot-password` — reset a password with a code sent by email.
 *
 * The page is the frame: `usePasswordReset` owns the three steps and the
 * server calls, and each step is its own form. The code is verified with the
 * server before a new password is asked for, so a wrong code never gets as far
 * as the password screen.
 */
"use client";

import Image from "next/legacy/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  EmailStep,
  NewPasswordStep,
  OtpStep,
  ResetSuccessModal,
} from "@/app/forgot-password/ResetSteps";
import { RESET_COPY, usePasswordReset } from "@/app/forgot-password/usePasswordReset";
import treelogo from "../../../public/img/treelogo.svg";
import loginImage from "../../../public/img/Education-rafiki 1.svg";

/** The steps in the order their dots are drawn. */
const STEP_ORDER = ["email", "otp", "newPassword"] as const;

/**
 * @returns The forgot-password screen.
 */
export default function ForgotPassword() {
  const reset = usePasswordReset();
  const copy = RESET_COPY[reset.step];

  return (
    <>
      <div className="flex flex-col sm:flex-row h-screen bg-white-400">
        {/* Left: the form */}
        <div className="w-full sm:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 py-8 sm:py-0">
          <div className="w-full sm:w-[70%] bg-white rounded-lg p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={reset.goBack}
                className="flex items-center text-[#154473] hover:text-[#123961] transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">Back</span>
              </button>
            </div>

            <div className="flex items-center justify-center mb-6">
              <Image
                src={treelogo}
                alt="Talim Logo"
                width={80}
                height={80}
                className="h-16 w-16 sm:h-20 sm:w-20"
                priority
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">
              {copy.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 mb-6 text-center">{copy.description}</p>

            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {STEP_ORDER.map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      reset.step === step ? "bg-[#154473]" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {reset.step === "email" && <EmailStep reset={reset} />}
            {reset.step === "otp" && <OtpStep reset={reset} />}
            {reset.step === "newPassword" && <NewPasswordStep reset={reset} />}

            <div className="text-center mt-6">
              <span className="text-sm text-gray-700">Remember your password? </span>
              <a href="/" className="text-sm text-[#154473] hover:underline font-medium">
                Sign In
              </a>
            </div>
          </div>
        </div>

        {/* Right: the illustration */}
        <div className="w-full sm:w-1/2 flex items-center justify-center bg-[#F8F8F8]">
          <div className="h-[610px] w-[610px] relative">
            <Image src={loginImage} alt="High School" layout="fill" objectFit="fill" />
          </div>
        </div>
      </div>

      <ResetSuccessModal open={reset.succeeded} />
    </>
  );
}
