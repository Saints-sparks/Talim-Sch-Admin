"use client";

/**
 * Where the term stands, how assessments are moving, and which classes are
 * fullest.
 *
 * Each of the three panels is gated separately: term progress is shown to
 * anyone who governs an academic area, assessments need `manage:assessments`
 * and the enrolment bars need `manage:classes`.
 */

import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, BarChart3, BookMarked, Clock } from "lucide-react";
import type { AcademicSummary, SchoolDashboardData } from "@/app/services/dashboard.service";
import { CardHeader, Pill, card, textLink, tile } from "@/components/tl";
import {
  IconTitle,
  PanelEmptyState,
  PanelLoading,
  PanelSkeleton,
  narrowPanelGrid,
} from "./primitives";

/** Props for {@link AcademicActivity}. */
interface AcademicActivityProps {
  /** The academic summary, or null when it failed or is empty. */
  academic: AcademicSummary | null;
  /** The base read, whose class distribution stands in for the summary's. */
  base: SchoolDashboardData | null;
  /** True while the summary loads. */
  isLoading: boolean;
  /** Whether the viewer may see assessments. */
  showAssessments: boolean;
  /** Whether the viewer may see classes. */
  showClasses: boolean;
}

/**
 * Short date for the term's start and end.
 *
 * @param value - An ISO date.
 * @returns "Sep 8, 2025".
 */
function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** The four assessment counts: words and the colour of the number. */
const ASSESSMENT_TILES = [
  { key: "active", label: "Active", tone: "text-tl-link" },
  { key: "pending", label: "Pending", tone: "text-tl-warning" },
  { key: "completed", label: "Completed", tone: "text-tl-success" },
  { key: "cancelled", label: "Cancelled", tone: "text-tl-danger" },
] as const;

/**
 * Three cards: how far through the term the school is, the assessments by
 * state, and the five fullest classes as bars. The second and third show
 * only to a viewer who governs assessments or classes.
 *
 * @param props - See {@link AcademicActivityProps}.
 * @param props.academic - The academic summary.
 * @param props.base - The base read.
 * @param props.isLoading - Whether it is loading.
 * @param props.showAssessments - Whether to show assessments.
 * @param props.showClasses - Whether to show classes.
 * @returns The cards, or their skeletons.
 */
export function AcademicActivity({
  academic,
  base,
  isLoading,
  showAssessments,
  showClasses,
}: AcademicActivityProps) {
  if (isLoading) {
    return (
      <PanelLoading label="Loading academic activity" className={narrowPanelGrid}>
        <PanelSkeleton minH={240} />
        <PanelSkeleton minH={240} />
        <PanelSkeleton minH={240} />
      </PanelLoading>
    );
  }

  const distribution =
    academic?.studentDistribution?.map((d) => ({
      className: d.className,
      count: d.count,
    })) ??
    base?.studentDistribution?.map((d) => ({
      className: d.className,
      count: d.studentCount,
    })) ??
    [];

  const topClasses = distribution.slice(0, 5);
  const maxCount = topClasses.length > 0 ? Math.max(...topClasses.map((c) => c.count)) : 1;
  const term = academic?.currentTerm;
  const assessments = academic?.assessments;

  return (
    <div className={narrowPanelGrid}>
      {/* Term progress */}
      <section className={`${card} flex flex-col gap-4`}>
        <CardHeader title={<IconTitle icon={<Activity />}>Current Term Progress</IconTitle>} />
        {term ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-tl-muted">
              {term.name} · {term.academicYear}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-extrabold leading-none tracking-[-0.6px] text-tl-ink tabular-nums">
                {term.elapsedPercent}%
              </span>
              <span className="text-[13px] font-bold text-tl-muted">Elapsed</span>
            </div>
            <div
              role="progressbar"
              aria-label="Term elapsed"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(term.elapsedPercent, 100)}
              className="h-2 w-full overflow-hidden rounded bg-tl-line-soft"
            >
              <div
                className="h-full rounded bg-tl-brand-fill transition-all duration-700"
                style={{ width: `${Math.min(term.elapsedPercent, 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-[13px] text-tl-muted">
              <span>Start: {shortDate(term.startDate)}</span>
              <span>End: {shortDate(term.endDate)}</span>
            </div>
            <Pill tone="info">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {term.daysRemaining} days remaining
            </Pill>
          </div>
        ) : (
          <PanelEmptyState message="No term data available" compact />
        )}
      </section>

      {/* Assessments overview */}
      {showAssessments && (
        <section className={`${card} flex flex-col gap-4`}>
          <CardHeader
            title={<IconTitle icon={<BookMarked />}>Assessments Overview</IconTitle>}
            actions={
              <Link href="/assessments" className={textLink}>
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          {assessments ? (
            <dl className="grid grid-cols-2 gap-2.5">
              {ASSESSMENT_TILES.map((item) => (
                <div key={item.key} className={`${tile} flex flex-col-reverse gap-0.5 px-3 py-3`}>
                  <dt className="text-[13px] font-bold text-tl-muted">{item.label}</dt>
                  <dd
                    className={`text-2xl font-extrabold tracking-[-0.3px] tabular-nums ${item.tone}`}
                  >
                    {assessments[item.key]}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <PanelEmptyState message="No assessment data" compact />
          )}
        </section>
      )}

      {/* Top classes by enrolment */}
      {showClasses && (
        <section className={`${card} flex flex-col gap-4`}>
          <CardHeader
            title={<IconTitle icon={<BarChart3 />}>Top Classes by Enrollment</IconTitle>}
            actions={
              <Link href="/classes" className={textLink}>
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          {topClasses.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {topClasses.map((cls) => (
                <li key={cls.className} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 truncate text-[13px] font-bold text-tl-body">
                    {cls.className}
                  </div>
                  <div aria-hidden className="h-2 flex-1 overflow-hidden rounded bg-tl-line-soft">
                    <div
                      className="h-full rounded bg-tl-brand-fill transition-all duration-700"
                      style={{ width: `${(cls.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-[13px] font-bold text-tl-muted tabular-nums">
                    {cls.count}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmptyState message="No enrollment data" compact />
          )}
        </section>
      )}
    </div>
  );
}
