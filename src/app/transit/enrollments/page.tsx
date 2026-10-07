"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { getAcademicYearLabel } from "@/app/services/academic.service";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { useEnrollments } from "@/hooks/transit/useEnrollments";
import { useClassOptions, useSchoolStudents } from "@/hooks/transit/useTransitReference";
import { cn } from "@/lib/utils";
import { SelectField, SkeletonRows, text } from "@/components/transit/ui";
import { TransitEmptyState, TransitErrorState } from "@/components/transit/TransitStates";
import { EnrollmentsTable } from "@/components/transit/EnrollmentsTable";
import { EnrollStudentModal } from "@/components/transit/EnrollStudentModal";
import { BulkEnrollModal } from "@/components/transit/BulkEnrollModal";
import { pagePad, pageStack, pageTitle } from "@/components/tl/styles";

/** The status tabs; the API filters on the value. */
const STATUS_TABS = [
  { label: "Active", value: "active" },
  { label: "All", value: "" },
  { label: "Promoted", value: "promoted" },
  { label: "Repeated", value: "repeated" },
  { label: "Transferred Out", value: "transferred_out" },
  { label: "Transferred In", value: "transferred_in" },
  { label: "Withdrawn", value: "withdrawn" },
  { label: "Year Ended", value: "year_ended" },
  { label: "Graduated", value: "graduated" },
];

/** Which modal, if any, is open. */
type OpenModal = "single" | "bulk" | null;

/**
 * The school's enrollments, with the filters the API supports and the two ways
 * of opening a new one.
 */
export default function EnrollmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "active";

  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [modal, setModal] = useState<OpenModal>(null);

  const { classes, isLoading: classesLoading } = useClassOptions();
  const years = useAcademicYears();
  const terms = useTerms();
  const students = useSchoolStudents();
  const enrollments = useEnrollments({ status, classId, academicYearId });

  const referenceLoading = classesLoading || years.isLoading || terms.isLoading;
  const rows = enrollments.data ?? [];

  function selectStatus(next: string) {
    router.replace(`/transit/enrollments${next ? `?status=${next}` : ""}`);
  }

  return (
    <div className={`${pagePad} ${pageStack}`}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Enrollments</h1>
          <p className={cn("text-sm mt-1", text.muted)}>
            Manage student enrollments across classes and academic years.
          </p>
        </div>
        <PermissionGate permission={Permission.MANAGE_TRANSIT}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModal("bulk")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tl-brand text-tl-brand text-sm font-medium transition-colors hover:bg-tl-brand-fill-hover"
            >
              <Users className="w-4 h-4" />
              Bulk Enrol
            </button>
            <button
              type="button"
              onClick={() => setModal("single")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tl-brand-fill hover:bg-tl-brand-fill-hover text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Enrol Student
            </button>
          </div>
        </PermissionGate>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <SelectField
            label="Class"
            value={classId}
            onChange={setClassId}
            disabled={classesLoading}
          >
            <option value="">All Classes</option>
            {classes.map((option) => (
              <option key={option._id} value={option._id}>
                {option.name}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="w-56">
          <SelectField
            label="Academic Year"
            value={academicYearId}
            onChange={setAcademicYearId}
            disabled={years.isLoading}
          >
            <option value="">All Academic Years</option>
            {(years.data ?? []).map((year) => (
              <option key={year._id} value={year._id}>
                {getAcademicYearLabel(year)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Enrollment status"
        className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-tl-line-soft"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => selectStatus(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              status === tab.value
                ? "border-tl-brand text-tl-brand"
                : cn("border-transparent hover:text-tl-ink", text.muted)
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {enrollments.isLoading ? (
        <SkeletonRows />
      ) : enrollments.isError ? (
        <TransitErrorState
          error={enrollments.error}
          onRetry={() => enrollments.refetch()}
          fallbackTitle="We couldn't load enrollments"
        />
      ) : rows.length === 0 ? (
        <TransitEmptyState
          icon={Users}
          title="No enrollments found"
          message={
            classId || academicYearId || status
              ? "Nothing matches these filters yet."
              : "Enrol a student to get started."
          }
        />
      ) : (
        <EnrollmentsTable enrollments={rows} />
      )}

      {modal === "single" && (
        <EnrollStudentModal
          onClose={() => setModal(null)}
          students={students.data ?? []}
          studentsLoading={students.isLoading}
          studentsError={students.isError ? students.error : undefined}
          onRetryStudents={() => students.refetch()}
          classes={classes}
          academicYears={years.data ?? []}
          terms={terms.data ?? []}
          referenceLoading={referenceLoading}
        />
      )}

      {modal === "bulk" && (
        <BulkEnrollModal
          onClose={() => setModal(null)}
          students={students.data ?? []}
          studentsLoading={students.isLoading}
          classes={classes}
          academicYears={years.data ?? []}
          terms={terms.data ?? []}
          referenceLoading={referenceLoading}
        />
      )}
    </div>
  );
}
