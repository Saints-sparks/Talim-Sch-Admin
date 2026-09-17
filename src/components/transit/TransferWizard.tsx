"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { surface, text } from "@/components/transit/ui";

/** The numbered dots and rules across the top of a wizard. */
export function WizardSteps({ step, steps }: { step: number; steps: string[] }) {
  return (
    <ol className="flex items-center gap-2 mb-6">
      {steps.map((label, index) => (
        <li key={label} className="flex items-center gap-2 flex-1">
          <span
            aria-current={index === step ? "step" : undefined}
            title={label}
            className={cn(
              "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
              index < step
                ? "bg-[#003366] dark:bg-sky-600 text-white"
                : index === step
                  ? "bg-[#003366] dark:bg-sky-600 text-white ring-2 ring-[#003366]/30 dark:ring-sky-500/40"
                  : "bg-gray-100 dark:bg-slate-800 text-[#929292] dark:text-slate-400"
            )}
          >
            {index < step ? <Check className="w-3.5 h-3.5" /> : index + 1}
          </span>
          {index < steps.length - 1 && (
            <span
              className={cn(
                "h-0.5 flex-1 transition-colors",
                index < step ? "bg-[#003366] dark:bg-sky-600" : "bg-gray-100 dark:bg-slate-800"
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * The shell both transfer wizards share: a back link, the step dots, the panel
 * for the current step and the Back / Next / Submit footer.
 */
export function TransferWizardShell({
  title,
  description,
  steps,
  step,
  onStepChange,
  canContinue,
  submitting,
  submitLabel,
  onSubmit,
  onExit,
  children,
}: {
  title: string;
  description: string;
  steps: string[];
  step: number;
  onStepChange: (step: number) => void;
  canContinue: boolean;
  submitting: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onExit: () => void;
  children: React.ReactNode;
}) {
  const isLastStep = step === steps.length - 1;

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => (step === 0 ? onExit() : onStepChange(step - 1))}
        className={cn(
          "flex items-center gap-2 text-sm mb-6 transition-colors hover:underline",
          text.muted
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 0 ? "Back" : "Previous Step"}
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className={cn("text-2xl font-bold mb-1", text.strong)}>{title}</h1>
        <p className={cn("text-sm mb-6", text.muted)}>{description}</p>

        <WizardSteps step={step} steps={steps} />

        <div className={cn("rounded-xl p-6 shadow-sm", surface.card)}>
          <h2 className={cn("text-base font-semibold mb-4", text.strong)}>{steps[step]}</h2>
          {children}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => onStepChange(Math.max(0, step - 1))}
            disabled={step === 0 || submitting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm transition-colors disabled:opacity-30",
              text.muted
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !canContinue}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting..." : submitLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStepChange(step + 1)}
              disabled={!canContinue}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#003366] hover:bg-[#003366]/90 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
