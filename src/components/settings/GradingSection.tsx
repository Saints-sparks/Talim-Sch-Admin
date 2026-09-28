"use client";

import React, { useMemo, useState } from "react";
import { Info, RotateCcw } from "lucide-react";
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
import { FieldError, FieldLabel, controlClasses, describedBy } from "./schoolDay/fields";
import { GradeScaleEditor } from "./grading/GradeScaleEditor";
import { GradePreview } from "./grading/GradePreview";
import {
  DEFAULT_GRADE_SCALE,
  DEFAULT_PASS_MARK,
  hasGradingErrors,
  isDefaultGrading,
  isGradingDirty,
  mapServerGradingErrors,
  toBandDrafts,
  toGradingPayload,
  toPassMarkText,
  validateGrading,
  type BandDraft,
  type GradingErrors,
} from "./grading/gradeScale";

const TITLE = "Grading";
const DESC = "The school's grade scale and pass mark";
const NO_ERRORS: GradingErrors = { bands: {} };
const MESSAGES = { success: "Grading saved", failure: "Failed to save the grade scale" };

/**
 * Settings → Grading (`/settings/academic`, Round 3 §16): the letters the
 * school awards, the minimum percent for each, and the pass mark. Every grade
 * the API reports (teachers' grading sheets, the broadsheet, report cards) is
 * worked out from these on read, so a change applies to existing scores too.
 *
 * @param props.canManage - False for a role without `manage:settings`: the
 *   scale is shown read-only and there is nothing to save.
 */
export function GradingSection({ canManage }: { canManage: boolean }) {
  const query = useAcademicSettings();

  if (query.isLoading) return <SectionSkeleton title={TITLE} desc={DESC} rows={2} />;
  if (query.isError || !query.data) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={query.error}
        fallback="Failed to load the grade scale."
        onRetry={() => void query.refetch()}
      />
    );
  }

  // A fresh form whenever the saved scale changes (after a save), but not when
  // School Day & Bells saves or a refetch brings back the same scale.
  const key = JSON.stringify({ scale: query.data.gradeScale ?? null, pass: query.data.passMark ?? null });
  return <GradingForm key={key} settings={query.data} canManage={canManage} />;
}

/** The editable form, seeded from the saved settings. */
function GradingForm({ settings, canManage }: { settings: AcademicSettings; canManage: boolean }) {
  const { save, saving } = useUpdateAcademicSettings(MESSAGES);
  const [rows, setRows] = useState<BandDraft[]>(() => toBandDrafts(settings.gradeScale));
  const [passMark, setPassMark] = useState(() => toPassMarkText(settings.passMark));
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<GradingErrors>(NO_ERRORS);

  const liveErrors = useMemo(() => validateGrading(rows, passMark), [rows, passMark]);
  // Checks show once a save was tried, then follow every edit.
  const errors: GradingErrors = submitted
    ? {
        bands: { ...serverErrors.bands, ...liveErrors.bands },
        passMark: liveErrors.passMark ?? serverErrors.passMark,
        scale: liveErrors.scale ?? serverErrors.scale,
      }
    : serverErrors;
  const dirty = isGradingDirty(rows, passMark, settings);
  const blocked = submitted && hasGradingErrors(liveErrors);

  const changeRows = (next: BandDraft[]) => {
    setRows(next);
    setServerErrors(NO_ERRORS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSubmitted(true);
    if (hasGradingErrors(liveErrors)) return;
    try {
      await save(toGradingPayload(rows, passMark));
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        setServerErrors(mapServerGradingErrors(rows, err.fieldErrors()));
      }
    }
  };

  const discard = () => {
    setRows(toBandDrafts(settings.gradeScale));
    setPassMark(toPassMarkText(settings.passMark));
    setSubmitted(false);
    setServerErrors(NO_ERRORS);
  };

  const resetToDefault = () => {
    setRows(toBandDrafts(DEFAULT_GRADE_SCALE));
    setPassMark(String(DEFAULT_PASS_MARK));
    setServerErrors(NO_ERRORS);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-label={TITLE}>
      <SectionHeader title={TITLE} desc={DESC} />

      {!canManage && (
        <Notice icon={<Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" aria-hidden />}>
          You can view the grade scale. Changing it needs the Manage Settings permission.
        </Notice>
      )}

      <GradeScaleEditor
        rows={rows}
        errors={errors.bands}
        scaleError={errors.scale}
        canManage={canManage}
        onChange={changeRows}
      />

      <Card>
        <CardHeader title="Pass mark and preview" />
        <div className="p-5 space-y-4">
          <div className="max-w-[12rem]">
            <FieldLabel htmlFor="grading-pass-mark" required>
              Pass mark (%)
            </FieldLabel>
            <input
              id="grading-pass-mark"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="any"
              value={passMark}
              disabled={!canManage}
              onChange={(e) => {
                setPassMark(e.target.value);
                setServerErrors(NO_ERRORS);
              }}
              className={controlClasses(Boolean(errors.passMark))}
              {...describedBy("grading-pass-mark", errors.passMark, "grading-pass-mark-hint")}
            />
            <FieldError controlId="grading-pass-mark" message={errors.passMark} />
          </div>
          <p id="grading-pass-mark-hint" className="text-xs text-gray-500 dark:text-slate-400">
            Scores at or above this percent count as a pass, for example in the pass rates teachers see.
          </p>
          <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Preview</h4>
            <GradePreview rows={rows} passMark={passMark} />
          </div>
        </div>
      </Card>

      {canManage && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {blocked && (
            <p role="alert" className="mr-auto text-xs text-red-600 dark:text-red-400">
              Fix the highlighted fields before saving.
            </p>
          )}
          <OutlineBtn onClick={resetToDefault} disabled={saving || isDefaultGrading(rows, passMark)}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
            Reset to default
          </OutlineBtn>
          <OutlineBtn onClick={discard} disabled={!dirty || saving}>
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
