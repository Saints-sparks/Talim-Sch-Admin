"use client";

import React, { useState } from "react";
import { ApiError } from "@/lib/apiError";
import { ModalShell, OutlineBtn, PrimaryBtn } from "@/components/settings/ui";
import {
  FieldError,
  FieldLabel,
  controlClasses,
  describedBy,
} from "@/components/settings/schoolDay/fields";
import {
  EVENT_TYPES,
  validateCalendarForm,
  type CalendarFormErrors,
  type CalendarFormValues,
} from "./calendarForm";

interface CalendarEventDialogProps {
  /** "Add event" or "Edit event". */
  title: string;
  initial: CalendarFormValues;
  saving: boolean;
  onCancel: () => void;
  /** Saves; rejects with the `ApiError` so its field details can be shown. */
  onSubmit: (values: CalendarFormValues) => Promise<unknown>;
}

/**
 * The create/edit dialog: title, type, first and last day, and — for an early
 * close only — the time school ends. Checks run on submit and then follow
 * every edit; the API's field errors land on the field they name.
 */
export function CalendarEventDialog({
  title,
  initial,
  saving,
  onCancel,
  onSubmit,
}: CalendarEventDialogProps) {
  const [values, setValues] = useState<CalendarFormValues>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<CalendarFormErrors>({});

  const errors: CalendarFormErrors = submitted
    ? { ...serverErrors, ...validateCalendarForm(values) }
    : serverErrors;
  const typeHint = EVENT_TYPES.find((t) => t.value === values.type)?.hint;

  const set = (patch: Partial<CalendarFormValues>) => {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      // Moving the first day past the last day drags the last day along.
      if (
        patch.startDate &&
        (!prev.endDate || prev.endDate < patch.startDate || prev.endDate === prev.startDate)
      ) {
        next.endDate = patch.startDate;
      }
      return next;
    });
    setServerErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateCalendarForm(values)).length > 0) return;
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const fields = err.fieldErrors();
        const mapped: CalendarFormErrors = {};
        (["title", "type", "startDate", "endDate", "endsAt"] as const).forEach((f) => {
          if (fields[f]) mapped[f] = fields[f];
        });
        setServerErrors(mapped);
      }
    }
  };

  return (
    <ModalShell title={title} onClose={saving ? () => undefined : onCancel}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <FieldLabel htmlFor="cal-title" required>
            Title
          </FieldLabel>
          <input
            id="cal-title"
            type="text"
            autoFocus
            maxLength={120}
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Independence Day"
            className={controlClasses(Boolean(errors.title))}
            {...describedBy("cal-title", errors.title)}
          />
          <FieldError controlId="cal-title" message={errors.title} />
        </div>

        <div>
          <FieldLabel htmlFor="cal-type" required>
            Type
          </FieldLabel>
          <select
            id="cal-type"
            value={values.type}
            onChange={(e) => set({ type: e.target.value as CalendarFormValues["type"] })}
            className={controlClasses(Boolean(errors.type))}
            {...describedBy("cal-type", errors.type, "cal-type-hint")}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p id="cal-type-hint" className="mt-1 text-xs text-tl-muted">
            {typeHint}
          </p>
          <FieldError controlId="cal-type" message={errors.type} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="cal-start" required>
              First day
            </FieldLabel>
            <input
              id="cal-start"
              type="date"
              value={values.startDate}
              onChange={(e) => set({ startDate: e.target.value })}
              className={controlClasses(Boolean(errors.startDate))}
              {...describedBy("cal-start", errors.startDate)}
            />
            <FieldError controlId="cal-start" message={errors.startDate} />
          </div>
          <div>
            <FieldLabel htmlFor="cal-end">Last day</FieldLabel>
            <input
              id="cal-end"
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              onChange={(e) => set({ endDate: e.target.value })}
              className={controlClasses(Boolean(errors.endDate))}
              {...describedBy("cal-end", errors.endDate)}
            />
            <FieldError controlId="cal-end" message={errors.endDate} />
          </div>
        </div>

        {values.type === "early_close" && (
          <div>
            <FieldLabel htmlFor="cal-ends-at" required>
              School ends at
            </FieldLabel>
            <input
              id="cal-ends-at"
              type="time"
              value={values.endsAt}
              onChange={(e) => set({ endsAt: e.target.value })}
              className={controlClasses(Boolean(errors.endsAt))}
              {...describedBy("cal-ends-at", errors.endsAt)}
            />
            <FieldError controlId="cal-ends-at" message={errors.endsAt} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <OutlineBtn onClick={onCancel} disabled={saving}>
            Cancel
          </OutlineBtn>
          <PrimaryBtn type="submit" loading={saving}>
            Save event
          </PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}
