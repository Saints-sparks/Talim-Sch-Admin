"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddStudentModal from "@/components/AddStudentModal";
import StudentsSkeleton from "@/components/StudentsSkeleton";
import { EmptyState } from "@/components/StateComponents";
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
import type { Student } from "@/app/services/student.service";

/**
 * How many students to pull in one request while a search term or status
 * filter is active. The roster API has no `search` parameter, so a filter is
 * applied client-side; scanning a wide page makes it behave like a school-wide
 * search instead of only matching the page on screen. 500 is the API's cap.
 */
const FILTER_SCAN_LIMIT = 500;

/** True when `student` matches the search text across their name, contact and ID. */
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
    <div className="min-h-screen p-4 sm:p-6 flex flex-col">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-2"
        data-guide="students-header"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-[19px] font-semibold leading-[120%] flex items-center gap-3 text-gray-900 dark:text-white">
            My Students
            <span className="bg-white dark:bg-slate-800 border border-[#E4E4E4] dark:border-slate-700 leading-[120%] text-[15px] font-semibold px-3 py-1 rounded-xl">
              {(rosterQuery.data?.meta?.total ?? 0).toLocaleString()} Students
            </span>
          </h1>
        </div>
        <PermissionGate permission={Permission.MANAGE_STUDENTS}>
          <Tooltip
            content="Enrol a new student and assign them to a class. An account will be created for them."
            side="top"
          >
            <button
              data-guide="students-add"
              onClick={toggleModal}
              className="mt-4 sm:mt-0 bg-[#003366] leading-[120%] hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold text-[15px] flex items-center gap-2"
            >
              <span className="text-lg font-bold">+</span> Add Student
            </button>
          </Tooltip>
        </PermissionGate>
      </div>

      <div className="mb-6">
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
      </div>

      {isModalOpen && (
        <AddStudentModal onClose={toggleModal} onSuccess={() => rosterQuery.refetch()} />
      )}

      <div className="flex-1" data-guide="students-list">
        {rosterQuery.isPending ? (
          <StudentsSkeleton />
        ) : rosterQuery.isError ? (
          <RosterErrorState
            error={rosterQuery.error}
            resource="students"
            onRetry={() => rosterQuery.refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="👩‍🎓"
            title={controls.hasAnyFilter ? "No Students Match" : "No Students Yet"}
            message={
              controls.hasAnyFilter
                ? "No students match your current search or filters."
                : "There are no students yet."
            }
            actionText={controls.hasAnyFilter ? "Clear Filters" : "Add Student"}
            onAction={controls.hasAnyFilter ? controls.reset : toggleModal}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
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
