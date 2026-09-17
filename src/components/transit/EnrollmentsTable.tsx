"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  classLabel,
  refId,
  refLabel,
  studentLabel,
  type EnrollmentSource,
  type EnrollmentStatus,
  type StudentEnrollment,
} from "@/app/services/transit.service";
import { surface, text } from "@/components/transit/ui";
import { formatTransitDate } from "@/components/transit/transferStatus";

/** Badge colours per enrollment source. */
const SOURCE_COLORS: Record<EnrollmentSource, string> = {
  manual: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  promotion: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  transfer: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  onboarding: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

/** How each enrollment status is spelled. */
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: "Active",
  year_ended: "Year Ended",
  promoted: "Promoted",
  repeated: "Repeated",
  transferred_out: "Transferred Out",
  transferred_in: "Transferred In",
  withdrawn: "Withdrawn",
  graduated: "Graduated",
};

/** Badge colours per enrollment status. */
export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  year_ended: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  promoted: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  repeated: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  transferred_out: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  transferred_in: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  withdrawn: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  graduated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
};

const COLUMNS = ["Student", "Class", "Academic Year", "Term", "Status", "Source", "Start Date"];

/** The enrollment list; each row opens that student's history. */
export function EnrollmentsTable({ enrollments }: { enrollments: StudentEnrollment[] }) {
  const router = useRouter();

  return (
    <div className={cn("rounded-xl shadow-sm overflow-hidden", surface.card)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className={cn("border-b border-gray-100 dark:border-slate-800", surface.tableHead)}>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className={cn("px-4 py-3 text-left font-medium", text.muted)}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("divide-y", surface.divide)}>
            {enrollments.map((enrollment) => {
              const studentId = refId(enrollment.studentId);
              return (
                <tr
                  key={enrollment._id}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(`/transit/enrollments/${studentId}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") router.push(`/transit/enrollments/${studentId}`);
                  }}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                >
                  <td className={cn("px-4 py-3 font-medium", text.strong)}>
                    {studentLabel(enrollment.studentId)}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>{classLabel(enrollment.classId)}</td>
                  <td className={cn("px-4 py-3", text.body)}>
                    {refLabel(enrollment.academicYearId)}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>{refLabel(enrollment.termId)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        ENROLLMENT_STATUS_COLORS[enrollment.status] ??
                          "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        SOURCE_COLORS[enrollment.source] ??
                          "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {enrollment.source}
                    </span>
                  </td>
                  <td className={cn("px-4 py-3", text.muted)}>
                    {formatTransitDate(enrollment.startDate ?? enrollment.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
