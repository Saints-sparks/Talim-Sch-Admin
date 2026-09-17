"use client";

/**
 * The "Add Entry" dialog.
 *
 * The form is exactly `CreateTimetableDto`: a course, a day from the five-day
 * enum, and 24-hour start and end times. It mirrors the server's checks before
 * sending — all four fields required, end strictly after start — and maps a
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
import type { TimetableDay } from "@/app/services/timetable.service";
import { WEEK_DAYS, courseTeacherName } from "./timetable.model";

/** The dialog's form state, one field per DTO property. */
export interface EntryFormValues {
  courseId: string;
  day: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: EntryFormValues = { courseId: "", day: "", startTime: "", endTime: "" };

interface TimetableEntryModalProps {
  open: boolean;
  courses: TimetableCourse[];
  teacherNames: Map<string, string>;
  isSaving: boolean;
  /** The last failure from the create mutation, or null. */
  error: unknown;
  onClose: () => void;
  onSubmit: (values: {
    courseId: string;
    day: TimetableDay;
    startTime: string;
    endTime: string;
  }) => void;
}

/**
 * The client-side half of the DTO's validation.
 *
 * @param values - What the form currently holds.
 * @returns A message per invalid field; empty when the form may be sent.
 */
export function validateEntryForm(values: EntryFormValues): Partial<Record<keyof EntryFormValues, string>> {
  const errors: Partial<Record<keyof EntryFormValues, string>> = {};
  if (!values.courseId) errors.courseId = "Choose the course to schedule.";
  if (!values.day) errors.day = "Choose a day.";
  if (!values.startTime) errors.startTime = "Set a start time.";
  if (!values.endTime) errors.endTime = "Set an end time.";
  if (values.startTime && values.endTime && values.endTime <= values.startTime) {
    errors.endTime = "The end time must be after the start time.";
  }
  return errors;
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
}: TimetableEntryModalProps) {
  const [values, setValues] = useState<EntryFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof EntryFormValues, string>>>({});

  useBodyScrollLock(open);

  // Start from a clean form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setValues(EMPTY_FORM);
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
    onSubmit({
      courseId: values.courseId,
      day: values.day as TimetableDay,
      startTime: values.startTime,
      endTime: values.endTime,
    });
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
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
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
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} - {courseTeacherName(course, teacherNames)}
                </option>
              ))}
            </select>
            <FieldError message={errors.courseId} />
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
            >
              <option value="">Select a day</option>
              {WEEK_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <FieldError message={errors.day} />
          </div>

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
                onChange={(e) => setValues((prev) => ({ ...prev, startTime: e.target.value }))}
                className={`${FIELD_CLASSES} ${border("startTime")}`}
              />
              <FieldError message={errors.startTime} />
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
                onChange={(e) => setValues((prev) => ({ ...prev, endTime: e.target.value }))}
                className={`${FIELD_CLASSES} ${border("endTime")}`}
              />
              <FieldError message={errors.endTime} />
            </div>
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

/** One field's validation message. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>;
}
