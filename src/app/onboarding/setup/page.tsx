/**
 * Onboarding phase 2 — the setup checklist.
 *
 * The page is a shell: `useSetupChecklist` owns which step is open and what
 * unlocks the next one, the rail renders the list, and each step is its own
 * component under `components/onboarding/steps` with its own queries and
 * mutations. A step the signed-in role cannot perform is shown as blocked
 * rather than offered as a form the API would refuse.
 */
"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSetupChecklist } from "@/hooks/onboarding/useSetupChecklist";
import {
  SetupChecklistRail,
  SetupHeader,
} from "@/components/onboarding/SetupChecklistRail";
import { StepContent } from "@/components/onboarding/steps/StepContent";
import { CompletionCard } from "@/components/onboarding/steps/StepCard";

/**
 * @returns The setup checklist screen.
 */
export default function OnboardingSetup() {
  const router = useRouter();
  const {
    steps,
    activeStep,
    setActiveStep,
    isHydrated,
    isFullyComplete,
    isStepComplete,
    isStepLocked,
    completeStep,
    progressPercent,
    completedCount,
    totalCount,
  } = useSetupChecklist();

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#003366] dark:text-blue-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col dark:bg-slate-950">
      <SetupHeader
        completedCount={completedCount}
        totalCount={totalCount}
        progressPercent={progressPercent}
        onDashboard={() => router.push("/dashboard")}
      />

      <div className="flex flex-1 max-w-6xl mx-auto w-full gap-6 p-6">
        <SetupChecklistRail
          steps={steps}
          activeStep={activeStep}
          isStepComplete={isStepComplete}
          isStepLocked={isStepLocked}
          onSelect={setActiveStep}
        />

        <main className="flex-1 min-w-0">
          {isFullyComplete ? (
            <CompletionCard onDashboard={() => router.push("/dashboard")} />
          ) : (
            <StepContent
              stepId={activeStep}
              isComplete={isStepComplete(activeStep)}
              onComplete={completeStep}
              onSkip={completeStep}
            />
          )}
        </main>
      </div>
    </div>
  );
}
