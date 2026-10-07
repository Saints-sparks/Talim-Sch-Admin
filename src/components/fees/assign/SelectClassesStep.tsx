"use client";

import { ClassSelector } from "../ClassSelector";
import { totalCapacity } from "../formatters";
import type { FeeClass } from "../types";
import { CardHeader, card } from "@/components/tl";

/** Props for {@link SelectClassesStep}. */
interface SelectClassesStepProps {
  /** The school's classes. */
  classes: FeeClass[];
  /** True while they load. */
  loading: boolean;
  /** What the load threw, if it failed. */
  error: unknown;
  /** The ticked classes. */
  selected: Set<string>;
  /** Ticks or unticks one class. */
  onToggle: (classId: string) => void;
  /** Ticks every class. */
  onSelectAll: () => void;
  /** Unticks every class. */
  onClear: () => void;
}

/**
 * Step 2: which classes the fee goes to.
 *
 * @param props - The classes, their load state and the selection handlers.
 * @param props.classes - The classes.
 * @param props.loading - Whether they are loading.
 * @param props.error - The load error.
 * @param props.selected - The ticked classes.
 * @param props.onToggle - Ticks or unticks one.
 * @param props.onSelectAll - Ticks all.
 * @param props.onClear - Unticks all.
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
    <section className={`${card} flex flex-col gap-5`}>
      <CardHeader title="2. Select Classes" subtitle="Select one or more classes to assign this fee." />

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
        <div className="border-t border-tl-line-soft pt-3">
          <span className="text-sm font-semibold text-tl-body">
            Selected Classes ({selected.size}) · Total Students: {students}
          </span>
        </div>
      )}
    </section>
  );
}
