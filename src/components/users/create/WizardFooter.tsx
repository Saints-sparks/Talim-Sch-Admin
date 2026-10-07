"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ghostButton, primaryButton } from "@/components/tl";

/** Props for {@link WizardFooter}. */
interface WizardFooterProps {
  /** Zero-based current step. */
  step: number;
  /** Zero-based index of the last step. */
  lastStep: number;
  /** True while the create request is in flight. */
  pending: boolean;
  /** Goes back a step. */
  onBack: () => void;
  /** Validates and continues, or creates on the last step. */
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

/**
 * Back / Continue / Create bar for a wizard dialog, on the sheet's pale
 * footer. The primary button is disabled while a request is in flight, which
 * is what blocks a double submit.
 *
 * @param props - Step position, pending flag, handlers and labels.
 * @param props.step - The current step.
 * @param props.lastStep - The last step.
 * @param props.pending - Whether a request is in flight.
 * @param props.onBack - Back handler.
 * @param props.onNext - Continue / create handler.
 * @param props.submitLabel - The last step's button words.
 * @param props.continueHint - The middle steps' tooltip.
 * @param props.submitHint - The last step's tooltip.
 * @param props.size - Kept for the callers; both densities share the tl buttons.
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
}: WizardFooterProps) {
  const isLast = step === lastStep;

  return (
    <div className="flex-shrink-0 border-t border-tl-line-soft bg-tl-subtle px-[clamp(20px,3vw,30px)] py-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 0 || pending}
          className={ghostButton}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <Tooltip content={isLast ? submitHint : continueHint} side="top">
          <button type="button" onClick={onNext} disabled={pending} className={primaryButton}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Processing...
              </>
            ) : (
              <>
                {isLast ? submitLabel : "Continue"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
