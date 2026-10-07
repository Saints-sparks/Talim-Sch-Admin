"use client";

import React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, Printer } from "lucide-react";
import { Card, OutlineBtn, settingsErrorMessage } from "@/components/settings/ui";
import type { Broadsheet, TermResultSubmission } from "@/types/gradingContract";
import {
  basisLabel,
  cellUnit,
  formatCell,
  formatPercent,
  positionLabel,
} from "./termResults.model";

const TH = "px-3 py-2 text-left text-xs font-semibold text-tl-muted whitespace-nowrap";
const TD = "px-3 py-2 text-sm text-tl-ink whitespace-nowrap tabular-nums";

/**
 * A class's broadsheet (§21), read-only: one row per student, one column per
 * subject, then the total, average, position and grade. Published scores
 * only; a subject not yet published is marked in its header.
 *
 * The card sits in a `data-print-root` box, so printing the page (the Print
 * button or the browser's own) prints this table alone; see the print rules
 * in `globals.css`.
 */
export function BroadsheetTable({
  submission,
  query,
}: {
  submission: TermResultSubmission;
  query: UseQueryResult<Broadsheet>;
}) {
  const title = `Broadsheet · ${submission.class.name} · ${submission.term.name} · ${basisLabel(submission.basis)}`;

  return (
    <div data-print-root>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-tl-line-soft">
          <div>
            <h3 className="text-sm font-semibold text-tl-ink">{title}</h3>
            {query.data && (
              <p className="text-xs text-tl-muted mt-0.5">
                {cellUnit(query.data.basis)} · published scores only
              </p>
            )}
          </div>
          <div data-print-hide>
            <OutlineBtn
              onClick={() => window.print()}
              disabled={!query.data}
              className="!px-3 !py-1.5 !text-xs"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden />
              Print
            </OutlineBtn>
          </div>
        </div>

        {query.isLoading ? (
          <div className="p-5 space-y-2" aria-busy="true" aria-label="Loading the broadsheet">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-tl-track animate-pulse" />
            ))}
          </div>
        ) : query.isError || !query.data ? (
          <div className="p-5 text-sm text-tl-muted" role="alert">
            {settingsErrorMessage(query.error, "The broadsheet could not be loaded.")}{" "}
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="font-semibold text-tl-brand underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <BroadsheetBody sheet={query.data} caption={title} />
        )}
      </Card>
    </div>
  );
}

/** The table itself, with the "waiting on" note when a subject is not published. */
function BroadsheetBody({ sheet, caption }: { sheet: Broadsheet; caption: string }) {
  const unpublished = sheet.subjects.filter((s) => !s.published);

  return (
    <>
      {!sheet.ready && sheet.waitingOn.length > 0 && (
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-tl-warning/30 bg-tl-warning-bg p-3 text-xs text-tl-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
          <span>
            Not every subject is published: waiting on{" "}
            {sheet.waitingOn.map((w) => w.title).join(", ")}. A teacher may have unlocked scores to
            correct them since the results were submitted.
          </span>
        </div>
      )}

      {sheet.rows.length === 0 ? (
        <p className="p-5 text-sm text-tl-muted">No students in this class.</p>
      ) : (
        <div className="overflow-x-auto p-2" data-print-overflow>
          <table className="min-w-full border-collapse">
            <caption className="sr-only">
              {caption}. {cellUnit(sheet.basis)}.
            </caption>
            <thead>
              <tr className="border-b border-tl-line">
                <th scope="col" className={`${TH} sticky left-0 z-10 bg-tl-surface`}>
                  Student
                </th>
                {sheet.subjects.map((s) => (
                  <th key={s.courseId} scope="col" className={`${TH} text-right`} title={s.title}>
                    <span aria-hidden>
                      {s.code || s.title}
                      {!s.published && " *"}
                    </span>
                    <span className="sr-only">
                      {s.title}
                      {!s.published && " (not published)"}
                    </span>
                  </th>
                ))}
                <th scope="col" className={`${TH} text-right`}>
                  Total
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Average
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Position
                </th>
                <th scope="col" className={`${TH} text-center`}>
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row) => (
                <tr key={row.student.id} className="border-b border-tl-line-soft last:border-0">
                  <th
                    scope="row"
                    className={`${TD} text-left font-medium sticky left-0 bg-tl-surface`}
                  >
                    <span className="block text-tl-ink">{row.student.name}</span>
                    {row.student.admissionNumber && (
                      <span className="block text-[11px] font-normal text-tl-muted">
                        {row.student.admissionNumber}
                      </span>
                    )}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={sheet.subjects[i]?.courseId ?? i} className={`${TD} text-right`}>
                      {formatCell(cell, sheet.basis)}
                    </td>
                  ))}
                  <td className={`${TD} text-right font-medium`}>{row.total ?? "—"}</td>
                  <td className={`${TD} text-right`}>{formatPercent(row.average)}</td>
                  <td className={`${TD} text-right`}>{positionLabel(row.position)}</td>
                  <td className={`${TD} text-center font-semibold text-tl-brand`}>
                    {row.grade ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {unpublished.length > 0 && (
            <p className="px-3 pt-2 text-[11px] text-tl-muted">* Not published yet.</p>
          )}
        </div>
      )}
    </>
  );
}
