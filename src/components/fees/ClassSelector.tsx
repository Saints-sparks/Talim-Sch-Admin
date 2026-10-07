"use client";

import { useMemo, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { SearchField, focusRing, quietButton, skeletonBlock } from "@/components/tl";
import { cn } from "@/lib/utils";
import { feesErrorMessage } from "./errors";
import type { FeeClass } from "./types";

/** Props for {@link ClassSelector}. */
interface ClassSelectorProps {
  /** The school's classes. */
  classes: FeeClass[];
  /** True while they load. */
  loading: boolean;
  /** What the load threw, if it failed. */
  error: unknown;
  /** Ids of the classes currently ticked. */
  selected: Set<string>;
  /** Ticks or unticks one class. */
  onToggle: (classId: string) => void;
  /** Ticks every class. */
  onSelectAll: () => void;
  /** Unticks every class. */
  onClear: () => void;
  /** False for a viewer without MANAGE_FEES: the grid is read-only. */
  disabled?: boolean;
}

/**
 * The grid of class cards used by both the create form and the assign wizard,
 * with search and select-all.
 *
 * @param props - The classes, their load state and the selection handlers.
 * @param props.classes - The classes.
 * @param props.loading - Whether they are loading.
 * @param props.error - The load error.
 * @param props.selected - The ticked classes.
 * @param props.onToggle - Ticks or unticks one.
 * @param props.onSelectAll - Ticks all.
 * @param props.onClear - Unticks all.
 * @param props.disabled - Whether the grid is read-only.
 * @returns The selector.
 */
export function ClassSelector({
  classes,
  loading,
  error,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  disabled = false,
}: ClassSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((cls) => cls.name.toLowerCase().includes(term));
  }, [classes, search]);

  const allSelected = classes.length > 0 && selected.size === classes.length;

  if (loading) {
    return (
      <div role="status" aria-busy="true" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <span className="sr-only">Loading classes</span>
        {[0, 1, 2, 3].map((cell) => (
          <div key={cell} aria-hidden className={`${skeletonBlock} h-16 rounded-2xl`} />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-sm font-semibold text-tl-danger">{feesErrorMessage(error, "classes")}</p>
    );
  }
  if (classes.length === 0) {
    return (
      <p className="text-sm text-tl-muted">No classes yet. Create a class before assigning fees.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm font-bold text-tl-body">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={disabled}
            onChange={allSelected ? onClear : onSelectAll}
            className="h-4 w-4 rounded accent-tl-brand"
          />
          Select All Classes
        </label>
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search classes"
          placeholder="Search classes..."
          className="w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-tl-muted">No class matches “{search}”.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {filtered.map((cls) => {
            const checked = selected.has(cls._id);
            return (
              <button
                key={cls._id}
                type="button"
                disabled={disabled}
                aria-pressed={checked}
                onClick={() => onToggle(cls._id)}
                className={`flex min-h-[64px] items-start gap-2.5 rounded-2xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
                  checked
                    ? "border-tl-control bg-tl-select"
                    : "border-tl-line bg-tl-surface hover:bg-tl-subtle"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${
                    checked
                      ? "border-tl-brand-fill bg-tl-brand-fill text-tl-on-brand"
                      : "border-tl-control bg-tl-surface"
                  }`}
                >
                  {checked && <FiCheck size={12} />}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-bold text-tl-ink">{cls.name}</span>
                  <span className="text-[13px] text-tl-muted">
                    {cls.classCapacity ?? 0} Students
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] text-tl-muted">Selected Classes ({selected.size})</span>
          <button
            type="button"
            onClick={onClear}
            className={cn(quietButton, "text-tl-danger hover:bg-tl-danger-bg hover:text-tl-danger")}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
