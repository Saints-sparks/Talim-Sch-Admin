"use client";

import { FiCheck } from "react-icons/fi";
import { ASSIGN_STEPS } from "@/hooks/fees/assignWizard";

/**
 * The numbered progress row above the assign wizard.
 *
 * @param props - The zero-based index of the current step.
 * @returns The indicator.
 */
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-0 mb-8 overflow-x-auto">
      {ASSIGN_STEPS.map((label, index) => (
        <li key={label} className="flex items-center shrink-0">
          <div className="flex items-center gap-2">
            <span
              aria-current={index === current ? "step" : undefined}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                index < current
                  ? "bg-[#003366] border-[#003366] text-white dark:bg-blue-500 dark:border-blue-500"
                  : index === current
                    ? "border-[#003366] text-[#003366] bg-white dark:bg-gray-900 dark:border-blue-400 dark:text-blue-300"
                    : "border-gray-200 text-gray-400 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-500"
              }`}
            >
              {index < current ? <FiCheck size={13} /> : index + 1}
            </span>
            <span
              className={`text-sm font-medium whitespace-nowrap ${
                index === current
                  ? "text-[#003366] dark:text-blue-300"
                  : index < current
                    ? "text-gray-600 dark:text-gray-300"
                    : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {label}
            </span>
          </div>
          {index < ASSIGN_STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-2 ${
                index < current ? "bg-[#003366] dark:bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
