"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Plus } from "lucide-react";
import AddStudentModal from "@/components/AddStudentModal";
import StudentsSkeleton from "@/components/StudentsSkeleton";
import { PermissionGate, RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { Tooltip } from "@/components/ui/Tooltip";
import { useClasses } from "@/hooks/queries/reference";
import { useRosterControls } from "@/hooks/users/useRosterControls";
import { useStudentRoster } from "@/hooks/users/useStudents";
import RosterFilters from "@/components/users/RosterFilters";
import RosterPagination from "@/components/users/RosterPagination";
import RosterErrorState from "@/components/users/RosterErrorState";
import StudentRosterCard from "@/components/users/StudentRosterCard";
import { rosterGrid } from "@/components/users/parts";
import { EmptyNote, Page, PageHeader, Pill, card, primaryButton } from "@/components/tl";
import type { Student } from "@/app/services/student.service";

/**
 * How many students to pull in one request while a search term or status
 * filter is active. The roster API has no `search` parameter, so a filter is
 * applied client-side; scanning a wide page makes it behave like a school-wide
 * search instead of only matching the page on screen. 500 is the API's cap.
 */
const FILTER_SCAN_LIMIT = 500;

/**
 * True when `student` matches the search text across their name, contact and ID.
 *
 * @param student - The roster row.
 * @param search - The lower-cased search text.
 * @returns Whether it matches.
 */
function matchesSearch(student: Student, search: string): boolean {
  if (!search) return true;
  return [
    student.userId.firstName,
    student.userId.lastName,
    student.userId.email,
    student.userId.phoneNumber,
    student.admissionNumber,
  ]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

/**
 * The student roster: heading with the count and Add Student, the search and
 * filter toolbar, the grid of student cards and the pagination.
 *
 * @returns The roster.
 */
function StudentsRoster() {
  const router = useRouter();
  const controls = useRosterControls(12);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const classesQuery = useClasses();
  const rosterQuery = useStudentRoster({
    page: controls.isFiltering ? 1 : controls.page,
    limit: controls.isFiltering ? FILTER_SCAN_LIMIT : controls.pageSize,
    classId: controls.classId,
  });

  const rows = useMemo(() => rosterQuery.data?.data ?? [], [rosterQuery.data]);

  const { visible, total } = useMemo(() => {
    if (!controls.isFiltering) {
      return { visible: rows, total: rosterQuery.data?.meta?.total ?? rows.length };
    }
    const search = controls.debouncedSearch.trim().toLowerCase();
    const filtered = rows.filter(
      (student) =>
        matchesSearch(student, search) &&
        (controls.status === "" ||
          (controls.status === "active" ? student.isActive : !student.isActive)),
    );
    const start = (controls.page - 1) * controls.pageSize;
    return { visible: filtered.slice(start, start + controls.pageSize), total: filtered.length };
  }, [
    rows,
    rosterQuery.data,
    controls.isFiltering,
    controls.debouncedSearch,
    controls.status,
    controls.page,
    controls.pageSize,
  ]);

  const toggleModal = () => setIsModalOpen((open) => !open);
  const viewProfile = (studentId: string) => router.push(`/users/students/${studentId}/view`);

  return (
    <Page>
      <PageHeader
        guide="students-header"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            My Students
            <Pill tone="muted" className="text-[13px]">
              {(rosterQuery.data?.meta?.total ?? 0).toLocaleString()} Students
            </Pill>
          </span>
        }
        actions={
          <PermissionGate permission={Permission.MANAGE_STUDENTS}>
            <Tooltip
              content="Enrol a new student and assign them to a class. An account will be created for them."
              side="top"
            >
              <button
                type="button"
                data-guide="students-add"
                onClick={toggleModal}
                className={primaryButton}
              >
                <Plus className="h-4 w-4" aria-hidden /> Add Student
              </button>
            </Tooltip>
          </PermissionGate>
        }
      />

      <RosterFilters
        dataGuide="students-filters"
        search={controls.search}
        onSearchChange={controls.setSearch}
        classes={classesQuery.data ?? []}
        selectedClass={controls.classId}
        onClassChange={controls.setClassId}
        classTooltip="Show only students in this class."
        status={controls.status}
        onStatusChange={(value) => controls.setStatus(value as typeof controls.status)}
        statusTooltip="Active students are currently enrolled. Inactive students have been deactivated."
      />

      {isModalOpen && (
        <AddStudentModal onClose={toggleModal} onSuccess={() => rosterQuery.refetch()} />
      )}

      <div data-guide="students-list">
        {rosterQuery.isPending ? (
          <StudentsSkeleton />
        ) : rosterQuery.isError ? (
          <RosterErrorState
            error={rosterQuery.error}
            resource="students"
            onRetry={() => rosterQuery.refetch()}
          />
        ) : visible.length === 0 ? (
          <div className={card}>
            <EmptyNote
              icon={<GraduationCap />}
              title={controls.hasAnyFilter ? "No Students Match" : "No Students Yet"}
              action={
                <button
                  type="button"
                  className={primaryButton}
                  onClick={controls.hasAnyFilter ? controls.reset : toggleModal}
                >
                  {controls.hasAnyFilter ? "Clear Filters" : "Add Student"}
                </button>
              }
            >
              {controls.hasAnyFilter
                ? "No students match your current search or filters."
                : "There are no students yet."}
            </EmptyNote>
          </div>
        ) : (
          <div className={rosterGrid}>
            {visible.map((student, index) => (
              <StudentRosterCard
                key={student._id}
                student={student}
                index={index}
                onViewProfile={viewProfile}
              />
            ))}
          </div>
        )}
      </div>

      {!rosterQuery.isError && total > 0 && (
        <RosterPagination
          page={controls.page}
          pageSize={controls.pageSize}
          total={total}
          pageSizeOptions={[12, 24, 36, 48]}
          itemLabel="students"
          onPageChange={controls.setPage}
          onPageSizeChange={controls.setPageSize}
        />
      )}
    </Page>
  );
}

/** `/users/students` — the student roster, behind `manage:students`. */
export default function StudentsPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_STUDENTS}>
      <StudentsRoster />
    </RequirePermission>
  );
}
