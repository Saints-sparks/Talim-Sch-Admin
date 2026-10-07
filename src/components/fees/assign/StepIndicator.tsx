"use client";

import { FiCheck } from "react-icons/fi";
import { ASSIGN_STEPS } from "@/hooks/fees/assignWizard";

/**
 * The numbered progress row above the assign wizard: done steps in navy with
 * a tick, the current one outlined, the rest grey. Scrolls sideways on a
 * phone rather than widening the page.
 *
 * @param props - The zero-based index of the current step.
 * @param props.current - The current step.
 * @returns The indicator.
 */
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol
      aria-label="Steps"
      className="flex items-center overflow-x-auto rounded-[18px] border border-tl-line bg-tl-surface px-4 py-3"
    >
      {ASSIGN_STEPS.map((label, index) => (
        <li key={label} className="flex shrink-0 items-center">
          <div className="flex items-center gap-2">
            <span
              aria-current={index === current ? "step" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                index < current
                  ? "border-tl-brand-fill bg-tl-brand-fill text-tl-on-brand"
                  : index === current
                    ? "border-tl-brand bg-tl-select text-tl-brand"
                    : "border-tl-line bg-tl-surface text-tl-faint"
              }`}
            >
              {index < current ? <FiCheck size={14} aria-hidden /> : index + 1}
            </span>
            <span
              className={`whitespace-nowrap text-sm font-bold ${
                index === current
                  ? "text-tl-brand"
                  : index < current
                    ? "text-tl-body"
                    : "text-tl-muted"
              }`}
            >
              {label}
            </span>
          </div>
          {index < ASSIGN_STEPS.length - 1 && (
            <div
              aria-hidden
              className={`mx-3 h-0.5 w-8 rounded-full ${index < current ? "bg-tl-brand-fill" : "bg-tl-line"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
