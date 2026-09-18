/**
 * The card every setup step is rendered inside, plus the two cards that stand
 * in for one: a finished step and the end of the whole checklist.
 */
"use client";

import React from "react";
import {
  BookMarked,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutDashboard,
  Loader2,
  Lock,
  Megaphone,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { ONBOARDING_STEPS, type OnboardingStepId } from "@/context/OnboardingContext";

/** The icon shown in each step's header. */
export const STEP_ICONS: Record<OnboardingStepId, React.ReactNode> = {
  "school-profile": <Building2 className="h-5 w-5" />,
  "personal-profile": <UserRound className="h-5 w-5" />,
  "academic-year": <CalendarDays className="h-5 w-5" />,
  "create-class": <Building2 className="h-5 w-5" />,
  "add-teacher": <UserRound className="h-5 w-5" />,
  "add-student": <Users className="h-5 w-5" />,
  "create-subject": <BookOpen className="h-5 w-5" />,
  "create-course": <BookMarked className="h-5 w-5" />,
  "create-announcement": <Megaphone className="h-5 w-5" />,
  "timetable-entry": <Clock className="h-5 w-5" />,
  "create-assessment": <ClipboardList className="h-5 w-5" />,
};

/**
 * Looks a step up by id.
 *
 * @param stepId - The step to describe.
 * @returns Its definition from `ONBOARDING_STEPS`.
 */
export function stepDefinition(stepId: OnboardingStepId) {
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
  if (!step) throw new Error(`Unknown onboarding step: ${stepId}`);
  return step;
}

/**
 * Titled card wrapper for one step.
 *
 * @param props.stepId - Which step is being shown.
 * @param props.children - The step's form or call to action.
 * @returns The card.
 */
export function StepCard({
  stepId,
  children,
}: {
  stepId: OnboardingStepId;
  children: React.ReactNode;
}) {
  const step = stepDefinition(stepId);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 dark:border-slate-700">
        <div className="p-2 bg-[#EAF2FB] rounded-xl text-[#003366] dark:bg-blue-900/30 dark:text-blue-200">
          {STEP_ICONS[stepId]}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{step.label}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{step.description}</p>
        </div>
        {!step.required && (
          <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full shrink-0 dark:bg-slate-800 dark:text-slate-400">
            Optional
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/**
 * Shown in place of a step's form once it is complete.
 *
 * @param props.stepId - The finished step.
 * @returns The confirmation card.
 */
export function StepDoneCard({ stepId }: { stepId: OnboardingStepId }) {
  const step = stepDefinition(stepId);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center gap-4 dark:bg-slate-900 dark:border-slate-700">
      <CheckCircle2 className="h-14 w-14 text-green-500" />
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{step.label} — Done!</h2>
        <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">{step.description}</p>
      </div>
    </div>
  );
}

/**
 * Shown while a step is working out whether it has already been satisfied.
 *
 * @param props.stepId - The step being checked.
 * @param props.message - What is being looked up.
 * @returns The card with a spinner.
 */
export function StepCheckingCard({ stepId, message }: { stepId: OnboardingStepId; message: string }) {
  return (
    <StepCard stepId={stepId}>
      <div className="flex items-center gap-3 py-4 text-sm text-gray-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> {message}
      </div>
    </StepCard>
  );
}

/**
 * Shown when the signed-in administrator's role cannot perform this step, so
 * they are told rather than handed a form the API would refuse.
 *
 * @param props.stepId - The step they cannot do.
 * @returns The explanation card.
 */
export function StepNotPermittedCard({ stepId }: { stepId: OnboardingStepId }) {
  const step = stepDefinition(stepId);
  return (
    <StepCard stepId={stepId}>
      <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Your account can&apos;t complete &ldquo;{step.label}&rdquo;. Ask your school administrator
          to finish this step, or to grant you the permission it needs.
        </p>
      </div>
    </StepCard>
  );
}

/**
 * The end of the checklist.
 *
 * @param props.onDashboard - Sends the admin to the dashboard.
 * @returns The completion card.
 */
export function CompletionCard({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center text-center gap-6 dark:bg-slate-900 dark:border-slate-700">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[#EAF2FB] flex items-center justify-center dark:bg-blue-900/30">
          <Trophy className="h-10 w-10 text-[#003366] dark:text-blue-200" />
        </div>
        <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">You&apos;re all set!</h2>
        <p className="text-gray-500 mt-2 max-w-sm dark:text-slate-400">
          Your school is fully configured. You can manage everything from the dashboard or come back
          to any section at any time.
        </p>
      </div>
      <button
        onClick={onDashboard}
        className="flex items-center gap-2 h-12 px-8 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xl transition-colors"
      >
        <LayoutDashboard className="h-5 w-5" /> Go to Dashboard
      </button>
    </div>
  );
}
