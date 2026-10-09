/**
 * The left-hand rail of the setup screen: every phase-2 step, whether it is
 * done, locked or open, and the header that carries overall progress.
 */
"use client";

import Image from "next/legacy/image";
import { CheckCircle2, Circle, LayoutDashboard, Lock } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { OnboardingStep, OnboardingStepId } from "@/context/OnboardingContext";
import treelogo from "../../../public/img/treelogo.svg";

/** Props for {@link SetupHeader}. */
export interface SetupHeaderProps {
  /** Steps finished so far. */
  completedCount: number;
  /** Steps in the whole checklist. */
  totalCount: number;
  /** Progress across all steps, 0–100. */
  progressPercent: number;
  /** Leaves setup for the dashboard. */
  onDashboard: () => void;
}

/**
 * @param props - See {@link SetupHeaderProps}.
 * @returns The sticky setup header.
 */
export function SetupHeader({
  completedCount,
  totalCount,
  progressPercent,
  onDashboard,
}: SetupHeaderProps) {
  return (
    <header className="bg-tl-surface border-b border-tl-line-soft px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Image src={treelogo} alt="Talim" width={32} height={32} />
        <span className="font-bold text-tl-ink">School Setup</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-tl-line-soft bg-tl-surface px-3 py-2 text-sm font-semibold text-tl-ink shadow-sm transition hover:bg-tl-bg hover:text-tl-brand"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-tl-muted">
          <span className="font-semibold text-tl-brand">{completedCount}</span>
          <span>/ {totalCount} steps complete</span>
        </div>
        <Tooltip
          content="Shows how many setup steps you've completed. Required steps must be done before full access is available."
          side="top"
        >
          <div className="w-32 sm:w-48 bg-tl-line rounded-full h-2">
            <div
              className="h-2 rounded-full bg-tl-brand-fill transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Tooltip>
        <span className="text-sm font-bold text-tl-brand">{progressPercent}%</span>
      </div>
    </header>
  );
}

/** Props for {@link SetupChecklistRail}. */
export interface SetupChecklistRailProps {
  /** The phase-2 steps, in order. */
  steps: OnboardingStep[];
  /** The step currently open. */
  activeStep: OnboardingStepId;
  /** Whether a step is ticked off. */
  isStepComplete: (id: OnboardingStepId) => boolean;
  /** Whether a step still waits on a dependency. */
  isStepLocked: (id: OnboardingStepId) => boolean;
  /** Opens a step. */
  onSelect: (id: OnboardingStepId) => void;
}

/**
 * @param props - See {@link SetupChecklistRailProps}.
 * @returns The checklist rail.
 */
export function SetupChecklistRail({
  steps,
  activeStep,
  isStepComplete,
  isStepLocked,
  onSelect,
}: SetupChecklistRailProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-tl-surface rounded-2xl border border-tl-line-soft overflow-hidden lg:sticky lg:top-24">
        <div className="px-4 py-3 border-b border-tl-line-soft">
          <p className="text-xs font-semibold text-tl-faint uppercase tracking-wide">
            Setup checklist
          </p>
        </div>
        <ul className="py-2">
          {steps.map((step) => {
            const done = isStepComplete(step.id);
            const locked = !done && isStepLocked(step.id);
            const active = activeStep === step.id;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => !locked && onSelect(step.id)}
                  disabled={locked}
                  aria-current={active ? "step" : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    active
                      ? "bg-tl-select text-tl-brand"
                      : done
                        ? "text-tl-muted hover:bg-tl-bg"
                        : locked
                          ? "text-tl-faint cursor-not-allowed"
                          : "text-tl-body hover:bg-tl-bg"
                  }`}
                >
                  <span className="shrink-0">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-tl-success" />
                    ) : locked ? (
                      <Tooltip
                        content="Complete the required step(s) above before unlocking this one."
                        side="right"
                      >
                        <span>
                          <Lock className="h-4 w-4 text-tl-faint" />
                        </span>
                      </Tooltip>
                    ) : (
                      <Circle className={`h-4 w-4 ${active ? "text-tl-brand" : "text-tl-faint"}`} />
                    )}
                  </span>
                  <span
                    className={`text-sm leading-tight ${active ? "font-semibold" : "font-medium"}`}
                  >
                    {step.label}
                  </span>
                  {!step.required && (
                    <span className="ml-auto text-[10px] font-medium text-tl-faint bg-tl-track px-1.5 py-0.5 rounded-full shrink-0">
                      Optional
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
