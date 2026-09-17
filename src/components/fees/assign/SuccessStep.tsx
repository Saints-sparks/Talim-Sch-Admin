"use client";

import { FiCheck } from "react-icons/fi";
import { formatNaira } from "../formatters";
import { brandTextClass, cardClass, headingClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from "../ui";

interface SuccessStepProps {
  feeName: string;
  /** How many assignments the API actually created. */
  assigned: number;
  /** Classes that already carried this fee and were left alone. */
  skipped: number;
  studentCount: number;
  totalAmount: number;
  onGoBack: () => void;
  onAssignAnother: () => void;
}

/**
 * The confirmation shown after the assignments are created.
 *
 * @param props - What was assigned, and where to go next.
 * @returns The success panel.
 */
export function SuccessStep({
  feeName,
  assigned,
  skipped,
  studentCount,
  totalAmount,
  onGoBack,
  onAssignAnother,
}: SuccessStepProps) {
  return (
    <div className={`${cardClass} p-12 flex flex-col items-center text-center space-y-5`}>
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
        <FiCheck className="text-green-600 dark:text-green-400" size={28} />
      </div>
      <div>
        <h2 className={`text-xl font-bold ${headingClass}`}>Fee Assigned Successfully!</h2>
        <p className={`text-sm mt-1 ${mutedTextClass}`}>
          {feeName} has been assigned to {assigned} class{assigned === 1 ? "" : "es"}.
          {skipped > 0 && ` ${skipped} class${skipped === 1 ? "" : "es"} already had it and ${skipped === 1 ? "was" : "were"} left unchanged.`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Total Classes</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{assigned}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{studentCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Total Amount</p>
          <p className={`text-lg font-bold ${brandTextClass}`}>{formatNaira(totalAmount)}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={onGoBack}
          className={`px-5 py-2 text-sm rounded-xl ${primaryButtonClass}`}
        >
          Go to Fees Management
        </button>
        <button
          type="button"
          onClick={onAssignAnother}
          className={`px-5 py-2 text-sm rounded-xl ${secondaryButtonClass}`}
        >
          Assign Another Fee
        </button>
      </div>
    </div>
  );
}
