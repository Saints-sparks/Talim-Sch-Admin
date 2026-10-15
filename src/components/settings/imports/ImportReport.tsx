"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  ImportCollectionResult,
  ImportIssuePage,
  ImportProgress,
} from "@/app/services/imports.service";
import {
  cardFrame,
  iconButton,
  sectionTitle,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tile,
  tr,
} from "@/components/tl";
import {
  collectionLabel,
  issueRowLabel,
  phaseLabel,
  progressPercent,
  sheetCounts,
} from "./importState";

/**
 * Rows per sheet as small tiles.
 *
 * @param props - The counts.
 * @param props.counts - Data rows per sheet.
 * @returns The tiles, or nothing when the file has not been read yet.
 */
export function SheetCounts({ counts }: { counts: Record<string, number> | undefined }) {
  const rows = sheetCounts(counts);
  if (rows.length === 0) return null;
  return (
    <section aria-label="Rows per sheet">
      <h3 className={`${sectionTitle} mb-2`}>Rows per sheet</h3>
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className={`${tile} !p-3`}>
            <dt className="text-xs font-bold text-tl-muted">{row.label}</dt>
            <dd className="mt-0.5 text-lg font-extrabold tabular-nums text-tl-ink">
              {row.count.toLocaleString("en")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Props for {@link IssueTable}. */
export interface IssueTableProps {
  /** "Errors" or "Warnings": the heading and the table's name. */
  title: string;
  /** The page of issues. */
  issues: ImportIssuePage;
  /** How many there are in all (may be more than the 1,000 kept). */
  totalCount: number;
  /** Moves to another page. */
  onPageChange: (page: number) => void;
  /** A control beside the heading ("Download all errors (CSV)"). */
  action?: React.ReactNode;
}

/**
 * A paged table of issues: sheet, row, column and message.
 *
 * @param props - See {@link IssueTableProps}.
 * @param props.title - Heading.
 * @param props.issues - The page.
 * @param props.totalCount - All issues.
 * @param props.onPageChange - Page handler.
 * @param props.action - A control beside the heading.
 * @returns The table.
 */
export function IssueTable({ title, issues, totalCount, onPageChange, action }: IssueTableProps) {
  const pages = Math.max(1, Math.ceil(issues.total / Math.max(1, issues.pageSize)));
  const first = issues.total === 0 ? 0 : (issues.page - 1) * issues.pageSize + 1;
  const last = Math.min(issues.total, issues.page * issues.pageSize);
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={sectionTitle}>
          {title}{" "}
          <span className="font-bold text-tl-muted">({totalCount.toLocaleString("en")})</span>
        </h3>
        {action}
      </div>
      {totalCount > issues.total ? (
        <p className="text-[13px] text-tl-muted">
          The first {issues.total.toLocaleString("en")} are listed here; the CSV has all of them.
        </p>
      ) : null}
      <div className={cardFrame}>
        <div className={tableScroll}>
          <table className={`${table} min-w-[620px]`}>
            <thead>
              <tr className={theadRow}>
                <th scope="col" className={th}>
                  Sheet
                </th>
                <th scope="col" className={th}>
                  Row
                </th>
                <th scope="col" className={th}>
                  Column
                </th>
                <th scope="col" className={th}>
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {issues.items.map((issue, index) => (
                <tr key={`${issue.sheet}-${issue.row}-${issue.column}-${index}`} className={tr}>
                  <td className={`${td} whitespace-nowrap font-bold text-tl-ink`}>
                    {issue.sheet || "—"}
                  </td>
                  <td className={`${td} whitespace-nowrap tabular-nums`}>{issueRowLabel(issue)}</td>
                  <td className={`${td} whitespace-nowrap font-mono text-[13px]`}>
                    {issue.column || "—"}
                  </td>
                  <td className={td}>{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 ? (
        <nav
          aria-label={`${title} pages`}
          className="flex items-center justify-end gap-2 text-[13px] text-tl-muted"
        >
          <span className="tabular-nums">
            {first}–{last} of {issues.total.toLocaleString("en")}
          </span>
          <button
            type="button"
            className={iconButton}
            aria-label={`Previous ${title.toLowerCase()}`}
            disabled={issues.page <= 1}
            onClick={() => onPageChange(issues.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label={`Next ${title.toLowerCase()}`}
            disabled={issues.page >= pages}
            onClick={() => onPageChange(issues.page + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </section>
  );
}

/**
 * The queue's phase and a bar (done of total).
 *
 * @param props - The progress.
 * @param props.progress - Phase, done and total.
 * @param props.label - The bar's accessible name.
 * @returns The progress block.
 */
export function ImportProgressBar({
  progress,
  label,
}: {
  progress: ImportProgress | undefined;
  label: string;
}) {
  const pct = progressPercent(progress);
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-bold text-tl-ink">{phaseLabel(progress?.phase)}</span>
        {progress && progress.total > 0 ? (
          <span className="tabular-nums text-tl-muted">
            {progress.done.toLocaleString("en")} of {progress.total.toLocaleString("en")}
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? undefined}
        aria-valuetext={pct === null ? phaseLabel(progress?.phase) : `${pct}%`}
        className="h-2 overflow-hidden rounded bg-tl-line-soft"
      >
        <div
          className={`h-full rounded bg-tl-brand-fill transition-all duration-500 ${pct === null ? "w-1/3 animate-pulse" : ""}`}
          style={pct === null ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * What a finished import wrote, per collection.
 *
 * @param props - The result.
 * @param props.result - Created, updated and deleted per collection.
 * @returns The table, or nothing when there is no result.
 */
export function ImportResultTable({
  result,
}: {
  result: Record<string, ImportCollectionResult> | null;
}) {
  const rows = Object.entries(result ?? {});
  if (rows.length === 0) return null;
  const anyDeleted = rows.some(([, r]) => typeof r.deleted === "number" && r.deleted > 0);
  return (
    <section aria-label="What was imported" className="flex flex-col gap-2">
      <h3 className={sectionTitle}>What was imported</h3>
      <div className={cardFrame}>
        <div className={tableScroll}>
          <table className={table}>
            <thead>
              <tr className={theadRow}>
                <th scope="col" className={th}>
                  Records
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Created
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Updated
                </th>
                {anyDeleted ? (
                  <th scope="col" className={`${th} text-right`}>
                    Replaced
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, r]) => (
                <tr key={key} className={tr}>
                  <td className={`${td} font-bold text-tl-ink`}>{collectionLabel(key)}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {r.created.toLocaleString("en")}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {r.updated.toLocaleString("en")}
                  </td>
                  {anyDeleted ? (
                    <td className={`${td} text-right tabular-nums`}>
                      {(r.deleted ?? 0).toLocaleString("en")}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
