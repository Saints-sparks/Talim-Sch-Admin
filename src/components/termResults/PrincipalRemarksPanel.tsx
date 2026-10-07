"use client";

import React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  OutlineBtn,
  PrimaryBtn,
  settingsErrorMessage,
} from "@/components/settings/ui";
import { FieldError, controlClasses, describedBy } from "@/components/settings/schoolDay/fields";
import { REMARK_MAX_LENGTH, type TermRemarkRow } from "@/types/gradingContract";
import {
  formatPercent,
  positionLabel,
  remarkValue,
  studentsMissingRemarks,
  validateRemark,
  type RemarkEdits,
} from "./termResults.model";

interface PrincipalRemarksPanelProps {
  query: UseQueryResult<TermRemarkRow[]>;
  edits: RemarkEdits;
  /** Number of students whose principal remark differs from what is saved. */
  changedCount: number;
  /** False shows every remark read-only (no permission, or locked). */
  editable: boolean;
  /** Shown above the remarks when they are locked (the results are published). */
  lockedNote?: string;
  saving: boolean;
  onEdit: (studentId: string, text: string) => void;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * The remarks (§22) for every student of the class: the class teacher's,
 * read-only, and the principal's, which the office writes here and saves
 * with one button (only the changed ones are sent).
 */
export function PrincipalRemarksPanel({
  query,
  edits,
  changedCount,
  editable,
  lockedNote,
  saving,
  onEdit,
  onSave,
  onDiscard,
}: PrincipalRemarksPanelProps) {
  const rows = query.data ?? [];
  const missing = studentsMissingRemarks(rows);
  const invalid = rows.some((row) => validateRemark(remarkValue(row, edits)));

  return (
    <Card>
      <CardHeader
        title="Remarks"
        action={
          editable && rows.length > 0 ? (
            <div className="flex items-center gap-2">
              <OutlineBtn
                onClick={onDiscard}
                disabled={changedCount === 0 || saving}
                className="!px-3 !py-1.5 !text-xs"
              >
                Discard
              </OutlineBtn>
              <PrimaryBtn
                onClick={onSave}
                disabled={changedCount === 0 || invalid}
                loading={saving}
                className="!px-3 !py-1.5 !text-xs"
              >
                {changedCount > 0 ? `Save remarks (${changedCount})` : "Save remarks"}
              </PrimaryBtn>
            </div>
          ) : undefined
        }
      />

      {query.isLoading ? (
        <div className="p-5 space-y-2" aria-busy="true" aria-label="Loading the remarks">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-tl-track animate-pulse" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="p-5 text-sm text-tl-muted" role="alert">
          {settingsErrorMessage(query.error, "The remarks could not be loaded.")}{" "}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="font-semibold text-tl-brand underline"
          >
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="p-5 text-sm text-tl-muted">No students in this class.</p>
      ) : (
        <div className="p-5 space-y-3">
          {lockedNote && (
            <p
              role="status"
              className="rounded-lg border border-tl-success/30 bg-tl-success-bg px-3 py-2 text-sm text-tl-success"
            >
              {lockedNote}
            </p>
          )}
          <p className="text-xs text-tl-muted">
            {missing.length === 0
              ? "Every student has a class teacher remark."
              : `${missing.length} ${missing.length === 1 ? "student has" : "students have"} no class teacher remark yet.`}
            {editable &&
              " The principal's remark is optional; each is saved when you press Save remarks."}
          </p>
          <ul className="divide-y divide-tl-line-soft" aria-label="Remarks by student">
            {rows.map((row) => (
              <RemarkRow
                key={row.student.id}
                row={row}
                edits={edits}
                editable={editable}
                onEdit={onEdit}
              />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/** One student's remarks. */
function RemarkRow({
  row,
  edits,
  editable,
  onEdit,
}: {
  row: TermRemarkRow;
  edits: RemarkEdits;
  editable: boolean;
  onEdit: (studentId: string, text: string) => void;
}) {
  const id = `principal-remark-${row.student.id}`;
  const value = remarkValue(row, edits);
  const error = validateRemark(value);
  const teacherRemark = row.classTeacherRemark.trim();

  return (
    <li className="py-3 grid gap-3 md:grid-cols-[minmax(10rem,14rem)_1fr_1fr]">
      <div>
        <p className="text-sm font-medium text-tl-ink">{row.student.name}</p>
        <p className="text-xs text-tl-muted tabular-nums">
          {positionLabel(row.position)} · average {formatPercent(row.average)} ·{" "}
          {row.publishedCount}/{row.subjectCount} subjects
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-tl-body mb-1">Class teacher</p>
        {teacherRemark ? (
          <p className="text-sm text-tl-ink whitespace-pre-line">{teacherRemark}</p>
        ) : (
          <p className="text-sm italic text-tl-warning">No remark yet</p>
        )}
      </div>

      <div>
        {editable ? (
          <>
            <label htmlFor={id} className="block text-xs font-medium text-tl-body mb-1">
              Principal <span className="sr-only">remark for {row.student.name}</span>
            </label>
            <textarea
              id={id}
              rows={2}
              value={value}
              maxLength={REMARK_MAX_LENGTH}
              onChange={(e) => onEdit(row.student.id, e.target.value)}
              className={`${controlClasses(Boolean(error))} resize-y`}
              {...describedBy(id, error, `${id}-count`)}
            />
            <p
              id={`${id}-count`}
              className="mt-0.5 text-[11px] text-tl-muted text-right tabular-nums"
            >
              {value.length}/{REMARK_MAX_LENGTH}
              <span className="sr-only"> characters</span>
            </p>
            <FieldError controlId={id} message={error} />
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-tl-body mb-1">Principal</p>
            <p className="text-sm text-tl-ink whitespace-pre-line">
              {row.principalRemark.trim() || <span className="italic text-tl-muted">None</span>}
            </p>
          </>
        )}
      </div>
    </li>
  );
}
