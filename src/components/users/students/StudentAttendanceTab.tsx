"use client";

import React from "react";
import { Clock, School, UserCheck } from "lucide-react";
import { getErrorMessage } from "@/lib/apiError";
import type { StudentAttendanceKpis, StudentById } from "@/app/services/student.service";
import { TabHeading } from "./profileAtoms";

interface StudentAttendanceTabProps {
  /** The student whose attendance this is. */
  student: StudentById;
  /** The attendance figures, once loaded. */
  attendance?: StudentAttendanceKpis;
  /** True while the figures are loading. */
  isLoading: boolean;
  /** Whatever the attendance query threw, if it failed. */
  error: unknown;
  /** Retries the attendance request. */
  onRetry: () => void;
}

/** A short date range like `1 Sep 2024 – 20 Dec 2024`. */
function rangeLabel(range: { startDate: string; endDate: string }): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${format(range.startDate)} – ${format(range.endDate)}`;
}

/** Colour band for an attendance rate: green at 80+, orange at 60+, red below. */
function rateTone(rate: number): { text: string; bar: string } {
  if (rate >= 80) return { text: "text-tl-success", bar: "bg-tl-success" };
  if (rate >= 60) return { text: "text-tl-warning", bar: "bg-tl-warning" };
  return { text: "text-tl-danger", bar: "bg-tl-danger" };
}

function StatCard({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className={`text-center p-4 rounded-xl border ${tone}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 font-medium opacity-80">{label}</div>
    </div>
  );
}

/** The attendance tab: rate, per-status totals, and the class/account summary. */
export function StudentAttendanceTab({
  student,
  attendance,
  isLoading,
  error,
  onRetry,
}: StudentAttendanceTabProps) {
  const tone = rateTone(attendance?.attendanceRate ?? 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <TabHeading
          icon={UserCheck}
          title="Attendance Overview"
          tone="orange"
          subtitle={attendance?.termInfo?.name}
        />
        {attendance?.dateRange && (
          <p className="text-xs text-tl-faint">{rangeLabel(attendance.dateRange)}</p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-36 bg-tl-track rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-tl-track rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-tl-danger-bg rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-tl-danger" />
          </div>
          <p className="text-sm font-medium text-tl-body">Attendance couldn&apos;t be loaded</p>
          <p className="text-xs text-tl-faint mt-1 max-w-xs">
            {getErrorMessage(error, "Something went wrong loading attendance.")}
          </p>
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-tl-track text-tl-body hover:bg-tl-bg"
          >
            Try again
          </button>
        </div>
      ) : attendance ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center py-8 bg-tl-subtle rounded-xl border border-tl-line">
            <p className="text-xs font-medium text-tl-muted uppercase tracking-wide mb-3">
              Attendance Rate
            </p>
            <div className={`text-5xl sm:text-6xl font-bold ${tone.text}`}>
              {attendance.attendanceRate}%
            </div>
            <div className="mt-4 w-48 sm:w-64 h-2.5 bg-tl-line rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${tone.bar}`}
                style={{ width: `${Math.min(attendance.attendanceRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-tl-faint mt-2">
              {attendance.presentDays} present out of {attendance.totalDays} recorded days
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              value={attendance.totalDays}
              label="Total Days"
              tone="bg-tl-select border-tl-control text-tl-link"
            />
            <StatCard
              value={attendance.presentDays}
              label="Present"
              tone="bg-tl-success-bg border-tl-success/30 text-tl-success"
            />
            <StatCard
              value={attendance.absentDays}
              label="Absent"
              tone="bg-tl-danger-bg border-tl-danger/30 text-tl-danger"
            />
            <StatCard
              value={attendance.lateDays}
              label="Late"
              tone="bg-tl-warning-bg border-tl-warning/30 text-tl-warning"
            />
            <div className="col-span-2 sm:col-span-1">
              <StatCard
                value={attendance.excusedDays}
                label="Excused"
                tone="bg-tl-subtle border-tl-line text-tl-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-tl-line bg-tl-subtle p-4">
              <School className="w-5 h-5 text-tl-faint flex-shrink-0" />
              <div>
                <p className="text-xs text-tl-faint font-medium uppercase tracking-wide">Class</p>
                <p className="text-sm font-semibold text-tl-ink mt-0.5">
                  {attendance.classInfo?.name ?? "Not assigned"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-tl-line bg-tl-subtle p-4">
              <Clock className="w-5 h-5 text-tl-faint flex-shrink-0" />
              <div>
                <p className="text-xs text-tl-faint font-medium uppercase tracking-wide">
                  Account Status
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    student.isActive
                      ? "bg-tl-success-bg text-tl-success"
                      : "bg-tl-danger-bg text-tl-danger"
                  }`}
                >
                  {student.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-tl-track rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-tl-faint" />
          </div>
          <p className="text-sm font-medium text-tl-body">No attendance data yet</p>
          <p className="text-xs text-tl-faint mt-1 max-w-xs">
            Attendance records will appear here once a teacher begins marking attendance for this
            student.
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentAttendanceTab;
