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
import { cn } from "@/lib/utils";
import type { AcademicSummary, SchoolDashboardData } from "@/app/services/dashboard.service";
import { PanelEmptyState, PanelSkeleton } from "./primitives";

interface AcademicActivityProps {
  academic: AcademicSummary | null;
  base: SchoolDashboardData | null;
  isLoading: boolean;
  showAssessments: boolean;
  showClasses: boolean;
}

/** Short date for the term's start and end. */
function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AcademicActivity({
  academic,
  base,
  isLoading,
  showAssessments,
  showClasses,
}: AcademicActivityProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PanelSkeleton minH={220} />
        <PanelSkeleton minH={220} />
        <PanelSkeleton minH={220} />
      </div>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Term Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
          Current Term Progress
        </h3>
        {term ? (
          <>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
              {term.name} · {term.academicYear}
            </p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                {term.elapsedPercent}%
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-500">Elapsed</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-[#003366] dark:bg-blue-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(term.elapsedPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mb-4">
              <span>Start: {shortDate(term.startDate)}</span>
              <span>End: {shortDate(term.endDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#003366] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg w-fit">
              <Clock className="w-3.5 h-3.5" />
              {term.daysRemaining} days remaining
            </div>
          </>
        ) : (
          <PanelEmptyState message="No term data available" compact />
        )}
      </div>

      {/* Assessments Overview */}
      {showAssessments && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
              Assessments Overview
            </h3>
            <Link
              href="/assessments"
              className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {assessments ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Active",
                  value: assessments.active,
                  cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                },
                {
                  label: "Pending",
                  value: assessments.pending,
                  cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
                },
                {
                  label: "Completed",
                  value: assessments.completed,
                  cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Cancelled",
                  value: assessments.cancelled,
                  cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                },
              ].map((item) => (
                <div key={item.label} className={cn("rounded-xl p-3 text-center", item.cls)}>
                  <div className="text-2xl font-bold tabular-nums">{item.value}</div>
                  <div className="text-xs mt-0.5 opacity-80">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <PanelEmptyState message="No assessment data" compact />
          )}
        </div>
      )}

      {/* Top Classes by Enrollment */}
      {showClasses && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
              Top Classes by Enrollment
            </h3>
            <Link
              href="/classes"
              className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topClasses.length > 0 ? (
            <div className="space-y-3">
              {topClasses.map((cls) => (
                <div key={cls.className} className="flex items-center gap-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-slate-300 w-14 flex-shrink-0 truncate">
                    {cls.className}
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-[#003366] dark:bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(cls.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs tabular-nums text-gray-500 dark:text-slate-400 w-7 text-right">
                    {cls.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PanelEmptyState message="No enrollment data" compact />
          )}
        </div>
      )}
    </div>
  );
}
