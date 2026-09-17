"use client";

import { ClassSelector } from "../ClassSelector";
import { totalCapacity } from "../formatters";
import type { FeeClass } from "../types";
import { cardClass, headingClass, mutedTextClass } from "../ui";

interface SelectClassesStepProps {
  classes: FeeClass[];
  loading: boolean;
  error: unknown;
  selected: Set<string>;
  onToggle: (classId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/**
 * Step 2: which classes the fee goes to.
 *
 * @param props - The classes, their load state and the selection handlers.
 * @returns The step.
 */
export function SelectClassesStep({
  classes,
  loading,
  error,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: SelectClassesStepProps) {
  const students = totalCapacity(classes.filter((entry) => selected.has(entry._id)));

  return (
    <div className={`${cardClass} p-6 space-y-5`}>
      <div>
        <h2 className={`font-semibold ${headingClass}`}>2. Select Classes</h2>
        <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
          Select one or more classes to assign this fee.
        </p>
      </div>

      <ClassSelector
        classes={classes}
        loading={loading}
        error={error}
        selected={selected}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        onClear={onClear}
      />

      {selected.size > 0 && (
        <div className="pt-2 border-t border-gray-50 dark:border-gray-800">
          <span className={`text-sm ${mutedTextClass}`}>
            Selected Classes ({selected.size}) · Total Students: {students}
          </span>
        </div>
      )}
    </div>
  );
}
