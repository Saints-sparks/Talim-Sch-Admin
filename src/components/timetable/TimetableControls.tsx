"use client";

/**
 * The term and class pickers, and the two write actions beside them.
 *
 * The term list is real data from the shared reference hooks rather than the
 * hard-coded years the page used to show. The timetable API has no term
 * dimension — `CreateTimetableDto` carries only class, course, day and time —
 * so the picker states the academic period the grid is being built for and
 * does not filter it; the tooltip says as much.
 *
 * Both write actions are hidden from a viewer without `manage:timetable`.
 */

import React from "react";
import { ChevronDown } from "lucide-react";
import { Copy } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Class } from "@/app/services/school.service";
import type { TermOption } from "./useTimetableBoard";

interface TimetableControlsProps {
  classes: Class[];
  isLoadingClasses: boolean;
  selectedClassId: string;
  onSelectClass: (classId: string) => void;

  termOptions: TermOption[];
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;

  canManage: boolean;
  hasCourses: boolean;
  isApplyingTemplate: boolean;
  onApplyTemplate: () => void;
  onAddEntry: () => void;
}

const SELECT_CLASSES =
  "appearance-none border border-[#E0E0E0] dark:border-slate-600 bg-transparent dark:bg-slate-800 text-[#1A1A1A] dark:text-slate-100 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60";

export function TimetableControls({
  classes,
  isLoadingClasses,
  selectedClassId,
  onSelectClass,
  termOptions,
  selectedTermId,
  onSelectTerm,
  canManage,
  hasCourses,
  isApplyingTemplate,
  onApplyTemplate,
  onAddEntry,
}: TimetableControlsProps) {
  return (
    <div
      className="bg-white dark:bg-slate-800 gap-4 p-4 mt-4 mb-6 border border-[#F2F2F2] dark:border-slate-700 rounded-xl"
      data-guide="timetable-controls"
    >
      <div className="bg-[#F8F8F8] dark:bg-slate-900/40 border border-[#F2F2F2] dark:border-slate-700 flex flex-wrap p-6 gap-4 items-center rounded-lg">
        <div className="relative">
          <Tooltip
            content="The academic period this timetable is being built for. Lessons themselves are stored per class, not per term."
            side="right"
          >
            <label
              htmlFor="timetable-term"
              className="block text-[15px] font-semibold text-[#4D4D4D] dark:text-slate-300 mb-1"
            >
              Session/Term
            </label>
          </Tooltip>
          <div className="relative">
            <select
              id="timetable-term"
              value={selectedTermId}
              onChange={(e) => onSelectTerm(e.target.value)}
              className={SELECT_CLASSES}
              disabled={termOptions.length === 0}
            >
              {termOptions.length === 0 ? (
                <option value="">No terms set up yet</option>
              ) : (
                termOptions.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.label}
                    {term.isCurrent ? " (current)" : ""}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <Tooltip content="Narrow the timetable to one class." side="right">
            <label
              htmlFor="timetable-class"
              className="block text-[15px] font-semibold text-[#4D4D4D] dark:text-slate-300 mb-1"
            >
              Class
            </label>
          </Tooltip>
          <div className="relative">
            <select
              id="timetable-class"
              value={selectedClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className={SELECT_CLASSES}
              disabled={isLoadingClasses}
            >
              <option value="">
                {isLoadingClasses ? "Loading classes..." : "Select a class..."}
              </option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>

        {canManage && (
          <>
            <Tooltip
              content="Fill the empty week with this class's courses, one per slot. Existing lessons are kept."
              side="top"
            >
              <button
                onClick={onApplyTemplate}
                disabled={isApplyingTemplate || !hasCourses}
                className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 text-[15px] font-semibold text-[#1A1A1A] dark:text-slate-100 border border-[#E0E0E0] dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors mt-6 disabled:opacity-60"
              >
                <Copy />
                {isApplyingTemplate ? "Applying..." : "Copy from Template"}
              </button>
            </Tooltip>
            <Tooltip
              content="Schedule a course session for a specific class, day, and time."
              side="top"
            >
              <button
                onClick={onAddEntry}
                disabled={!selectedClassId || !hasCourses}
                className="flex items-center gap-2 px-6 py-2 bg-[#003366] text-white text-[15px] font-semibold border border-[#003366] rounded-xl hover:bg-[#002244] transition-colors mt-6 disabled:opacity-60"
              >
                Add Entry
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
