"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarRange, Plus } from "lucide-react";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { useEnrollmentHistory } from "@/hooks/transit/useEnrollments";
import { useClassOptions } from "@/hooks/transit/useTransitReference";
import { useStudent } from "@/hooks/users/useStudents";
import { cn } from "@/lib/utils";
import { SkeletonRows, text } from "@/components/transit/ui";
import { TransitEmptyState, TransitErrorState } from "@/components/transit/TransitStates";
import { EnrollmentTimeline } from "@/components/transit/EnrollmentTimeline";
import { EnrollStudentModal } from "@/components/transit/EnrollStudentModal";
import { pagePad, pageStack, pageTitle } from "@/components/tl/styles";

/**
 * One student's enrollment history, and the way to open the next one.
 *
 * The history endpoint populates classes and years, not the student, so the
 * name comes from the student's own record (`GET /students/:id`, the id the
 * enrollments table links with). The school directory the pickers use is keyed
 * by user id and holds one page of students, so a graduate or a record id
 * missed it and the heading read "Student".
 */
export default function StudentEnrollmentHistoryPage() {
  const router = useRouter();
  const { studentId } = useParams<{ studentId: string }>();
  const [enrollOpen, setEnrollOpen] = useState(false);

  const history = useEnrollmentHistory(studentId);
  const student = useStudent(studentId);
  const { classes, isLoading: classesLoading } = useClassOptions();
  const years = useAcademicYears();
  const terms = useTerms();

  const studentName = useMemo(() => {
    const record = student.data;
    if (!record) return "";
    const name = `${record.userId?.firstName ?? ""} ${record.userId?.lastName ?? ""}`.trim();
    return name || record.admissionNumber || "";
  }, [student.data]);

  const rows = history.data ?? [];
  const hasActive = rows.some((enrollment) => enrollment.status === "active");

  return (
    <div className={`${pagePad} ${pageStack}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/transit/enrollments")}
            aria-label="Back to enrollments"
            className="p-2 rounded-lg border border-tl-line transition-colors hover:bg-tl-bg"
          >
            <ArrowLeft className={cn("w-4 h-4", text.body)} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={pageTitle}>
                {studentName || (student.isLoading ? "Loading…" : "Student")}
              </h1>
              {hasActive && (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-tl-success-bg text-tl-success">
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tl-brand-fill hover:bg-tl-brand-fill-hover text-white text-sm font-medium transition-colors"
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
