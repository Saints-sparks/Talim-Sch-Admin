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
  manual: "bg-tl-track text-tl-muted",
  promotion: "bg-tl-accent-bg text-tl-accent",
  transfer: "bg-tl-select text-tl-link",
  onboarding: "bg-tl-success-bg text-tl-success",
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
  active: "bg-tl-success-bg text-tl-success",
  year_ended: "bg-tl-warning-bg text-tl-warning",
  promoted: "bg-tl-accent-bg text-tl-accent",
  repeated: "bg-tl-warning-bg text-tl-warning",
  transferred_out: "bg-tl-select text-tl-link",
  transferred_in: "bg-tl-select text-tl-link",
  withdrawn: "bg-tl-danger-bg text-tl-danger",
  graduated: "bg-tl-select text-tl-accent",
};

const COLUMNS = ["Student", "Class", "Academic Year", "Term", "Status", "Source", "Start Date"];

/** The enrollment list; each row opens that student's history. */
export function EnrollmentsTable({ enrollments }: { enrollments: StudentEnrollment[] }) {
  const router = useRouter();

  return (
    <div className={cn("rounded-xl shadow-sm overflow-hidden", surface.card)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className={cn("border-b border-tl-line-soft", surface.tableHead)}>
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
                  className="cursor-pointer transition-colors hover:bg-tl-bg"
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
                        ENROLLMENT_STATUS_COLORS[enrollment.status] ?? "bg-tl-track text-tl-muted"
                      )}
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        SOURCE_COLORS[enrollment.source] ?? "bg-tl-track text-tl-muted"
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
