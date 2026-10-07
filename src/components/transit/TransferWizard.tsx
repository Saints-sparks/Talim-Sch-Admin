"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  card,
  cardTitle,
  pagePad,
  pageSubtitle,
  pageTitle,
  textLink,
} from "@/components/tl/styles";
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
                ? "bg-tl-brand-fill text-white"
                : index === step
                  ? "bg-tl-brand-fill text-white ring-2 ring-tl-link/30"
                  : "bg-tl-track text-tl-muted"
            )}
          >
            {index < step ? <Check className="w-3.5 h-3.5" /> : index + 1}
          </span>
          {index < steps.length - 1 && (
            <span
              className={cn(
                "h-0.5 flex-1 transition-colors",
                index < step ? "bg-tl-brand-fill" : "bg-tl-track"
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
    <div className={pagePad}>
      <button
        type="button"
        onClick={() => (step === 0 ? onExit() : onStepChange(step - 1))}
        className={cn(textLink, "mb-4")}
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 0 ? "Back" : "Previous Step"}
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className={pageTitle}>{title}</h1>
        <p className={cn(pageSubtitle, "mb-6")}>{description}</p>

        <WizardSteps step={step} steps={steps} />

        <div className={card}>
          <h2 className={cn(cardTitle, "mb-4")}>{steps[step]}</h2>
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-tl-success hover:opacity-90 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting..." : submitLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStepChange(step + 1)}
              disabled={!canContinue}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-tl-brand-fill hover:bg-tl-brand-fill-hover text-white text-sm font-medium transition-colors disabled:opacity-40"
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
