"use client";

import React, { useMemo, useState } from "react";
import { Clock, Info } from "lucide-react";
import { ApiError } from "@/lib/apiError";
import { useAcademicSettings, useUpdateAcademicSettings } from "@/hooks/settings/useAcademicSettings";
import type { AcademicSettings } from "@/app/services/school-settings.service";
import {
  Card,
  CardHeader,
  Notice,
  OutlineBtn,
  PrimaryBtn,
  SectionError,
  SectionHeader,
  SectionSkeleton,
} from "@/components/settings/ui";
import { BellScheduleEditor } from "./schoolDay/BellScheduleEditor";
import {
  TEACHING_WEEKDAYS,
  mapServerPeriodErrors,
  timezoneOptions,
  toggleSchoolDay,
} from "./schoolDay/bellSchedule";
import { FieldError, FieldLabel, controlClasses, describedBy, errorId } from "./schoolDay/fields";
import {
  hasSchoolDayErrors,
  isSchoolDayDirty,
  mapServerFieldErrors,
  toAcademicPayload,
  toSchoolDayValues,
  validateSchoolDay,
  type SchoolDayErrors,
  type SchoolDayValues,
} from "./schoolDay/schoolDayForm";

const TITLE = "School Day & Bells";
const DESC = "Timezone, school days, register times, office hours and the bell schedule";
const NO_ERRORS: SchoolDayErrors = { fields: {}, periods: {} };

/**
 * Settings → School Day & Bells (`/settings/academic`): the school's
 * timezone, teaching days, morning-register times and bell schedule. Teachers'
 * Today and Timetable screens, and the admin timetable's period picker, read
 * these.
 *
 * @param props.canManage - False for a role without `manage:settings`: every
 *   field is shown read-only and there is nothing to save.
 */
export function SchoolDaySection({ canManage }: { canManage: boolean }) {
  const query = useAcademicSettings();

  if (query.isLoading) return <SectionSkeleton title={TITLE} desc={DESC} rows={3} />;
  if (query.isError || !query.data) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={query.error}
        fallback="Failed to load the school day settings."
        onRetry={() => void query.refetch()}
      />
    );
  }

  // A fresh form whenever the saved content changes (after a save), but not
  // on a background refetch that brings back the same settings.
  return <SchoolDayForm key={JSON.stringify(query.data)} settings={query.data} canManage={canManage} />;
}

