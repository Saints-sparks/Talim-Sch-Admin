"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { StudentSnapshot } from "@/app/services/transit.service";
import { text } from "@/components/transit/ui";

/**
 * The academic summary shown beside a chosen student.
 *
 * Only rendered for a student this school may read — its own, or one another
 * school has released. It shows counts and the current class, never the
 * underlying grade or attendance records.
 */
export function StudentSnapshotCard({
  snapshot,
  isLoading,
}: {
  snapshot?: StudentSnapshot;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="h-20 rounded-lg animate-pulse bg-gray-50 dark:bg-slate-800" aria-hidden />
    );
  }
  if (!snapshot) return null;

  const attendance =
    Object.entries(snapshot.attendanceSummary ?? {})
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ") || "—";

  return (
    <div className="rounded-lg border border-blue-100 dark:border-sky-500/30 bg-blue-50 dark:bg-sky-500/10 p-4">
      <p className={cn("text-xs font-semibold mb-2", text.brand)}>Academic Snapshot</p>
      <dl className={cn("grid grid-cols-2 gap-2 text-xs", text.body)}>
        <div>
          <dt className="inline">Current class: </dt>
          <dd className="inline font-medium">{snapshot.student.currentClass?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="inline">Attendance: </dt>
          <dd className="inline font-medium">{attendance}</dd>
        </div>
        <div>
          <dt className="inline">Recent grades: </dt>
          <dd className="inline font-medium">{snapshot.recentGrades?.length ?? 0} records</dd>
        </div>
        <div>
          <dt className="inline">Enrollment history: </dt>
          <dd className="inline font-medium">{snapshot.enrollmentHistory?.length ?? 0} records</dd>
        </div>
      </dl>
    </div>
  );
}
