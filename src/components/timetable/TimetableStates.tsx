"use client";

/**
 * Everything the grid area shows when it is not showing a grid: the skeleton,
 * the "pick a class" prompt, the "no timetable yet" nudge and the error panel,
 * in the design system's cards.
 *
 * The skeleton draws the same seven rows and five columns as the real grid, so
 * nothing on the page moves when the timetable lands.
 */

import React from "react";
import { AlertCircle, CalendarDays, RefreshCw } from "lucide-react";
import { Banner, EmptyNote, card, cardFrame, ghostButton, skeletonBlock } from "@/components/tl";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { TIME_SLOTS, WEEK_DAYS } from "./timetable.model";

/**
 * The grid's shape while it loads: a header row and seven period rows of
 * pulsing cells, announced once as busy.
 *
 * @returns The skeleton.
 */
export function TimetableSkeleton() {
  return (
    <div
      className={`${cardFrame} overflow-x-auto`}
      role="status"
      aria-busy="true"
      aria-label="Loading timetable"
    >
      <span className="sr-only">Loading timetable...</span>
      <div aria-hidden className="min-w-[860px]">
        <div className="grid grid-cols-[128px_repeat(5,1fr)] gap-[7px] border-b border-tl-line-soft p-3">
          <div className={`${skeletonBlock} h-5 w-16 rounded`} />
          {WEEK_DAYS.map((day) => (
            <div key={day} className={`${skeletonBlock} mx-auto h-5 w-20 rounded`} />
          ))}
        </div>
        {TIME_SLOTS.map((timeSlot) => (
          <div
            key={timeSlot.label}
            className="grid grid-cols-[128px_repeat(5,1fr)] gap-[7px] border-b border-tl-line-soft p-[7px] last:border-b-0"
          >
            <div className="flex flex-col justify-center gap-1.5 px-2">
              <div className={`${skeletonBlock} h-3.5 w-16 rounded`} />
              <div className={`${skeletonBlock} h-3 w-20 rounded`} />
            </div>
            {WEEK_DAYS.map((day) => (
              <div
                key={`${day}-${timeSlot.label}`}
                className={`${skeletonBlock} h-[92px] rounded-[14px]`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shown before a class has been chosen.
 *
 * @returns The prompt.
 */
export function NoClassSelected() {
  return (
    <div className={card}>
      <EmptyNote icon={<CalendarDays />} title="No Class Selected">
        Please select a class from the dropdown above to view the timetable schedule and start
        managing your class sessions.
        <span className="mt-2 block text-[13px] font-bold text-tl-faint">
          Select a class to get started
        </span>
      </EmptyNote>
    </div>
  );
}

/**
 * The banner above an empty grid. It suggests the actions the viewer can
 * actually take — a read-only viewer is told the timetable is simply empty.
 *
 * @param props - Whether the viewer can edit.
 * @param props.canManage - True for an editor.
 * @returns The banner.
 */
export function NoTimetableNotice({ canManage }: { canManage: boolean }) {
  return (
    <div className="px-4 pt-4">
      <Banner tone="info">
        {canManage
          ? "No timetable yet. Drag a course into a slot, use Add Entry, or copy from the template to get started."
          : "No timetable has been created for this class yet."}
      </Banner>
    </div>
  );
}

/**
 * Title and explanation for a failed timetable read, keyed on the API's code.
 *
 * @param error - What the read threw.
 * @returns The title, the message and whether a retry can help.
 */
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

/** Props for {@link TimetableErrorPanel}. */
interface TimetableErrorPanelProps {
  /** What the read threw. */
  error: unknown;
  /** Reads it again. */
  onRetry: () => void;
  /** True while the retry runs. */
  isRetrying: boolean;
}

/**
 * Shown when the grid read failed for a reason other than "no entries yet":
 * the problem in a card, with Retry when a retry can help.
 *
 * @param props - See {@link TimetableErrorPanelProps}.
 * @param props.error - The failure.
 * @param props.onRetry - Retry handler.
 * @param props.isRetrying - Whether the retry runs.
 * @returns The panel.
 */
export function TimetableErrorPanel({ error, onRetry, isRetrying }: TimetableErrorPanelProps) {
  const { title, message, canRetry } = describe(error);

  return (
    <div role="alert" className={`${card} flex flex-col items-center gap-3 py-12 text-center`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tl-danger-bg">
        <AlertCircle className="h-7 w-7 text-tl-danger" aria-hidden />
      </span>
      <h3 className="text-lg font-extrabold text-tl-ink">{title}</h3>
      <p className="max-w-md text-[15px] text-tl-body">{message}</p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className={`${ghostButton} mt-2`}
        >
          <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      )}
    </div>
  );
}
