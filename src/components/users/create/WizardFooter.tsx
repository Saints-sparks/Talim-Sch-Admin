"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";

interface WizardFooterProps {
  /** Zero-based current step. */
  step: number;
  /** Zero-based index of the last step. */
  lastStep: number;
  /** True while the create request is in flight. */
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
  /** Label on the last step, e.g. "Create Teacher". */
  submitLabel: string;
  /** Tooltip on the primary button for a middle step. */
  continueHint: string;
  /** Tooltip on the primary button for the last step. */
  submitHint: string;
  /** Visual density: `lg` for the teacher wizard, `md` for the student wizard. */
  size: "lg" | "md";
}

/** Spinner shown on the primary button while a request is in flight. */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Back / Continue / Create bar for a wizard dialog. The primary button is
 * disabled while a request is in flight, which is what blocks a double submit.
 *
 * @param props - Step position, pending flag, handlers and labels.
 * @returns The footer bar.
 */
export function WizardFooter({
  step,
  lastStep,
  pending,
  onBack,
  onNext,
  submitLabel,
  continueHint,
  submitHint,
  size,
}: WizardFooterProps) {
  const isLast = step === lastStep;
  const lg = size === "lg";
  const backBase = lg ? "px-6 py-3 rounded-xl" : "px-5 py-2.5 rounded-lg";
  const backTone =
    step === 0 || pending
      ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
      : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700";

  return (
    <div
      className={`${
        lg ? "p-6 bg-gray-50" : "px-6 py-4 bg-white"
      } dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-shrink-0`}
    >
      <div className="flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 0 || pending}
          className={`${backBase} font-medium transition-all flex items-center gap-2 ${backTone}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <Tooltip content={isLast ? submitHint : continueHint} side="top">
          <button
            type="button"
            onClick={onNext}
            disabled={pending}
            className={`${
              lg ? "px-8 py-3 rounded-xl" : "px-6 py-2.5 rounded-lg shadow-sm hover:shadow"
            } bg-[#003366] text-white font-medium hover:bg-[#002244] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {pending ? (
              <>
                <Spinner />
                Processing...
              </>
            ) : (
              <>
                {isLast ? submitLabel : "Continue"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
