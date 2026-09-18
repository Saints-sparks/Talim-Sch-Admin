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
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <Image src={treelogo} alt="Talim" width={32} height={32} />
        <span className="font-bold text-[#030E18] dark:text-slate-100">School Setup</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-[#030E18] shadow-sm transition hover:bg-[#F7F7F7] hover:text-[#003366] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <span className="font-semibold text-[#003366] dark:text-blue-300">{completedCount}</span>
          <span>/ {totalCount} steps complete</span>
        </div>
        <Tooltip
          content="Shows how many setup steps you've completed. Required steps must be done before full access is available."
          side="top"
        >
          <div className="w-32 sm:w-48 bg-gray-200 rounded-full h-2 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-[#003366] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Tooltip>
        <span className="text-sm font-bold text-[#003366] dark:text-blue-300">
          {progressPercent}%
        </span>
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
    <aside className="w-64 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24 dark:bg-slate-900 dark:border-slate-700">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide dark:text-slate-500">
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
                      ? "bg-[#EAF2FB] text-[#003366] dark:bg-blue-900/30 dark:text-blue-200"
                      : done
                      ? "text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      : locked
                      ? "text-gray-300 cursor-not-allowed dark:text-slate-600"
                      : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="shrink-0">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : locked ? (
                      <Tooltip
                        content="Complete the required step(s) above before unlocking this one."
                        side="right"
                      >
                        <span>
                          <Lock className="h-4 w-4 text-gray-300 dark:text-slate-600" />
                        </span>
                      </Tooltip>
                    ) : (
                      <Circle
                        className={`h-4 w-4 ${
                          active ? "text-[#003366] dark:text-blue-300" : "text-gray-300 dark:text-slate-600"
                        }`}
                      />
                    )}
                  </span>
                  <span
                    className={`text-sm leading-tight ${active ? "font-semibold" : "font-medium"}`}
                  >
                    {step.label}
                  </span>
                  {!step.required && (
                    <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0 dark:bg-slate-800 dark:text-slate-500">
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
