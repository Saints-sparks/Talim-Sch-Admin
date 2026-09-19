"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { PrimaryButton, SecondaryButton, text, TransitModal } from "@/components/transit/ui";
import { BulkStep } from "./wizard/BulkStep";
import { IndividualStep } from "./wizard/IndividualStep";
import { type Step } from "./wizard/promotionWizard";
import { ReviewStep, SubmitStep } from "./wizard/ReviewSteps";
import { SetupStep } from "./wizard/SetupStep";
import { usePromotionWizard } from "./wizard/usePromotionWizard";

/**
 * The four-step wizard that builds a promotion run.
 *
 * The API validates the run as it creates it, so this only has to produce
 * decisions the DTO accepts: a student, the class they are in, and the class
 * they are moving to.
 */
export function CreatePromotionRunModal({
  academicYears,
  terms,
  classes,
  onClose,
  onCreated,
}: {
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  classes: ClassOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const wizard = usePromotionWizard(onCreated);
  const { step, setStep, decisions, mode, roster } = wizard;

  const footer = (
    <div className="flex w-full justify-between">
      <SecondaryButton
        onClick={() => (step === 1 ? onClose() : setStep((step - 1) as Step))}
        disabled={wizard.isSubmitting}
      >
        {step === 1 ? "Cancel" : "Back"}
      </SecondaryButton>
      {step < 4 ? (
        <PrimaryButton
          onClick={() => (step === 2 ? wizard.goToReview() : setStep((step + 1) as Step))}
          disabled={(step === 1 && !wizard.canContinueSetup) || (step === 2 && !decisions.length)}
        >
          {step === 3 ? "Continue to Submit" : "Next"}
        </PrimaryButton>
      ) : (
        <PrimaryButton onClick={wizard.submit} disabled={wizard.isSubmitting || !decisions.length}>
          {wizard.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Run
        </PrimaryButton>
      )}
    </div>
  );

  return (
    <TransitModal title="Create Promotion Run" onClose={onClose} footer={footer} width="max-w-5xl">
      <div className="mb-5 flex flex-wrap gap-2">
        {wizard.stepLabels.map((label, index) => (
          <span
            key={label}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              step === index + 1
                ? "border-[#003366] bg-[#003366] text-white dark:border-sky-600 dark:bg-sky-600"
                : cn("border-gray-200 dark:border-slate-700", text.muted),
            )}
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <SetupStep
          academicYears={academicYears}
          terms={terms}
          fromAcademicYearId={wizard.fromAcademicYearId}
          toAcademicYearId={wizard.toAcademicYearId}
          targetTermId={wizard.targetTermId}
          mode={mode}
          onFromChange={wizard.setFromAcademicYearId}
          onToChange={wizard.setToAcademicYearId}
          onTermChange={wizard.setTargetTermId}
          onModeChange={wizard.setMode}
        />
      )}

      {step === 2 && mode === "individual" && (
        <IndividualStep
          classes={classes}
          enrollments={wizard.enrollments}
          isLoading={roster.isLoading}
          isError={roster.isError}
          error={roster.error}
          selectedIds={wizard.selectedIds}
          decisions={decisions}
          onToggle={wizard.toggleStudent}
          onChange={wizard.updateDecision}
        />
      )}

      {step === 2 && mode === "bulk" && (
        <BulkStep
          classes={classes}
          sourceClassId={wizard.sourceClassId}
          targetClassId={wizard.targetClassId}
          decisions={decisions}
          isLoading={roster.isLoading}
          onSourceChange={wizard.chooseSourceClass}
          onTargetChange={wizard.setTargetClassId}
          onChange={wizard.updateDecision}
        />
      )}

      {step === 3 && <ReviewStep decisions={decisions} classes={classes} onChange={wizard.updateDecision} />}

      {step === 4 && (
        <SubmitStep
          decisionCount={decisions.length}
          academicYears={academicYears}
          fromAcademicYearId={wizard.fromAcademicYearId}
          toAcademicYearId={wizard.toAcademicYearId}
        />
      )}
    </TransitModal>
  );
}
