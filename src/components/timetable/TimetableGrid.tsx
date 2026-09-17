"use client";

/**
 * The week grid — five day columns against seven hourly rows.
 *
 * The grid scrolls inside its own container rather than scrolling the page, so
 * the class picker and the course palette stay put while a long week is read.
 *
 * A lesson card keeps one colour, derived from its course id, so the card does
 * not change appearance every time the grid re-renders.
 */

import React from "react";
import { BookOpen, Flash, Trash } from "@/components/Icons";
import {
  TIME_SLOTS,
  WEEK_DAYS,
  colorForCourse,
  entryForSlot,
  type TimeSlot,
  type TimetableEntry,
  type TimetableGridData,
} from "./timetable.model";

interface TimetableGridProps {
  grid: TimetableGridData;
  canManage: boolean;
  /** Id of the entry currently being deleted, so its card can show as busy. */
  deletingEntryId: string | null;
  onDropCourse: (day: string, slot: TimeSlot) => void;
  onRemoveEntry: (entry: TimetableEntry) => void;
}

export function TimetableGrid({
  grid,
  canManage,
  deletingEntryId,
  onDropCourse,
  onRemoveEntry,
}: TimetableGridProps) {
  return (
    <>
      {/* Grid Header */}
      <div className="grid grid-cols-6 border-b border-gray-200 dark:border-slate-700">
        <div className="p-4 font-medium text-[15px] text-[#030E18] dark:text-slate-100">Time</div>
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="p-4 font-medium text-[#030E18] dark:text-slate-100 text-center text-[15px] last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      {TIME_SLOTS.map((timeSlot) => (
        <div
          key={timeSlot.label}
          className="grid grid-cols-6 border-b border-[#F0F0F0] dark:border-slate-700 last:border-b-0"
        >
          <div className="p-4 font-medium text-[#4D4D4D] dark:text-slate-400 text-[15px] flex items-center justify-center border-r border-[#F0F0F0] dark:border-slate-700">
            {timeSlot.label}
          </div>
          {WEEK_DAYS.map((day) => {
            const entry = entryForSlot(grid, day, timeSlot);
            return (
              <div
                key={`${day}-${timeSlot.label}`}
                className="p-2 border-r border-[#F0F0F0] dark:border-slate-700 last:border-r-0 h-[121px] relative"
                onDragOver={canManage ? (e) => e.preventDefault() : undefined}
                onDrop={
                  canManage
                    ? (e) => {
                        e.preventDefault();
                        onDropCourse(day, timeSlot);
                      }
                    : undefined
                }
              >
                {entry ? (
                  <LessonCard
                    entry={entry}
                    canManage={canManage}
                    isDeleting={Boolean(entry._id) && entry._id === deletingEntryId}
                    onRemove={() => onRemoveEntry(entry)}
                  />
                ) : (
                  <div
                    className={`h-full border border-dashed border-[#E0E0E0] dark:border-slate-600 bg-[#F2F2F2] dark:bg-slate-900/40 rounded-lg flex items-center justify-center transition-colors ${
                      canManage
                        ? "hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="text-[15px] flex flex-col gap-3 text-[#4D4D4D] dark:text-slate-400 font-medium justify-center items-center">
                      <Flash />
                      {canManage ? "Drop here" : "Free"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

interface LessonCardProps {
  entry: TimetableEntry;
  canManage: boolean;
  isDeleting: boolean;
  onRemove: () => void;
}

/** One scheduled lesson. */
function LessonCard({ entry, canManage, isDeleting, onRemove }: LessonCardProps) {
  const colors = colorForCourse(entry.courseId);

  return (
    <div
      className={`${colors.bg} border ${colors.border} ${colors.dash} rounded-lg px-3 py-4 h-full flex flex-col justify-between relative group ${
        isDeleting ? "opacity-50" : ""
      }`}
    >
      <BookOpen />

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate text-[#1A1A1A] dark:text-slate-100">
            {entry.course}
          </div>
          <div className="text-[15px] font-medium truncate text-[#4D4D4D] dark:text-slate-300">
            {entry.teacherName || "Unassigned teacher"}
          </div>
        </div>
      </div>

      {canManage && (
        <button
          onClick={onRemove}
          disabled={isDeleting}
          aria-label={`Remove ${entry.course} from ${entry.day} at ${entry.time}`}
          title="Remove from timetable"
          className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-60"
        >
          <Trash />
        </button>
      )}
    </div>
  );
}
