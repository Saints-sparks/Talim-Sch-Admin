"use client";

import React from "react";
import { CalendarDays, Check, Clock } from "lucide-react";
import { chip, focusRing } from "@/components/tl";
import { blockClass, fieldErrorClass, labelClass, mutedTextClass, navyTextClass } from "../../create/ui";
import { AVAILABILITY_DAYS, AVAILABLE_TIME_SLOTS } from "./teacherForm";
import type { TeacherStepProps } from "./TeacherAccountStep";

/** Props for {@link TeacherSchedulePanel}. */
interface TeacherSchedulePanelProps extends TeacherStepProps {
  /** Adds or removes a working day. */
  onToggleDay: (day: string) => void;
}

/**
 * "Schedule & Availability" card: working days, the usual time window and the
 * form-teacher flag.
 *
 * @param props - Form values, errors, the field setter and the day toggle.
 * @param props.form - The values.
 * @param props.errors - The errors.
 * @param props.setField - Field setter.
 * @param props.onToggleDay - Day toggle.
 * @returns The card.
 */
export function TeacherSchedulePanel({ form, errors, setField, onToggleDay }: TeacherSchedulePanelProps) {
  return (
    <section className={blockClass}>
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-tl-ink">
          <CalendarDays className={`h-4 w-4 ${navyTextClass}`} aria-hidden />
          Schedule &amp; Availability
        </h3>
        <p className={`mt-1 text-sm ${mutedTextClass}`}>
          Choose working days and the usual availability window.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <span className={`${labelClass} mb-2`}>
            Availability Days <span className="text-tl-danger">*</span>
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
                  className={chip(isSelected)}
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
          <span className={`${labelClass} mb-2 flex items-center gap-2`}>
            <Clock className="h-4 w-4" aria-hidden />
            Available Time <span className="text-tl-danger">*</span>
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
                  className={`${chip(isSelected)} w-full justify-between`}
                >
                  {slot}
                  {isSelected && <Check className="h-4 w-4" aria-hidden />}
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

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-tl-warning/25 bg-tl-warning-bg p-4">
          <input
            type="checkbox"
            name="isFormTeacher"
            className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-tl-brand-fill ${focusRing}`}
            checked={form.isFormTeacher}
            onChange={(event) => setField("isFormTeacher", event.target.checked)}
          />
          <span>
            <span className="block text-sm font-extrabold text-tl-ink">Label as Form Teacher</span>
            <span className="mt-1 block text-[13px] leading-5 text-tl-body">
              A label only. To let them take a class&apos;s register, make them its class teacher on
              the class&apos;s page (or in the teacher&apos;s profile) once the account exists.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
