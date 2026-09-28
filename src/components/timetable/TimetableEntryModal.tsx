"use client";

/**
 * The "Add Entry" dialog.
 *
 * The form is `CreateTimetableDto`: a course, a day from the five-day enum,
 * 24-hour start and end times, and optionally a room and a school period.
 * When the school has a bell schedule, picking a period fills the times and
 * sends its `periodKey`; editing a time afterwards makes it a custom slot
 * (see `entryForm.ts`). Without a bell schedule the times are typed freely
 * and a hint points at Settings → School Day & Bells.
 *
 * It mirrors the server's checks before sending and maps a
 * `VALIDATION_FAILED` response onto the field it names, so a rejection points
 * at the input that caused it instead of only raising a toast.
 *
 * The page behind the dialog is frozen while it is open and restored when it
 * closes, so a long grid does not scroll away underneath it.
 */

import React, { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { ApiError } from "@/lib/apiError";
import type { TimetableCourse } from "@/app/services/timetable.service";
import type { SchoolPeriod } from "@/app/services/school-settings.service";
import { WEEK_DAYS, courseTeacherName } from "./timetable.model";
import {
  EMPTY_ENTRY_FORM,
  ROOM_MAX_LENGTH,
  choosePeriod,
  editTime,
  lessonPeriods,
  toEntrySubmit,
  validateEntryForm,
  type EntryFormValues,
  type EntrySubmitValues,
} from "./entryForm";

export { validateEntryForm };
export type { EntryFormValues, EntrySubmitValues };

interface TimetableEntryModalProps {
  open: boolean;
  courses: TimetableCourse[];
  teacherNames: Map<string, string>;
  isSaving: boolean;
  /** The last failure from the create mutation, or null. */
  error: unknown;
  onClose: () => void;
  onSubmit: (values: EntrySubmitValues) => void;
  /** The school's bell schedule; empty or absent means free times only. */
  periods?: SchoolPeriod[];
  /**
   * Where the bell schedule is edited, for the "no bell schedule" hint; null
   * when the viewer cannot open Settings (the hint then only explains).
   */
  bellScheduleHref?: string | null;
}

const FIELD_CLASSES =
  "w-full rounded-xl border px-4 py-3 bg-white dark:bg-slate-900 text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export function TimetableEntryModal({
  open,
  courses,
  teacherNames,
  isSaving,
  error,
  onClose,
  onSubmit,
  periods,
  bellScheduleHref = null,
}: TimetableEntryModalProps) {
  const [values, setValues] = useState<EntryFormValues>(EMPTY_ENTRY_FORM);
  const choices = lessonPeriods(periods);
  const [errors, setErrors] = useState<Partial<Record<keyof EntryFormValues, string>>>({});

  useBodyScrollLock(open);

  // Start from a clean form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setValues(EMPTY_ENTRY_FORM);
      setErrors({});
    }
  }, [open]);

  // Show the field the server rejected, not just a toast.
  useEffect(() => {
    if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
      setErrors(error.fieldErrors() as Partial<Record<keyof EntryFormValues, string>>);
    }
  }, [error]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateEntryForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit(toEntrySubmit(values));
  };

  const border = (field: keyof EntryFormValues) =>
    errors[field] ? "border-red-400 dark:border-red-500" : "border-[#E0E0E0] dark:border-slate-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timetable-entry-title"
      >
        <div className="border-b border-gray-100 dark:border-slate-700 px-6 py-4">
          <h2
            id="timetable-entry-title"
            className="text-lg font-semibold text-[#030E18] dark:text-slate-100"
          >
            Add Timetable Entry
          </h2>
          <p className="mt-1 text-sm text-[#4D4D4D] dark:text-slate-400">
            Schedule a registered course for the selected class.
          </p>
        </div>

        <form className="space-y-4 p-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="entry-course"
              className="mb-1 block text-sm font-semibold text-[#4D4D4D] dark:text-slate-300"
            >
              Subject/Course
            </label>
            <select
              id="entry-course"
              value={values.courseId}
              onChange={(e) => setValues((prev) => ({ ...prev, courseId: e.target.value }))}
              className={`${FIELD_CLASSES} ${border("courseId")}`}
              {...invalid("entry-course", errors.courseId)}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} - {courseTeacherName(course, teacherNames)}
                </option>
              ))}
            </select>
            <FieldError id="entry-course" message={errors.courseId} />
          </div>

          <div>
            <label
              htmlFor="entry-day"
              className="mb-1 block text-sm font-semibold text-[#4D4D4D] dark:text-slate-300"
            >
              Day
            </label>
            <select
              id="entry-day"
              value={values.day}
              onChange={(e) => setValues((prev) => ({ ...prev, day: e.target.value }))}
              className={`${FIELD_CLASSES} ${border("day")}`}
              {...invalid("entry-day", errors.day)}
            >
              <option value="">Select a day</option>
              {WEEK_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <FieldError id="entry-day" message={errors.day} />
          </div>

          {choices.length > 0 && (
            <div>
              <label
                htmlFor="entry-period"
                className="mb-1 block text-sm font-semibold text-[#4D4D4D] dark:text-slate-300"
              >
                Period
              </label>
              <select
                id="entry-period"
                value={values.periodKey ?? ""}
                onChange={(e) => setValues((prev) => choosePeriod(prev, e.target.value, periods))}
                className={`${FIELD_CLASSES} ${border("periodKey")}`}
                {...invalid("entry-period", errors.periodKey, "entry-period-hint")}
              >
                <option value="">Custom time</option>
                {choices.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label} ({p.startTime}–{p.endTime})
                  </option>
                ))}
              </select>
              <p id="entry-period-hint" className="mt-1 text-xs text-[#4D4D4D] dark:text-slate-400">
                Picking a period fills in its times. Change a time to use a custom slot.
              </p>
              <FieldError id="entry-period" message={errors.periodKey} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Tooltip
                content="Use 24-hour format (e.g. 09:00 – 10:00). Overlapping entries for the same teacher are rejected."
                side="right"
              >
                <label
                  htmlFor="entry-start"
                  className="mb-1 block text-sm font-semibold text-[#4D4D4D] dark:text-slate-300"
                >
                  Start Time
                </label>
              </Tooltip>
              <input
                id="entry-start"
                type="time"
                value={values.startTime}
                onChange={(e) => setValues((prev) => editTime(prev, "startTime", e.target.value, periods))}
                className={`${FIELD_CLASSES} ${border("startTime")}`}
                {...invalid("entry-start", errors.startTime)}
              />
              <FieldError id="entry-start" message={errors.startTime} />
            </div>
            <div>
              <Tooltip
                content="Use 24-hour format (e.g. 09:00 – 10:00). Overlapping entries for the same teacher are rejected."
                side="right"
              >
                <label
                  htmlFor="entry-end"
                  className="mb-1 block text-sm font-semibold text-[#4D4D4D] dark:text-slate-300"
                >
                  End Time
                </label>
              </Tooltip>
              <input
                id="entry-end"
                type="time"
                value={values.endTime}
                onChange={(e) => setValues((prev) => editTime(prev, "endTime", e.target.value, periods))}
                className={`${FIELD_CLASSES} ${border("endTime")}`}
                {...invalid("entry-end", errors.endTime)}
              />
              <FieldError id="entry-end" message={errors.endTime} />
            </div>
          </div>

          {choices.length === 0 && (
            <p className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
              No bell schedule yet, so times are typed in freely.{" "}
              {bellScheduleHref ? (
                <>
                  <a href={bellScheduleHref} className="font-semibold underline">
                    Set up the bell schedule
                  </a>{" "}
                  to pick named periods here.
                </>
              ) : (
                "A school admin can set up named periods in Settings."
              )}
            </p>
          )}

          <div>
            <label
              htmlFor="entry-room"
              className="mb-1 block text-sm font-semibold text-[#4D4D4D] dark:text-slate-300"
            >
              Room <span className="font-normal text-[#808080] dark:text-slate-500">(optional)</span>
            </label>
            <input
              id="entry-room"
              type="text"
              value={values.room ?? ""}
              maxLength={ROOM_MAX_LENGTH}
              placeholder="e.g. Lab 2"
              onChange={(e) => setValues((prev) => ({ ...prev, room: e.target.value }))}
              className={`${FIELD_CLASSES} ${border("room")}`}
              {...invalid("entry-room", errors.room)}
            />
            <FieldError id="entry-room" message={errors.room} />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-gray-200 dark:border-slate-600 px-5 py-2.5 font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#003366] px-5 py-2.5 font-semibold text-white hover:bg-[#002244] disabled:opacity-60"
            >
              {isSaving ? "Adding..." : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Ties a control to its error (and optional hint) for screen readers.
 *
 * @param id - The control's id.
 * @param message - Its error, if any.
 * @param hintId - Id of a hint that always describes it.
 * @returns `aria-invalid` and `aria-describedby`.
 */
function invalid(id: string, message?: string, hintId?: string) {
  const describedBy = [message ? `${id}-error` : null, hintId ?? null].filter(Boolean).join(" ");
  return { "aria-invalid": message ? true : undefined, "aria-describedby": describedBy || undefined };
}

/** One field's validation message. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}
