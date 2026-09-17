"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { SectionSkeleton } from "@/components/ui/loading";
import { feesErrorMessage } from "./errors";
import type { FeeClass } from "./types";
import { inputClass, mutedTextClass } from "./ui";

interface ClassSelectorProps {
  classes: FeeClass[];
  loading: boolean;
  error: unknown;
  /** Ids of the classes currently ticked. */
  selected: Set<string>;
  onToggle: (classId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  /** False for a viewer without MANAGE_FEES: the grid is read-only. */
  disabled?: boolean;
}

/**
 * The grid of class cards used by both the create form and the assign wizard,
 * with search and select-all.
 *
 * @param props - The classes, their load state and the selection handlers.
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

  if (loading) return <SectionSkeleton rows={3} rowClassName="h-16" />;
  if (error) {
    return <p className="text-sm text-red-500">{feesErrorMessage(error, "classes")}</p>;
  }
  if (classes.length === 0) {
    return (
      <p className={`text-sm ${mutedTextClass}`}>
        No classes yet. Create a class before assigning fees.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className={`flex items-center gap-2 text-sm cursor-pointer ${mutedTextClass}`}>
          <input
            type="checkbox"
            checked={allSelected}
            disabled={disabled}
            onChange={allSelected ? onClear : onSelectAll}
            className="w-4 h-4 rounded accent-[#003366]"
          />
          Select All Classes
        </label>
        <div className="relative">
          <FiSearch
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={13}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search classes..."
            aria-label="Search classes"
            className={`${inputClass} pl-7 py-1.5 text-xs`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={`text-xs ${mutedTextClass}`}>No class matches “{search}”.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map((cls) => {
            const checked = selected.has(cls._id);
            return (
              <button
                key={cls._id}
                type="button"
                disabled={disabled}
                aria-pressed={checked}
                onClick={() => onToggle(cls._id)}
                className={`relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all disabled:opacity-60 ${
                  checked
                    ? "border-[#003366] bg-[#003366]/5 dark:border-blue-400 dark:bg-blue-400/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  tabIndex={-1}
                  aria-hidden
                  className="absolute top-2 left-2 w-4 h-4 rounded accent-[#003366]"
                />
                <span className="pl-6 text-sm font-medium text-gray-800 dark:text-gray-100">
                  {cls.name}
                </span>
                <span className="pl-6 text-xs text-gray-400 dark:text-gray-500">
                  {cls.classCapacity ?? 0} Students
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center justify-between">
          <span className={`text-xs ${mutedTextClass}`}>Selected Classes ({selected.size})</span>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
