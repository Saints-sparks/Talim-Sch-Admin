"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  promotionErrors,
  promotionWarnings,
  refLabel,
  type PromotionRun,
} from "@/app/services/transit.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { useBodyScrollLock } from "@/hooks/transit/useTransitUi";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { TransitErrorState } from "@/components/transit/TransitStates";
import { formatTransitDate } from "@/components/transit/transferStatus";
import { classNameById, IssueList, Meta } from "@/components/transit/promotions/promotionUi";

/** One run in full: its dates, its validation result and every decision in it. */
export function RunDetailsDrawer({
  run,
  classes,
  loading,
  error,
  onRetry,
  onClose,
}: {
  run: PromotionRun | null;
  classes: ClassOption[];
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
  onClose: () => void;
}) {
  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-[#030E18]/50"
      role="dialog"
      aria-modal="true"
      aria-label="Promotion run details"
    >
      <aside className={cn("h-full w-full max-w-2xl overflow-y-auto shadow-2xl", surface.card)}>
        <div
          className={cn(
            "sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 dark:border-slate-800 px-6 py-5",
            surface.card
          )}
        >
          <div>
            <h2 className={cn("text-xl font-semibold", text.strong)}>Promotion Run Details</h2>
            <p className={cn("mt-1 text-sm", text.muted)}>{run?._id ?? "Loading run"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className={cn("h-5 w-5", text.muted)} />
          </button>
        </div>

        {error ? (
          <div className="p-6">
            <TransitErrorState
              error={error}
              onRetry={onRetry}
              fallbackTitle="We couldn't load this run"
            />
          </div>
        ) : loading || !run ? (
          <div className="p-6">
            <SkeletonRows count={5} />
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Meta label="Status" value={run.status} badge />
              <Meta label="Students" value={String(run.decisions.length)} />
              <Meta label="From Year" value={refLabel(run.fromAcademicYearId)} />
              <Meta label="To Year" value={refLabel(run.toAcademicYearId)} />
              <Meta label="Target Term" value={refLabel(run.targetTermId, "No target term")} />
              <Meta label="Created" value={formatTransitDate(run.createdAt)} />
              <Meta label="Committed" value={formatTransitDate(run.committedAt)} />
              <Meta label="Updated" value={formatTransitDate(run.updatedAt)} />
            </div>

            {run.status === "committed" && (
              <p className="rounded-xl border border-green-100 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-300">
                This run is committed and read-only. The enrollments it replaced are kept as
                history.
              </p>
            )}

            <IssueList
              title="Validation errors"
              issues={promotionErrors(run)}
              tone="red"
              empty="No validation errors."
            />
            <IssueList
              title="Validation warnings"
              issues={promotionWarnings(run)}
              tone="amber"
              empty="No validation warnings."
            />

            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className={cn("text-left text-xs uppercase", surface.tableHead, text.muted)}>
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">From Class</th>
                      <th className="px-4 py-3">To Class</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Repeat</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", surface.divide)}>
                    {run.decisions.map((decision) => (
                      <tr key={`${decision.studentId}-${decision.toClassId}`}>
                        <td className={cn("px-4 py-3 font-mono text-xs", text.strong)}>
                          {decision.studentId}
                        </td>
                        <td className={cn("px-4 py-3", text.body)}>
                          {classNameById(classes, decision.fromClassId)}
                        </td>
                        <td className={cn("px-4 py-3", text.body)}>
                          {classNameById(classes, decision.toClassId)}
                        </td>
                        <td className={cn("px-4 py-3", text.body)}>
                          {decision.targetGradeLevel ?? "—"}
                        </td>
                        <td className={cn("px-4 py-3", text.body)}>
                          {decision.repeatClass ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
