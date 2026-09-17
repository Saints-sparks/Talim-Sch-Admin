"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { classLabel, refLabel, type StudentEnrollment } from "@/app/services/transit.service";
import { surface, text } from "@/components/transit/ui";
import { formatTransitDate } from "@/components/transit/transferStatus";
import {
  ENROLLMENT_STATUS_COLORS,
  ENROLLMENT_STATUS_LABELS,
} from "@/components/transit/EnrollmentsTable";

/** The left border colour that marks each card's status. */
const STATUS_BORDER: Partial<Record<StudentEnrollment["status"], string>> = {
  active: "border-l-green-500",
  year_ended: "border-l-amber-400",
  promoted: "border-l-purple-400",
  repeated: "border-l-orange-400",
  transferred_out: "border-l-blue-400",
  transferred_in: "border-l-sky-400",
  withdrawn: "border-l-rose-400",
  graduated: "border-l-indigo-400",
};

/** One student's enrollments down a single timeline, newest first. */
export function EnrollmentTimeline({ history }: { history: StudentEnrollment[] }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-800"
      />
      <ol className="space-y-4">
        {history.map((enrollment) => (
          <li key={enrollment._id} className="relative flex gap-4">
            <span
              aria-hidden
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                enrollment.status === "active"
                  ? "border-green-500 bg-green-50 dark:bg-green-500/15"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              )}
            >
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  enrollment.status === "active" ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"
                )}
              />
            </span>

            <div
              className={cn(
                "flex-1 rounded-xl p-4 shadow-sm border-l-4",
                surface.card,
                STATUS_BORDER[enrollment.status] ?? "border-l-gray-200 dark:border-l-slate-700"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-semibold", text.strong)}>
                      {classLabel(enrollment.classId)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        ENROLLMENT_STATUS_COLORS[enrollment.status] ??
                          "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                      {enrollment.source}
                    </span>
                  </div>
                  <p className={cn("text-sm mt-1", text.body)}>
                    {refLabel(enrollment.academicYearId)}
                  </p>
                  {enrollment.termId && (
                    <p className={cn("text-xs", text.muted)}>{refLabel(enrollment.termId)}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-xs", text.muted)}>
                    {formatTransitDate(enrollment.startDate ?? enrollment.createdAt)}
                  </p>
                  {enrollment.endDate ? (
                    <p className={cn("text-xs", text.muted)}>
                      — {formatTransitDate(enrollment.endDate)}
                    </p>
                  ) : (
                    enrollment.status === "active" && (
                      <p className="text-xs font-medium text-green-600 dark:text-green-400">
                        Present
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
