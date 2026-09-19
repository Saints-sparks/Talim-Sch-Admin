"use client";

import React from "react";
import { CalendarDays, Check, Clock } from "lucide-react";
import { fieldErrorClass, mutedTextClass, navyTextClass } from "../../create/ui";
import { AVAILABILITY_DAYS, AVAILABLE_TIME_SLOTS } from "./teacherForm";
import type { TeacherStepProps } from "./TeacherAccountStep";

interface TeacherSchedulePanelProps extends TeacherStepProps {
  /** Adds or removes a working day. */
  onToggleDay: (day: string) => void;
}

/**
 * "Schedule & Availability" card: working days, the usual time window and the
 * form-teacher flag.
 *
 * @param props - Form values, errors, the field setter and the day toggle.
 * @returns The card.
 */
export function TeacherSchedulePanel({ form, errors, setField, onToggleDay }: TeacherSchedulePanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="mb-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          <CalendarDays className={`h-4 w-4 ${navyTextClass}`} />
          Schedule &amp; Availability
        </h4>
        <p className={`mt-1 text-sm ${mutedTextClass}`}>
          Choose working days and the usual availability window.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Availability Days <span className="text-red-500">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_DAYS.map((day) => {
              const isSelected = form.availabilityDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleDay(day)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "border-[#003366] dark:border-blue-400 bg-[#003366] dark:bg-blue-500 text-white shadow-sm"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-[#003366]/40 hover:bg-white dark:hover:bg-gray-700"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {errors.availabilityDays && (
            <p role="alert" className={fieldErrorClass}>
              {errors.availabilityDays}
            </p>
          )}
        </div>

        <div>
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            Available Time <span className="text-red-500">*</span>
          </span>
          <div className="grid grid-cols-1 gap-2">
            {AVAILABLE_TIME_SLOTS.map((slot) => {
              const isSelected = form.availableTime === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setField("availableTime", slot)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    isSelected
                      ? "border-[#003366] dark:border-blue-400 bg-[#EAF2FB] dark:bg-blue-950/50 text-[#003366] dark:text-blue-200"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-[#003366]/40 hover:bg-white dark:hover:bg-gray-700"
                  }`}
                >
                  {slot}
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          {errors.availableTime && (
            <p role="alert" className={fieldErrorClass}>
              {errors.availableTime}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#F4B740]/40 bg-[#FFF8E8] dark:bg-amber-950/30 p-4 transition hover:border-[#F4B740]">
          <input
            type="checkbox"
            name="isFormTeacher"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-[#003366] focus:ring-[#003366]"
            checked={form.isFormTeacher}
            onChange={(event) => setField("isFormTeacher", event.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
              Assign as Form Teacher
            </span>
            <span className="mt-1 block text-xs leading-5 text-gray-600 dark:text-gray-300">
              Marks this teacher as the primary class coordinator where applicable.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
