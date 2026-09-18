/**
 * The dashboard's setup card: how far through the checklist the school is, the
 * next few steps, and the way back into setup.
 *
 * It reads progress straight from the onboarding context, so it stays in step
 * with the setup screen without a request of its own.
 */
"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ArrowRight, Trophy, X, Zap, Rocket } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useOnboarding, ONBOARDING_STEPS } from "@/context/OnboardingContext";

/**
 * @returns The setup progress card, or `null` once setup is done and dismissed.
 */
export default function SetupProgressWidget() {
  const router = useRouter();
  const {
    progressPercent,
    completedCount,
    totalCount,
    isStepComplete,
    isFullyComplete,
    setupDismissed,
    dismissSetup,
    phase1Completed,
  } = useOnboarding();

  if (isFullyComplete && setupDismissed) return null;

  // New users who haven't completed Phase 1 — show a "Get started" CTA
  if (!phase1Completed) {
    return (
      <div className="bg-gradient-to-r from-[#003366] to-[#004080] rounded-2xl shadow-sm p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Rocket className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Complete your school setup</p>
          <p className="text-xs text-blue-200 mt-0.5">Add your first class, teachers, and subjects to get started.</p>
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="flex items-center gap-1.5 bg-white text-[#003366] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
        >
          Start <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Show a minimal "all done" badge once fully complete
  if (isFullyComplete) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700">
        <div className="w-10 h-10 rounded-full bg-[#EAF2FB] flex items-center justify-center shrink-0 dark:bg-blue-900/30">
          <Trophy className="h-5 w-5 text-[#003366] dark:text-blue-200" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">School setup complete!</p>
          <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">All {totalCount} steps done. Your school is fully configured.</p>
        </div>
        <button
          onClick={dismissSetup}
          className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 dark:text-slate-600 dark:hover:text-slate-400"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Show visible steps: last 2 completed + next 3 pending
  const phase2Steps = ONBOARDING_STEPS.filter((s) => s.phase === 2);
  const pending = phase2Steps.filter((s) => !isStepComplete(s.id));
  const recentDone = phase2Steps.filter((s) => isStepComplete(s.id)).slice(-2);
  const visibleSteps = [...recentDone, ...pending.slice(0, 3)];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-700">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Tooltip content="Your school setup checklist. Complete all required steps to unlock the full experience." side="right">
            <Zap className="h-4 w-4 text-[#003366] dark:text-blue-300" />
            </Tooltip>
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Setup progress</span>
          </div>
          <span className="text-sm font-bold text-[#003366] dark:text-blue-300">{progressPercent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-[#003366] transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 mt-2 dark:text-slate-500">
          {completedCount} of {totalCount} steps complete
        </p>
      </div>

      {/* Step list */}
      <ul className="px-5 pb-4 space-y-2">
        {visibleSteps.map((step) => {
          const done = isStepComplete(step.id);
          return (
            <li key={step.id} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-[#003366] shrink-0 dark:text-blue-300" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 shrink-0 dark:text-slate-600" />
              )}
              <span
                className={`text-sm leading-tight ${
                  done
                    ? "line-through text-gray-400 dark:text-slate-500"
                    : "text-gray-700 font-medium dark:text-slate-300"
                }`}
              >
                {step.label}
              </span>
              {!step.required && !done && (
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0 dark:bg-slate-800 dark:text-slate-500">
                  Optional
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      <div className="border-t border-gray-100 px-5 py-3 dark:border-slate-800">
        <Tooltip content="Resume where you left off in the setup checklist." side="top">
        <button
          onClick={() => router.push("/onboarding/setup")}
          className="flex items-center gap-2 text-sm font-semibold text-[#003366] hover:underline dark:text-blue-300"
        >
          Continue setup <ArrowRight className="h-4 w-4" />
        </button>
        </Tooltip>
      </div>
    </div>
  );
}
