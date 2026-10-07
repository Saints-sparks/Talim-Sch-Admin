"use client";

/**
 * The week grid — a table of five day columns against the school's periods
 * (or seven hourly rows when there is no bell schedule). Break rows are drawn
 * on the subtle tint and take no drops; a lesson at times no row has gets its
 * own row. Today's column wears the today tint.
 *
 * The table scrolls sideways inside its card on narrow screens, so the page
 * itself never does.
 *
 * A lesson card keeps one tone, derived from its course id, so the card does
 * not change appearance every time the grid re-renders, and matches its
 * course in the palette.
 */

import React, { useEffect, useState } from "react";
import { BookOpen, MapPin, MousePointerClick, Trash2 } from "lucide-react";
import { focusRing } from "@/components/tl";
import {
  TIME_SLOTS,
  WEEK_DAYS,
  colorForCourse,
  entryForSlot,
  type TimeSlot,
  type TimetableEntry,
  type TimetableGridData,
} from "./timetable.model";

/** Props for {@link TimetableGrid}. */
interface TimetableGridProps {
  /** The class's lessons by day. */
  grid: TimetableGridData;
  /** True when lessons can be dropped and removed. */
  canManage: boolean;
  /** Id of the entry currently being deleted, so its card can show as busy. */
  deletingEntryId: string | null;
  /** Called when a course is dropped on a free cell. */
  onDropCourse: (day: string, slot: TimeSlot) => void;
  /** Called with a lesson to remove. */
  onRemoveEntry: (entry: TimetableEntry) => void;
  /** The rows to draw; the hourly `TIME_SLOTS` when left out. */
  rows?: TimeSlot[];
}

/**
 * Today's weekday when it is one of the grid's days.
 *
 * @returns "Monday"…"Friday", or null at the weekend.
 */
function todayColumn(): string | null {
  const name = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return (WEEK_DAYS as string[]).includes(name) ? name : null;
}

/**
 * Renders the week as a table.
 *
 * @param props - See {@link TimetableGridProps}.
 * @param props.grid - The lessons.
 * @param props.canManage - Whether drops and removes are allowed.
 * @param props.deletingEntryId - The lesson being removed.
 * @param props.onDropCourse - Drop handler.
 * @param props.onRemoveEntry - Remove handler.
 * @param props.rows - The rows.
 * @returns The table.
 */
export function TimetableGrid({
  grid,
  canManage,
  deletingEntryId,
  onDropCourse,
  onRemoveEntry,
  rows = TIME_SLOTS,
}: TimetableGridProps) {
  // Read after mount, so a server render and the browser never disagree.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayColumn()), []);
  const todayTint = (day: string) => (day === today ? "bg-tl-today" : "");

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-tl-ink">
        <caption className="sr-only">The class&apos;s lessons this week, by period</caption>
        <colgroup>
          <col className="w-[128px]" />
          {WEEK_DAYS.map((day) => (
            <col key={day} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-tl-line-soft">
            <th scope="col" className="px-4 py-3.5 text-left align-middle">
              <span className="text-xs font-extrabold uppercase tracking-[0.07em] text-tl-faint">
                Time
              </span>
            </th>
            {WEEK_DAYS.map((day) => (
              <th
                key={day}
                scope="col"
                aria-current={day === today ? "date" : undefined}
                className={`px-3 py-3.5 text-center align-middle ${todayTint(day)}`}
              >
                <span
                  className={`block text-[15px] font-extrabold ${day === today ? "text-tl-brand" : "text-tl-ink"}`}
                >
                  {day}
                </span>
                {day === today && (
                  <span className="mt-0.5 block text-xs font-semibold text-tl-faint">today</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((timeSlot) => {
            const droppable = canManage && !timeSlot.isBreak;
            return (
              <tr
                key={`${timeSlot.periodKey ?? ""}-${timeSlot.label}`}
                className={`border-b border-tl-line-soft last:border-b-0 ${timeSlot.isBreak ? "bg-tl-subtle" : ""}`}
              >
                <th scope="row" className="px-4 py-3 text-left align-middle">
                  {timeSlot.title && (
                    <span className="block text-[13px] font-extrabold text-tl-ink">
                      {timeSlot.title}
                    </span>
                  )}
                  <span className="mt-0.5 block text-xs font-semibold text-tl-faint">
                    {timeSlot.label}
                  </span>
                </th>
                {WEEK_DAYS.map((day) => {
                  const entry = entryForSlot(grid, day, timeSlot);
                  return (
                    <td
                      key={`${day}-${timeSlot.label}`}
                      data-break={timeSlot.isBreak ? "" : undefined}
                      className={`h-px p-[7px] align-top ${timeSlot.isBreak ? "" : todayTint(day)}`}
                      onDragOver={droppable ? (e) => e.preventDefault() : undefined}
                      onDrop={
                        droppable
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
                      ) : timeSlot.isBreak ? (
                        <span className="flex min-h-[34px] items-center justify-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-tl-faint">
                          {timeSlot.title || "Break"}
                        </span>
                      ) : (
                        <div
                          className={`flex h-full min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-tl-line text-xs font-semibold text-tl-faint transition-colors ${
                            canManage ? "hover:border-tl-control hover:bg-tl-select" : ""
                          }`}
                        >
                          {canManage && <MousePointerClick className="h-4 w-4" aria-hidden />}
                          {canManage ? "Drop here" : "Free"}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Props for {@link LessonCard}. */
interface LessonCardProps {
  /** The lesson. */
  entry: TimetableEntry;
  /** Whether the remove button shows. */
  canManage: boolean;
  /** True while it is being removed. */
  isDeleting: boolean;
  /** Removes it. */
  onRemove: () => void;
}

/**
 * One scheduled lesson, in its course's tone: course, teacher and room, and
 * a remove button for an editor.
 *
 * @param props - See {@link LessonCardProps}.
 * @param props.entry - The lesson.
 * @param props.canManage - Whether it can be removed.
 * @param props.isDeleting - Whether it is being removed.
 * @param props.onRemove - Remove handler.
 * @returns The card.
 */
function LessonCard({ entry, canManage, isDeleting, onRemove }: LessonCardProps) {
  const colors = colorForCourse(entry.courseId);

  return (
    <div
      className={`${colors.bg} border ${colors.border} ${colors.dash} relative flex h-full min-h-[92px] flex-col gap-1 rounded-[14px] px-3 py-2.5 ${
        isDeleting ? "opacity-50" : ""
      }`}
    >
      <BookOpen className="h-4 w-4 text-tone-fg" aria-hidden />
      <div className={`min-w-0 ${canManage ? "pr-7" : ""}`}>
        <div className="truncate text-sm font-extrabold text-tone-fg">{entry.course}</div>
        <div className="truncate text-xs font-semibold text-tl-body">
          {entry.teacherName || "Unassigned teacher"}
        </div>
        {entry.room && (
          <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-tl-body">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="sr-only">Room </span>
            <span className="truncate">{entry.room}</span>
          </div>
        )}
      </div>

      {canManage && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isDeleting}
          aria-label={`Remove ${entry.course} from ${entry.day} at ${entry.time}`}
          title="Remove from timetable"
          className={`absolute -right-1 -top-1 flex h-11 w-11 items-center justify-center rounded-full text-tl-muted transition-colors hover:bg-tl-danger-bg hover:text-tl-danger disabled:opacity-60 ${focusRing}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