/** The editable form, seeded from the saved settings. */
function SchoolDayForm({ settings, canManage }: { settings: AcademicSettings; canManage: boolean }) {
  const { save, saving } = useUpdateAcademicSettings();
  const [values, setValues] = useState<SchoolDayValues>(() => toSchoolDayValues(settings));
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<SchoolDayErrors>(NO_ERRORS);

  const zones = useMemo(() => timezoneOptions(settings.timezone), [settings.timezone]);
  const liveErrors = useMemo(() => validateSchoolDay(values), [values]);
  // Checks show once a save was tried, then follow every edit.
  const errors: SchoolDayErrors = submitted
    ? {
        fields: { ...serverErrors.fields, ...liveErrors.fields },
        periods: { ...serverErrors.periods, ...liveErrors.periods },
      }
    : serverErrors;
  const dirty = isSchoolDayDirty(values, settings);

  const update = (patch: Partial<SchoolDayValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    setServerErrors(NO_ERRORS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSubmitted(true);
    if (hasSchoolDayErrors(liveErrors)) return;
    try {
      await save(toAcademicPayload(values, settings));
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const fieldErrors = err.fieldErrors();
        setServerErrors({
          fields: mapServerFieldErrors(fieldErrors),
          periods: mapServerPeriodErrors(values.periods, fieldErrors),
        });
      }
    }
  };

  const reset = () => {
    setValues(toSchoolDayValues(settings));
    setSubmitted(false);
    setServerErrors(NO_ERRORS);
  };

  const blocked = submitted && hasSchoolDayErrors(liveErrors);

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-label={TITLE}>
      <SectionHeader title={TITLE} desc={DESC} />

      {!canManage && (
        <Notice icon={<Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" aria-hidden />}>
          You can view these settings. Changing them needs the Manage Settings permission.
        </Notice>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Clock and week" />
          <div className="p-5 space-y-4">
            <div>
              <FieldLabel htmlFor="sd-timezone" required>
                Timezone
              </FieldLabel>
              <select
                id="sd-timezone"
                value={values.timezone}
                disabled={!canManage}
                onChange={(e) => update({ timezone: e.target.value })}
                className={controlClasses(Boolean(errors.fields.timezone))}
                {...describedBy("sd-timezone", errors.fields.timezone, "sd-timezone-hint")}
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <p id="sd-timezone-hint" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                &ldquo;Today&rdquo; and &ldquo;now&rdquo; for teachers are worked out in this timezone.
              </p>
              <FieldError controlId="sd-timezone" message={errors.fields.timezone} />
            </div>

            <fieldset {...describedBy("sd-days", errors.fields.schoolDays)}>
              <legend className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">
                School days
              </legend>
              <div className="flex flex-wrap gap-2">
                {TEACHING_WEEKDAYS.map((day) => {
                  const id = `sd-day-${day}`;
                  const checked = values.schoolDays.includes(day);
                  return (
                    <label
                      key={day}
                      htmlFor={id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer select-none ${
                        checked
                          ? "border-[#003366] dark:border-blue-500 bg-[#EBF0F7] dark:bg-blue-900/30 text-[#003366] dark:text-blue-200"
                          : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300"
                      } ${!canManage ? "opacity-70 cursor-default" : ""}`}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        disabled={!canManage}
                        onChange={(e) => update({ schoolDays: toggleSchoolDay(values.schoolDays, day, e.target.checked) })}
                        className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-[#003366] focus:ring-[#003366]"
                      />
                      {day.slice(0, 3)}
                      <span className="sr-only">{day.slice(3)}</span>
                    </label>
                  );
                })}
              </div>
              {errors.fields.schoolDays && (
                <p id={errorId("sd-days")} className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.fields.schoolDays}
                </p>
              )}
            </fieldset>
          </div>
        </Card>

        <Card>
          <CardHeader title="Morning register" />
          <div className="p-5 space-y-4">
            <div>
              <FieldLabel htmlFor="sd-register-close" required>
                Register closes at
              </FieldLabel>
              <input
                id="sd-register-close"
                type="time"
                value={values.registerCloseTime}
                disabled={!canManage}
                onChange={(e) => update({ registerCloseTime: e.target.value })}
                className={controlClasses(Boolean(errors.fields.registerCloseTime))}
                {...describedBy("sd-register-close", errors.fields.registerCloseTime, "sd-register-close-hint")}
              />
              <p id="sd-register-close-hint" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Class teachers are reminded until the morning register is in.
              </p>
              <FieldError controlId="sd-register-close" message={errors.fields.registerCloseTime} />
            </div>
            <div>
              <FieldLabel htmlFor="sd-register-edit" required>
                Teachers can edit until
              </FieldLabel>
              <input
                id="sd-register-edit"
                type="time"
                value={values.registerEditUntil}
                disabled={!canManage}
                onChange={(e) => update({ registerEditUntil: e.target.value })}
                className={controlClasses(Boolean(errors.fields.registerEditUntil))}
                {...describedBy("sd-register-edit", errors.fields.registerEditUntil, "sd-register-edit-hint")}
              />
              <p id="sd-register-edit-hint" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                After this a teacher can no longer change the day&apos;s register; admins still can.
              </p>
              <FieldError controlId="sd-register-edit" message={errors.fields.registerEditUntil} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Office hours"
            action={<Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden />}
          />
          <fieldset className="p-5 space-y-4" aria-describedby="sd-office-hint">
            <legend className="sr-only">Office hours (optional)</legend>
            <p id="sd-office-hint" className="text-xs text-gray-500 dark:text-slate-400">
              Optional. When the school office can be reached; teachers see it with the school&apos;s contact
              details. Leave both empty for none.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="sd-office-start">Office hours start</FieldLabel>
                <input
                  id="sd-office-start"
                  type="time"
                  value={values.officeHoursStart}
                  disabled={!canManage}
                  onChange={(e) => update({ officeHoursStart: e.target.value })}
                  className={controlClasses(Boolean(errors.fields.officeHoursStart))}
                  {...describedBy("sd-office-start", errors.fields.officeHoursStart)}
                />
                <FieldError controlId="sd-office-start" message={errors.fields.officeHoursStart} />
              </div>
              <div>
                <FieldLabel htmlFor="sd-office-end">Office hours end</FieldLabel>
                <input
                  id="sd-office-end"
                  type="time"
                  value={values.officeHoursEnd}
                  disabled={!canManage}
                  onChange={(e) => update({ officeHoursEnd: e.target.value })}
                  className={controlClasses(Boolean(errors.fields.officeHoursEnd))}
                  {...describedBy("sd-office-end", errors.fields.officeHoursEnd)}
                />
                <FieldError controlId="sd-office-end" message={errors.fields.officeHoursEnd} />
              </div>
            </div>
            {canManage && (values.officeHoursStart || values.officeHoursEnd) && (
              <button
                type="button"
                onClick={() => update({ officeHoursStart: "", officeHoursEnd: "" })}
                className="text-xs font-medium text-[#003366] dark:text-blue-400 hover:underline"
              >
                Clear office hours
              </button>
            )}
          </fieldset>
        </Card>
      </div>

      <BellScheduleEditor
        rows={values.periods}
        errors={errors.periods}
        canManage={canManage}
        onChange={(periods) => update({ periods })}
      />

      {canManage && (
        <div className="flex items-center justify-end gap-3">
          {blocked && (
            <p role="alert" className="mr-auto text-xs text-red-600 dark:text-red-400">
              Fix the highlighted fields before saving.
            </p>
          )}
          <OutlineBtn onClick={reset} disabled={!dirty || saving}>
            Discard changes
          </OutlineBtn>
          <PrimaryBtn type="submit" disabled={!dirty} loading={saving}>
            Save changes
          </PrimaryBtn>
        </div>
      )}
    </form>
  );
}
