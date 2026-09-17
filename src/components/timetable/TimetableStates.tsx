"use client";

/**
 * Everything the grid area shows when it is not showing a grid: the skeleton,
 * the "pick a class" prompt, the "no timetable yet" nudge and the error panel.
 *
 * The skeleton draws the same seven rows and five columns as the real grid, so
 * nothing on the page moves when the timetable lands.
 */

import React from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { TIME_SLOTS, WEEK_DAYS } from "./timetable.model";

/** The grid's shape while it loads. */
export function TimetableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F0F0] dark:border-slate-700">
      <div className="grid grid-cols-6 border-b border-gray-200 dark:border-slate-700">
        <div className="p-4">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        {WEEK_DAYS.map((day) => (
          <div key={day} className="p-4 text-center">
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {TIME_SLOTS.map((timeSlot) => (
        <div
          key={timeSlot.label}
          className="grid grid-cols-6 border-b border-[#F0F0F0] dark:border-slate-700 last:border-b-0"
        >
          <div className="p-4 border-r border-[#F0F0F0] dark:border-slate-700 flex items-center justify-center">
            <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          {WEEK_DAYS.map((day) => (
            <div
              key={`${day}-${timeSlot.label}`}
              className="p-2 border-r border-[#F0F0F0] dark:border-slate-700 last:border-r-0 h-[121px]"
            >
              <div className="h-full border border-dashed border-[#E0E0E0] dark:border-slate-600 bg-[#F8F8F8] dark:bg-slate-900/40 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                  <div className="h-3 w-12 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="text-center py-6 border-t border-[#F0F0F0] dark:border-slate-700">
        <div className="flex items-center justify-center gap-2 text-[#4D4D4D] dark:text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-[15px] font-medium">Loading timetable...</span>
        </div>
      </div>
    </div>
  );
}

/** Shown before a class has been chosen. */
export function NoClassSelected() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F0F0] dark:border-slate-700">
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 border-2 border-[#E0E0E0] dark:border-slate-600 rounded-lg flex items-center justify-center mb-6 bg-[#F8F8F8] dark:bg-slate-900/40">
          <CalendarDays className="w-8 h-8 text-[#4D4D4D] dark:text-slate-400" />
        </div>
        <h3 className="text-[19px] font-semibold text-[#1A1A1A] dark:text-slate-100 mb-3">
          No Class Selected
        </h3>
        <p className="text-[#4D4D4D] dark:text-slate-400 text-center max-w-md mb-8 text-[15px] leading-relaxed">
          Please select a class from the dropdown above to view the timetable schedule and start
          managing your class sessions.
        </p>
        <div className="text-[13px] text-[#808080] dark:text-slate-500 font-medium">
          Select a class to get started
        </div>
      </div>
    </div>
  );
}

/**
 * The banner above an empty grid. It suggests the actions the viewer can
 * actually take — a read-only viewer is told the timetable is simply empty.
 */
export function NoTimetableNotice({ canManage }: { canManage: boolean }) {
  return (
    <div className="mx-4 mt-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
      {canManage
        ? "No timetable yet. Drag a course into a slot, use Add Entry, or copy from the template to get started."
        : "No timetable has been created for this class yet."}
    </div>
  );
}

/** Title and explanation for a failed timetable read, keyed on the API's code. */
function describe(error: unknown): { title: string; message: string; canRetry: boolean } {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK_OFFLINE":
        return {
          title: "You're offline",
          message: "Reconnect and the timetable will load.",
          canRetry: true,
        };
      case "FORBIDDEN":
        return {
          title: "No access to this timetable",
          message: "Your account isn't allowed to view this class's timetable.",
          canRetry: false,
        };
      case "REQUEST_TIMEOUT":
      case "SERVICE_UNAVAILABLE":
      case "INTERNAL_ERROR":
        return {
          title: "Talim isn't responding",
          message: "The server didn't answer in time. Try again in a moment.",
          canRetry: true,
        };
      default:
        return { title: "Error Loading Timetable", message: error.message, canRetry: true };
    }
  }
  return {
    title: "Error Loading Timetable",
    message: getErrorMessage(error, "Something went wrong loading this timetable."),
    canRetry: true,
  };
}

interface TimetableErrorPanelProps {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}

/** Shown when the grid read failed for a reason other than "no entries yet". */
export function TimetableErrorPanel({ error, onRetry, isRetrying }: TimetableErrorPanelProps) {
  const { title, message, canRetry } = describe(error);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/40 p-8">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-3">{title}</h3>
        <p className="text-red-600 dark:text-red-300 text-center max-w-md mb-8">{message}</p>
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md disabled:opacity-60"
          >
            <RefreshCw className={isRetrying ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}
