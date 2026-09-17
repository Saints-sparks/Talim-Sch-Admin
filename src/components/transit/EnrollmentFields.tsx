"use client";

import React from "react";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import { getAcademicYearLabel } from "@/app/services/academic.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { SelectField } from "@/components/transit/ui";

/** The class, academic year and term a new enrollment needs. */
export interface EnrollmentDraft {
  classId: string;
  academicYearId: string;
  termId: string;
}

/** True once the draft carries everything `CreateEnrollmentDto` requires. */
export function isEnrollmentDraftComplete(draft: EnrollmentDraft): boolean {
  return Boolean(draft.classId && draft.academicYearId);
}

/**
 * The three selects every enrollment form shares.
 *
 * Terms are narrowed to the chosen academic year, so a term from another year
 * can never be submitted, and the year select stays empty rather than offering
 * an `undefined` option while the list loads.
 */
export function EnrollmentFields({
  draft,
  onChange,
  classes,
  academicYears,
  terms,
  loading,
  layout = "stacked",
}: {
  draft: EnrollmentDraft;
  onChange: (patch: Partial<EnrollmentDraft>) => void;
  classes: ClassOption[];
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  loading: boolean;
  layout?: "stacked" | "row";
}) {
  const termsForYear = draft.academicYearId
    ? terms.filter((term) => term.academicYearId === draft.academicYearId)
    : terms;

  return (
    <div className={layout === "row" ? "grid grid-cols-1 sm:grid-cols-3 gap-3" : "space-y-4"}>
      <SelectField
        label="Class"
        required
        value={draft.classId}
        disabled={loading}
        onChange={(classId) => onChange({ classId })}
      >
        <option value="">{loading ? "Loading classes..." : "Select class..."}</option>
        {classes.map((option) => (
          <option key={option._id} value={option._id}>
            {option.gradeLevel ? `${option.name} (${option.gradeLevel})` : option.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Academic Year"
        required
        value={draft.academicYearId}
        disabled={loading}
        onChange={(academicYearId) => onChange({ academicYearId, termId: "" })}
      >
        <option value="">{loading ? "Loading years..." : "Select academic year..."}</option>
        {academicYears.map((year) => (
          <option key={year._id} value={year._id}>
            {getAcademicYearLabel(year)}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Term"
        value={draft.termId}
        disabled={loading || !draft.academicYearId}
        onChange={(termId) => onChange({ termId })}
      >
        <option value="">
          {draft.academicYearId ? "Optional" : "Pick an academic year first"}
        </option>
        {termsForYear.map((term) => (
          <option key={term._id} value={term._id}>
            {term.name}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
