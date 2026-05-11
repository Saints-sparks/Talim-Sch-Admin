"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ArrowRight, Trophy, X, Zap } from "lucide-react";
import { useOnboarding, ONBOARDING_STEPS } from "@/context/OnboardingContext";

export default function SetupProgressWidget() {
  const router = useRouter();
  const {
    completedSteps,
    progressPercent,
    completedCount,
    totalCount,
    isStepComplete,
    isFullyComplete,
    setupDismissed,
    dismissSetup,
    phase1Completed,
  } = useOnboarding();

  // Hide if admin never started onboarding or fully dismissed after completion
  if (!phase1Completed) return null;
  if (isFullyComplete && setupDismissed) return null;

  // Show a minimal "all done" badge once fully complete
  if (isFullyComplete) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#EAF2FB] flex items-center justify-center shrink-0">
          <Trophy className="h-5 w-5 text-[#003366]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">School setup complete!</p>
          <p className="text-xs text-gray-500 mt-0.5">All {totalCount} steps done. Your school is fully configured.</p>
        </div>
        <button
          onClick={dismissSetup}
          className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#003366]" />
            <span className="text-sm font-bold text-gray-900">Setup progress</span>
          </div>
          <span className="text-sm font-bold text-[#003366]">{progressPercent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="h-2 rounded-full bg-[#003366] transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 mt-2">
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
                <CheckCircle2 className="h-4 w-4 text-[#003366] shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 shrink-0" />
              )}
              <span
                className={`text-sm leading-tight ${
                  done ? "line-through text-gray-400" : "text-gray-700 font-medium"
                }`}
              >
                {step.label}
              </span>
              {!step.required && !done && (
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                  Optional
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      <div className="border-t border-gray-100 px-5 py-3">
        <button
          onClick={() => router.push("/onboarding/setup")}
          className="flex items-center gap-2 text-sm font-semibold text-[#003366] hover:underline"
        >
          Continue setup <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
