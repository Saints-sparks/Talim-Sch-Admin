"use client";

import React from "react";
import { Check, UsersRound } from "lucide-react";
import type { RosterClassesResult } from "@/hooks/users/useRosterClasses";
import { Pill, chip } from "@/components/tl";
import { blockClass, mutedTextClass, navyTextClass } from "../../create/ui";

/** Props for {@link TeacherClassPicker}. */
interface TeacherClassPickerProps {
  /** The school's classes and their load state. */
  classes: RosterClassesResult;
  /** Ids of the classes already chosen. */
  selected: string[];
  /** Adds or removes a class. */
  onToggle: (classId: string) => void;
}

/**
 * "Teaching Assignments" card: pick the classes a teacher supports. The list
 * comes from the cached classes query; loading and failure each get a message
 * instead of an empty box.
 *
 * @param props - Classes query result, chosen ids and the toggle handler.
 * @param props.classes - The classes query.
 * @param props.selected - The chosen ids.
 * @param props.onToggle - Toggle handler.
 * @returns The card.
 */
export function TeacherClassPicker({ classes, selected, onToggle }: TeacherClassPickerProps) {
  const emptyBox =
    "rounded-2xl border border-dashed border-tl-control bg-tl-subtle px-4 py-8 text-center text-sm text-tl-muted";

  return (
    <section className={blockClass}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-tl-ink">
            <UsersRound className={`h-4 w-4 ${navyTextClass}`} aria-hidden />
            Teaching Assignments
          </h3>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>
            Select the classes this teacher can support. Course and subject links still happen from
            course setup. Picking a class does not make them its class teacher: only a class&apos;s
            class teacher can take its morning register, and that is set on the class&apos;s page.
          </p>
        </div>
        <Pill tone="info">{selected.length} selected</Pill>
      </div>

      {classes.isPending ? (
        <div className={emptyBox}>Loading classes...</div>
      ) : classes.isError ? (
        <div className={emptyBox} role="alert">
          We couldn&apos;t load your classes.{" "}
          <button
            type="button"
            onClick={classes.refetch}
            className="font-bold text-tl-link underline"
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
                className={`${chip(isSelected)} w-full justify-between text-left`}
              >
                <span className="min-w-0 truncate">{classItem.name}</span>
                <span
                  aria-hidden
                  className={`ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-tl-brand-fill bg-tl-brand-fill text-tl-on-brand"
                      : "border-tl-control bg-tl-surface text-transparent"
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
