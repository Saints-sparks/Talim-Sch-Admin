"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ClipboardCheck } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { useTermResultsQueue } from "@/hooks/termResults/useTermResults";
import { usePermissions } from "@/hooks/usePermissions";
import { getErrorMessage } from "@/lib/apiError";
import { Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { TermResultStatus, TermResultSubmission } from "@/types/gradingContract";
import { TermResultDetail } from "./TermResultDetail";
import {
  STATUS_TABS,
  activeTermId,
  basisLabel,
  formatWhen,
  missingRemarksLabel,
  submitterName,
  termOptions,
} from "./termResults.model";

const TH =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300";
const TD = "px-4 py-3 text-sm text-gray-800 dark:text-slate-200 align-top";

/**
 * Term Results: the office's queue of class results. Class teachers submit
 * their class's results for a term (§23); the office opens a submission to
 * read the broadsheet (§21) and the remarks (§22), writes the principal's
 * remarks, and publishes the results to students and parents or returns
 * them to the class teacher with a reason.
 *
 * The route needs `manage:assessments` (RouteGuard); `canManage` repeats the
 * check for the write actions, as the other pages do.
 */
export function TermResultsScreen() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_ASSESSMENTS);

  const termsQuery = useTerms();
  const yearsQuery = useAcademicYears();
  const options = useMemo(
    () => termOptions(termsQuery.data ?? [], yearsQuery.data ?? []),
    [termsQuery.data, yearsQuery.data]
  );
  const [pickedTermId, setPickedTermId] = useState("");
  const termId = activeTermId(options, pickedTermId);
  const termLabel = options.find((o) => o.id === termId)?.label ?? "";

  const [status, setStatus] = useState<TermResultStatus>("submitted");
  const [open, setOpen] = useState<TermResultSubmission | null>(null);
  /** The submission just closed, whose Open button takes focus back. */
  const [returnFocusTo, setReturnFocusTo] = useState<string | null>(null);
  const openButtons = useRef(new Map<string, HTMLButtonElement>());

  const queue = useTermResultsQueue(termId, status);
  const tab = STATUS_TABS.find((t) => t.status === status) ?? STATUS_TABS[0];

  useEffect(() => {
    if (open || !returnFocusTo || !queue.data) return;
    openButtons.current.get(returnFocusTo)?.focus();
    setReturnFocusTo(null);
  }, [open, returnFocusTo, queue.data]);

  if (open) {
    return (
      <Page>
        <TermResultDetail
          submission={open}
          canManage={canManage}
          onBack={() => {
            setReturnFocusTo(open.id);
            setOpen(null);
          }}
        />
      </Page>
    );
  }

  if (termsQuery.isError) {
    return (
      <Page>
        <ErrorState
          title="Could not load terms"
          message={getErrorMessage(
            termsQuery.error,
            "Results belong to a term, and the term list could not be loaded."
          )}
          onRetry={() => void termsQuery.refetch()}
        />
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#003366]/10 dark:bg-blue-900/30">
            <ClipboardCheck className="w-6 h-6 text-[#003366] dark:text-blue-300" aria-hidden />
          </div>
          <div>
            <h1 className="text-[19px] font-semibold text-gray-900 dark:text-slate-100">
              Term Results
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Review the results class teachers submit, add the principal&apos;s remarks, then
              publish or return them.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="term-results-term"
            className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
          >
            Term
          </label>
          <div className="relative">
            <select
              id="term-results-term"
              value={termId}
              onChange={(e) => setPickedTermId(e.target.value)}
              disabled={options.length === 0}
              className="appearance-none min-w-[14rem] rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-3 pr-8 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 dark:focus:ring-blue-500/30"
            >
              {termsQuery.isLoading ? (
                <option value="">Loading terms…</option>
              ) : options.length === 0 ? (
                <option value="">No terms set up yet</option>
              ) : (
                options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                    {o.isCurrent ? " (current)" : ""}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-slate-400"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div role="group" aria-label="Show results that are" className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            aria-pressed={status === t.status}
            onClick={() => setStatus(t.status)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003366] dark:focus-visible:ring-blue-500",
              status === t.status
                ? "bg-[#003366] text-white dark:bg-blue-600"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {t.label}
            {status === t.status && queue.data ? ` (${queue.data.length})` : ""}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {termsQuery.isLoading || (queue.isLoading && Boolean(termId)) ? (
          <div className="p-5 space-y-2" aria-busy="true" aria-label="Loading the results">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : !termId ? (
          <p className="p-8 text-center text-sm text-gray-600 dark:text-slate-300">
            Set up the academic year and its terms in Settings first.
          </p>
        ) : queue.isError ? (
          <div className="p-5">
            <ErrorState
              title="Could not load the results"
              message={getErrorMessage(queue.error, "The results queue could not be loaded.")}
              onRetry={() => void queue.refetch()}
            />
          </div>
        ) : (queue.data ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-600 dark:text-slate-300">{tab.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <caption className="sr-only">
                {tab.label} results for {termLabel}
              </caption>
              <thead className="bg-gray-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className={TH}>
                    Class
                  </th>
                  <th scope="col" className={TH}>
                    Results
                  </th>
                  <th scope="col" className={TH}>
                    Submitted by
                  </th>
                  <th scope="col" className={TH}>
                    Submitted
                  </th>
                  <th scope="col" className={`${TH} text-right`}>
                    Students
                  </th>
                  <th scope="col" className={TH}>
                    Class teacher remarks
                  </th>
                  <th scope="col" className={TH}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {(queue.data ?? []).map((s) => {
                  const verb = s.status === "submitted" && canManage ? "Review" : "Open";
                  return (
                    <tr key={s.id}>
                      <th
                        scope="row"
                        className={`${TD} text-left font-semibold text-gray-900 dark:text-slate-100`}
                      >
                        {s.class.name}
                        {s.status === "returned" && s.returnReason && (
                          <span className="block mt-0.5 max-w-xs text-xs font-normal text-rose-700 dark:text-rose-300">
                            Returned: {s.returnReason}
                          </span>
                        )}
                      </th>
                      <td className={TD}>{basisLabel(s.basis)}</td>
                      <td className={TD}>{submitterName(s.submittedBy)}</td>
                      <td className={`${TD} whitespace-nowrap`}>{formatWhen(s.submittedAt)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{s.studentCount}</td>
                      <td className={TD}>
                        <span
                          className={
                            s.missingRemarks > 0
                              ? "font-medium text-amber-700 dark:text-amber-300"
                              : "text-gray-600 dark:text-slate-300"
                          }
                        >
                          {missingRemarksLabel(s.missingRemarks)}
                        </span>
                      </td>
                      <td className={`${TD} text-right`}>
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) openButtons.current.set(s.id, el);
                            else openButtons.current.delete(s.id);
                          }}
                          onClick={() => setOpen(s)}
                          aria-label={`${verb} ${s.class.name} results`}
                          className="rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-[#003366] dark:text-blue-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003366] dark:focus-visible:ring-blue-500"
                        >
                          {verb}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}

/** The page frame. */
function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen p-4 md:p-6 space-y-5">{children}</div>;
}
