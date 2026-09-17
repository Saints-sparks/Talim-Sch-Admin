"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarRange, Plus } from "lucide-react";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { useEnrollmentHistory } from "@/hooks/transit/useEnrollments";
import { useClassOptions, useSchoolStudents } from "@/hooks/transit/useTransitReference";
import { cn } from "@/lib/utils";
import { SkeletonRows, text } from "@/components/transit/ui";
import { TransitEmptyState, TransitErrorState } from "@/components/transit/TransitStates";
import { EnrollmentTimeline } from "@/components/transit/EnrollmentTimeline";
import { EnrollStudentModal } from "@/components/transit/EnrollStudentModal";

/**
 * One student's enrollment history, and the way to open the next one.
 *
 * The student's name comes from the school directory the enrollment pages
 * already have cached — the history endpoint populates classes and years, not
 * the student — so this page adds no request of its own for it.
 */
export default function StudentEnrollmentHistoryPage() {
  const router = useRouter();
  const { studentId } = useParams<{ studentId: string }>();
  const [enrollOpen, setEnrollOpen] = useState(false);

  const history = useEnrollmentHistory(studentId);
  const students = useSchoolStudents();
  const { classes, isLoading: classesLoading } = useClassOptions();
  const years = useAcademicYears();
  const terms = useTerms();

  const studentName = useMemo(() => {
    const match = (students.data ?? []).find((student) => student._id === studentId);
    if (!match) return "";
    return `${match.firstName} ${match.lastName}`.trim() || match.admissionNumber || "";
  }, [students.data, studentId]);

  const rows = history.data ?? [];
  const hasActive = rows.some((enrollment) => enrollment.status === "active");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/transit/enrollments")}
            aria-label="Back to enrollments"
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className={cn("w-4 h-4", text.body)} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={cn("text-2xl font-bold", text.strong)}>{studentName || "Student"}</h1>
              {hasActive && (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                  Active
                </span>
              )}
            </div>
            <p className={cn("text-sm", text.muted)}>Enrollment history</p>
          </div>
        </div>

        <PermissionGate permission={Permission.MANAGE_TRANSIT}>
          <button
            type="button"
            onClick={() => setEnrollOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#003366] hover:bg-[#003366]/90 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Enrol in New Class
          </button>
        </PermissionGate>
      </div>

      {history.isLoading ? (
        <SkeletonRows count={4} height="h-24" />
      ) : history.isError ? (
        <TransitErrorState
          error={history.error}
          onRetry={() => history.refetch()}
          fallbackTitle="We couldn't load this history"
        />
      ) : rows.length === 0 ? (
        <TransitEmptyState
          icon={CalendarRange}
          title="No enrollment history"
          message="This student has not been enrolled in any class yet."
        />
      ) : (
        <EnrollmentTimeline history={rows} />
      )}

      {enrollOpen && (
        <EnrollStudentModal
          onClose={() => setEnrollOpen(false)}
          student={{ id: studentId, name: studentName || "this student" }}
          classes={classes}
          academicYears={years.data ?? []}
          terms={terms.data ?? []}
          referenceLoading={classesLoading || years.isLoading || terms.isLoading}
        />
      )}
    </div>
  );
}
