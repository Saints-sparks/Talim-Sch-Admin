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

const TH =
  "px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap";
const TD = "px-3 py-2 text-sm text-gray-800 dark:text-slate-200 whitespace-nowrap tabular-nums";

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
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</h3>
            {query.data && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
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
              <div key={i} className="h-8 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : query.isError || !query.data ? (
          <div className="p-5 text-sm text-gray-600 dark:text-slate-300" role="alert">
            {settingsErrorMessage(query.error, "The broadsheet could not be loaded.")}{" "}
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="font-semibold text-[#003366] dark:text-blue-400 underline"
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
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
          <span>
            Not every subject is published: waiting on{" "}
            {sheet.waitingOn.map((w) => w.title).join(", ")}. A teacher may have unlocked scores to
            correct them since the results were submitted.
          </span>
        </div>
      )}

      {sheet.rows.length === 0 ? (
        <p className="p-5 text-sm text-gray-500 dark:text-slate-400">No students in this class.</p>
      ) : (
        <div className="overflow-x-auto p-2" data-print-overflow>
          <table className="min-w-full border-collapse">
            <caption className="sr-only">
              {caption}. {cellUnit(sheet.basis)}.
            </caption>
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th scope="col" className={`${TH} sticky left-0 z-10 bg-white dark:bg-slate-800`}>
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
                <tr
                  key={row.student.id}
                  className="border-b border-gray-100 dark:border-slate-700/60 last:border-0"
                >
                  <th
                    scope="row"
                    className={`${TD} text-left font-medium sticky left-0 bg-white dark:bg-slate-800`}
                  >
                    <span className="block text-gray-900 dark:text-slate-100">
                      {row.student.name}
                    </span>
                    {row.student.admissionNumber && (
                      <span className="block text-[11px] font-normal text-gray-500 dark:text-slate-400">
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
                  <td
                    className={`${TD} text-center font-semibold text-[#003366] dark:text-blue-300`}
                  >
                    {row.grade ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {unpublished.length > 0 && (
            <p className="px-3 pt-2 text-[11px] text-gray-500 dark:text-slate-400">
              * Not published yet.
            </p>
          )}
        </div>
      )}
    </>
  );
}
