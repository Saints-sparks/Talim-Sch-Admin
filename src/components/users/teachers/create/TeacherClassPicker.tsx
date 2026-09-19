"use client";

import React from "react";
import { Check, UsersRound } from "lucide-react";
import type { RosterClassesResult } from "@/hooks/users/useRosterClasses";
import { mutedTextClass, navyTextClass } from "../../create/ui";

interface TeacherClassPickerProps {
  /** The school's classes and their load state. */
  classes: RosterClassesResult;
  /** Ids of the classes already chosen. */
  selected: string[];
  onToggle: (classId: string) => void;
}

/**
 * "Teaching Assignments" card: pick the classes a teacher supports. The list
 * comes from the cached classes query; loading and failure each get a message
 * instead of an empty box.
 *
 * @param props - Classes query result, chosen ids and the toggle handler.
 * @returns The card.
 */
export function TeacherClassPicker({ classes, selected, onToggle }: TeacherClassPickerProps) {
  const emptyBox =
    "rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400";

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
            <UsersRound className={`h-4 w-4 ${navyTextClass}`} />
            Teaching Assignments
          </h4>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>
            Select the classes this teacher can support. Course and subject links still happen from
            course setup.
          </p>
        </div>
        <span className="rounded-full bg-[#003366]/10 dark:bg-blue-400/15 px-3 py-1 text-xs font-semibold text-[#003366] dark:text-blue-300">
          {selected.length} selected
        </span>
      </div>

      {classes.isPending ? (
        <div className={emptyBox}>Loading classes...</div>
      ) : classes.isError ? (
        <div className={emptyBox} role="alert">
          We couldn&apos;t load your classes.{" "}
          <button
            type="button"
            onClick={classes.refetch}
            className="font-semibold text-[#003366] dark:text-blue-300 underline"
          >
            Try again
          </button>
        </div>
      ) : classes.classes.length === 0 ? (
        <div className={emptyBox}>No classes available yet.</div>
      ) : (
        <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {classes.classes.map((classItem) => {
            const isSelected = selected.includes(classItem._id);
            return (
              <button
                key={classItem._id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(classItem._id)}
                className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? "border-[#003366] dark:border-blue-400 bg-[#EAF2FB] dark:bg-blue-950/50 text-[#003366] dark:text-blue-200 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-[#003366]/40 hover:bg-white dark:hover:bg-gray-700"
                }`}
              >
                <span className="min-w-0 truncate text-sm font-medium">{classItem.name}</span>
                <span
                  className={`ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#003366] dark:border-blue-400 bg-[#003366] dark:bg-blue-500 text-white"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
