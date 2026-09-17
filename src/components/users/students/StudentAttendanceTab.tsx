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
    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${format(range.startDate)} – ${format(range.endDate)}`;
}

/** Colour band for an attendance rate: green at 80+, orange at 60+, red below. */
function rateTone(rate: number): { text: string; bar: string } {
  if (rate >= 80) return { text: "text-green-600 dark:text-green-400", bar: "bg-green-500" };
  if (rate >= 60) return { text: "text-orange-500 dark:text-orange-400", bar: "bg-orange-500" };
  return { text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
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
          <p className="text-xs text-gray-400 dark:text-slate-500">{rangeLabel(attendance.dateRange)}</p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-36 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
            Attendance couldn&apos;t be loaded
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
            {getErrorMessage(error, "Something went wrong loading attendance.")}
          </p>
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            Try again
          </button>
        </div>
      ) : attendance ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Attendance Rate
            </p>
            <div className={`text-5xl sm:text-6xl font-bold ${tone.text}`}>
              {attendance.attendanceRate}%
            </div>
            <div className="mt-4 w-48 sm:w-64 h-2.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${tone.bar}`}
                style={{ width: `${Math.min(attendance.attendanceRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
              {attendance.presentDays} present out of {attendance.totalDays} recorded days
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              value={attendance.totalDays}
              label="Total Days"
              tone="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300"
            />
            <StatCard
              value={attendance.presentDays}
              label="Present"
              tone="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/40 text-green-700 dark:text-green-300"
            />
            <StatCard
              value={attendance.absentDays}
              label="Absent"
              tone="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-300"
            />
            <StatCard
              value={attendance.lateDays}
              label="Late"
              tone="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/40 text-orange-700 dark:text-orange-300"
            />
            <div className="col-span-2 sm:col-span-1">
              <StatCard
                value={attendance.excusedDays}
                label="Excused"
                tone="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-4">
              <School className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wide">
                  Class
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 mt-0.5">
                  {attendance.classInfo?.name ?? "Not assigned"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-4">
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wide">
                  Account Status
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    student.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
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
          <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200">No attendance data yet</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
            Attendance records will appear here once a teacher begins marking attendance for this
            student.
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentAttendanceTab;
