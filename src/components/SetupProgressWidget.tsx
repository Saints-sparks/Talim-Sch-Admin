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
import { Pill, card, cardTitle, iconButton, primaryButton, textLink } from "@/components/tl";

/**
 * The setup card on a full administrator's dashboard: a "Complete your school
 * setup" call to action before the first phase is done, the progress bar with
 * the next few steps while setup runs, and a dismissible "School setup
 * complete!" card at the end.
 *
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
      <section className={`${card} flex flex-wrap items-center gap-4`}>
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tl-select text-tl-brand"
        >
          <Rocket className="h-5 w-5" />
        </span>
        <div className="min-w-[200px] flex-1">
          <h2 className={cardTitle}>Complete your school setup</h2>
          <p className="mt-1 text-[13px] text-tl-muted">
            Add your first class, teachers, and subjects to get started.
          </p>
        </div>
        <button type="button" onClick={() => router.push("/onboarding")} className={primaryButton}>
          Start <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </section>
    );
  }

  // Show a minimal "all done" badge once fully complete
  if (isFullyComplete) {
    return (
      <section className={`${card} flex items-center gap-4`}>
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tl-success-bg text-tl-success"
        >
          <Trophy className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cardTitle}>School setup complete!</h2>
          <p className="mt-1 text-[13px] text-tl-muted">
            All {totalCount} steps done. Your school is fully configured.
          </p>
        </div>
        <button type="button" onClick={dismissSetup} className={iconButton} aria-label="Dismiss">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </section>
    );
  }

  // Show visible steps: last 2 completed + next 3 pending
  const phase2Steps = ONBOARDING_STEPS.filter((s) => s.phase === 2);
  const pending = phase2Steps.filter((s) => !isStepComplete(s.id));
  const recentDone = phase2Steps.filter((s) => isStepComplete(s.id)).slice(-2);
  const visibleSteps = [...recentDone, ...pending.slice(0, 3)];
  const pct = Math.max(0, Math.min(100, Math.round(progressPercent)));

  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h2 className={`${cardTitle} flex items-center gap-2`}>
            <Tooltip
              content="Your school setup checklist. Complete all required steps to unlock the full experience."
              side="right"
            >
              <Zap className="h-[18px] w-[18px] text-tl-brand" />
            </Tooltip>
            Setup progress
          </h2>
          <p className="mt-1 text-[13px] text-tl-muted">
            {completedCount} of {totalCount} steps complete
          </p>
        </div>
        <div className="text-[22px] font-extrabold text-tl-brand tabular-nums">
          {progressPercent}%
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-3.5 h-2 overflow-hidden rounded bg-tl-line-soft"
      >
        <div
          className="h-full rounded bg-tl-brand-fill transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {visibleSteps.map((step) => {
          const done = isStepComplete(step.id);
          return (
            <li key={step.id} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-tl-success" aria-hidden />
              ) : (
                <Circle className="h-[18px] w-[18px] shrink-0 text-tl-faint" aria-hidden />
              )}
              <span
                className={`text-sm leading-tight ${
                  done ? "text-tl-muted line-through" : "font-bold text-tl-body"
                }`}
              >
                {step.label}
                {done ? <span className="sr-only"> (done)</span> : null}
              </span>
              {!step.required && !done && (
                <Pill tone="muted" className="ml-auto">
                  Optional
                </Pill>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-tl-line-soft pt-1">
        <Tooltip content="Resume where you left off in the setup checklist." side="top">
          <button
            type="button"
            onClick={() => router.push("/onboarding/setup")}
            className={textLink}
          >
            Continue setup <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </Tooltip>
      </div>
    </section>
  );
}
