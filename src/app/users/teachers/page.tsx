"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddTeacherModal from "@/components/AddTeacherModal";
import TeachersSkeleton from "@/components/TeachersSkeleton";
import { EmptyState } from "@/components/StateComponents";
import { toast } from "@/components/CustomToast";
import { PermissionGate, RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Tooltip } from "@/components/ui/Tooltip";
import { useRosterClasses } from "@/hooks/users/useRosterClasses";
import { useRosterControls } from "@/hooks/users/useRosterControls";
import { useTeacherRoster, useUpdateTeacherStatus } from "@/hooks/users/useTeachers";
import RosterFilters from "@/components/users/RosterFilters";
import RosterPagination from "@/components/users/RosterPagination";
import RosterErrorState from "@/components/users/RosterErrorState";
import TeacherRosterCard, { teacherFields } from "@/components/users/TeacherRosterCard";
import { teacherUserId, type Teacher } from "@/app/services/teacher.service";

/**
 * How many teachers to pull in one request while a filter is active. The list
 * endpoint has no search, class or status parameter, so those are applied
 * client-side; scanning a wide page keeps them school-wide instead of matching
 * only the page on screen. 500 is the API's cap.
 */
const FILTER_SCAN_LIMIT = 500;

/** True when `teacher` matches the search text across their name, contact and staff number. */
function matchesSearch(teacher: Teacher, search: string): boolean {
  if (!search) return true;
  const user = typeof teacher.userId === "object" ? teacher.userId : null;
  return [
    user?.firstName || teacher.firstName,
    user?.lastName || teacher.lastName,
    user?.email || teacher.email,
    user?.phoneNumber || teacher.phoneNumber,
    teacher.staffNumber,
  ]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

function TeachersRoster() {
  const router = useRouter();
  const controls = useRosterControls(9);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { classes } = useRosterClasses();
  const rosterQuery = useTeacherRoster({
    page: controls.hasAnyFilter ? 1 : controls.page,
    limit: controls.hasAnyFilter ? FILTER_SCAN_LIMIT : controls.pageSize,
  });
  const updateStatus = useUpdateTeacherStatus();

  const rows = useMemo(() => rosterQuery.data?.data ?? [], [rosterQuery.data]);

  const { visible, total } = useMemo(() => {
    if (!controls.hasAnyFilter) {
      return { visible: rows, total: rosterQuery.data?.meta?.total ?? rows.length };
    }
    const search = controls.debouncedSearch.trim().toLowerCase();
    const filtered = rows.filter((teacher) => {
      const classMatch =
        !controls.classId || (teacher.assignedClasses ?? []).some((cls) => cls._id === controls.classId);
      const statusMatch =
        controls.status === "" || (controls.status === "active" ? teacher.isActive : !teacher.isActive);
      return matchesSearch(teacher, search) && classMatch && statusMatch;
    });
    const start = (controls.page - 1) * controls.pageSize;
    return { visible: filtered.slice(start, start + controls.pageSize), total: filtered.length };
  }, [
    rows,
    rosterQuery.data,
    controls.hasAnyFilter,
    controls.debouncedSearch,
    controls.classId,
    controls.status,
    controls.page,
    controls.pageSize,
  ]);

  const toggleModal = () => setIsModalOpen((open) => !open);
  const viewProfile = (teacher: Teacher) => router.push(`/users/teachers/${teacherUserId(teacher)}`);
  const editTeacher = (teacher: Teacher) => {
    setMenuOpen(null);
    router.push(`/users/teachers/${teacherUserId(teacher)}/edit`);
  };

  const deactivateTeacher = async (teacher: Teacher) => {
    setMenuOpen(null);
    const { firstName, lastName } = teacherFields(teacher);
    const name = `${firstName} ${lastName}`.trim() || "this teacher";
    if (
      !window.confirm(
        `Deactivate ${name}? They will no longer be able to access the teacher portal.`,
      )
    ) {
      return;
    }

    try {
      await updateStatus.mutateAsync({ userId: teacherUserId(teacher), isActive: false });
      toast.success("Teacher deactivated successfully");
    } catch (error) {
      logger.error("teachers", "Failed to deactivate teacher", error);
      toast.error(getErrorMessage(error, "We couldn't deactivate this teacher. Please try again."));
    }
  };

  return (
    <div className="min-h-screen p-4 leading-[120%] flex flex-col">
      <div className="bg-[#F8F8F8] dark:bg-transparent pt-4 px-2 sm:px-6" data-guide="teachers-header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[19px] font-semibold text-gray-900 dark:text-white">My Teachers</h1>
            <span className="bg-white dark:bg-slate-800 border border-[#E4E4E4] dark:border-slate-700 text-[15px] font-medium px-3 py-1 rounded-full">
              {rosterQuery.data?.meta?.total ?? 0} teachers
            </span>
          </div>
          <PermissionGate permission={Permission.MANAGE_TEACHERS}>
            <Tooltip
              content="Register a teacher account. They will receive an email to set their own password."
              side="top"
            >
              <button
                data-guide="teachers-add"
                onClick={toggleModal}
                className="bg-[#154473] text-white font-medium rounded-lg px-5 py-2 flex items-center gap-2 hover:bg-[#123a5e] transition"
              >
                <span className="text-lg font-bold">+</span> Add Teacher
              </button>
            </Tooltip>
          </PermissionGate>
        </div>

        <div className="mt-4">
          <RosterFilters
            dataGuide="teachers-filters"
            search={controls.search}
            onSearchChange={controls.setSearch}
            classes={classes}
            selectedClass={controls.classId}
            onClassChange={controls.setClassId}
            classTooltip="Show only teachers assigned to this class."
            status={controls.status}
            onStatusChange={(value) => controls.setStatus(value as typeof controls.status)}
            statusTooltip="Inactive teachers keep their records but cannot sign in."
          />
        </div>
      </div>

      {isModalOpen && (
        <AddTeacherModal onClose={toggleModal} onSuccess={async () => { await rosterQuery.refetch(); }} />
      )}

      <div className="flex flex-col flex-1" data-guide="teachers-list">
        {rosterQuery.isPending ? (
          <TeachersSkeleton />
        ) : rosterQuery.isError ? (
          <RosterErrorState
            error={rosterQuery.error}
            resource="teachers"
            onRetry={() => rosterQuery.refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="👨‍🏫"
            title="No Teachers Found"
            message={
              controls.hasAnyFilter
                ? "No teachers match your current search or filter criteria."
                : "Get started by adding your first teacher to the system."
            }
            actionText={controls.hasAnyFilter ? "Clear Filters" : "Add First Teacher"}
            onAction={controls.hasAnyFilter ? controls.reset : toggleModal}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {visible.map((teacher) => (
                <TeacherRosterCard
                  key={teacher._id}
                  teacher={teacher}
                  menuOpen={menuOpen === teacher._id}
                  onToggleMenu={(id) => setMenuOpen((open) => (open === id ? null : id))}
                  onViewProfile={viewProfile}
                  onEdit={editTeacher}
                  onDeactivate={deactivateTeacher}
                />
              ))}
            </div>

            <RosterPagination
              page={controls.page}
              pageSize={controls.pageSize}
              total={total}
              itemLabel="teachers"
              onPageChange={controls.setPage}
              onPageSizeChange={controls.setPageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** `/users/teachers` — the teacher roster, behind `manage:teachers`. */
export default function TeachersPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_TEACHERS}>
      <TeachersRoster />
    </RequirePermission>
  );
}
