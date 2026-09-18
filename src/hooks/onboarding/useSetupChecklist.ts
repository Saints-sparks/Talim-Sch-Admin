/**
 * The state behind the phase-2 setup checklist: which step is open, what ticks
 * one off, and the redirect back to phase 1 for a school that has not done it.
 *
 * The page is a shell over this hook and the step components, so the rules for
 * "what comes next" live in one place rather than in three effects inside a
 * page body.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ONBOARDING_STEPS,
  useOnboarding,
  type OnboardingStep,
  type OnboardingStepId,
} from "@/context/OnboardingContext";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";

/** What {@link useSetupChecklist} hands the page. */
export interface SetupChecklist {
  /** The phase-2 steps, in checklist order. */
  steps: OnboardingStep[];
  /** The step whose form is open. */
  activeStep: OnboardingStepId;
  /** Opens a step (the page blocks locked ones). */
  setActiveStep: (id: OnboardingStepId) => void;
  /** Whether the stored progress has been read yet. */
  isHydrated: boolean;
  /** Whether every required step is done. */
  isFullyComplete: boolean;
  /** Whether phase 1 has been completed. */
  phase1Completed: boolean;
  /** Whether `id` is ticked off. */
  isStepComplete: (id: OnboardingStepId) => boolean;
  /** Whether `id` still waits on a dependency. */
  isStepLocked: (id: OnboardingStepId) => boolean;
  /** Ticks a step off. */
  completeStep: (id: OnboardingStepId) => void;
  /** Progress across all steps, 0–100. */
  progressPercent: number;
  /** How many steps are done. */
  completedCount: number;
  /** How many steps there are in total. */
  totalCount: number;
}

/**
 * Drives the setup checklist.
 *
 * @returns The checklist state and the actions the page needs.
 */
export function useSetupChecklist(): SetupChecklist {
  const router = useRouter();
  const {
    isStepComplete,
    isStepLocked,
    markStepComplete,
    progressPercent,
    completedCount,
    totalCount,
    phase1Completed,
    isFullyComplete,
    isHydrated,
    completedSteps,
  } = useOnboarding();
  const { syncProgress } = useOnboardingSync();

  const [activeStep, setActiveStep] = useState<OnboardingStepId>("academic-year");

  const steps = useMemo(() => ONBOARDING_STEPS.filter((s) => s.phase === 2), []);

  // Phase 2 is only reachable once phase 1 is behind them.
  useEffect(() => {
    if (isHydrated && !phase1Completed) router.replace("/onboarding");
  }, [isHydrated, phase1Completed, router]);

  // Work already done elsewhere in the portal (or in a previous session) ticks
  // its step off, so nobody is asked to create a class they already have.
  useEffect(() => {
    if (!isHydrated || !phase1Completed) return;
    void syncProgress();
  }, [isHydrated, phase1Completed, syncProgress]);

  // Open the first step that is neither done nor waiting on a dependency.
  useEffect(() => {
    if (!isHydrated || !phase1Completed) return;
    const next = steps.find((s) => !isStepComplete(s.id) && !isStepLocked(s.id));
    if (next) setActiveStep(next.id);
  }, [completedSteps, isHydrated, phase1Completed, steps, isStepComplete, isStepLocked]);

  const completeStep = useCallback(
    (id: OnboardingStepId) => markStepComplete(id),
    [markStepComplete]
  );

  return {
    steps,
    activeStep,
    setActiveStep,
    isHydrated,
    isFullyComplete,
    phase1Completed,
    isStepComplete,
    isStepLocked,
    completeStep,
    progressPercent,
    completedCount,
    totalCount,
  };
}
