"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UsersRound } from "lucide-react";
import AddTeacherModal from "@/components/AddTeacherModal";
import TeachersSkeleton from "@/components/TeachersSkeleton";
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
import { rosterGrid } from "@/components/users/parts";
import { EmptyNote, Page, PageHeader, Pill, card, primaryButton } from "@/components/tl";

/**
 * How many teachers to pull in one request while a filter is active. The list
 * endpoint has no search, class or status parameter, so those are applied
 * client-side; scanning a wide page keeps them school-wide instead of matching
 * only the page on screen. 500 is the API's cap.
 */
const FILTER_SCAN_LIMIT = 500;

/**
 * True when `teacher` matches the search text across their name, contact and staff number.
 *
 * @param teacher - The roster row.
 * @param search - The lower-cased search text.
 * @returns Whether it matches.
 */
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

/**
 * The teacher roster: heading with the count and Add Teacher, the search and
 * filter toolbar, the grid of teacher cards and the pagination.
 *
 * @returns The roster.
 */
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
    <Page>
      <PageHeader
        guide="teachers-header"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            My Teachers
            <Pill tone="muted" className="text-[13px]">
              {rosterQuery.data?.meta?.total ?? 0} teachers
            </Pill>
          </span>
        }
        actions={
          <PermissionGate permission={Permission.MANAGE_TEACHERS}>
            <Tooltip
              content="Register a teacher account. They will receive an email to set their own password."
              side="top"
            >
              <button
                type="button"
                data-guide="teachers-add"
                onClick={toggleModal}
                className={primaryButton}
              >
                <Plus className="h-4 w-4" aria-hidden /> Add Teacher
              </button>
            </Tooltip>
          </PermissionGate>
        }
      />

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

      {isModalOpen && (
        <AddTeacherModal
          onClose={toggleModal}
          onSuccess={async () => {
            await rosterQuery.refetch();
          }}
        />
      )}

      <div className="flex flex-col gap-[18px]" data-guide="teachers-list">
        {rosterQuery.isPending ? (
          <TeachersSkeleton />
        ) : rosterQuery.isError ? (
          <RosterErrorState
            error={rosterQuery.error}
            resource="teachers"
            onRetry={() => rosterQuery.refetch()}
          />
        ) : visible.length === 0 ? (
          <div className={card}>
            <EmptyNote
              icon={<UsersRound />}
              title="No Teachers Found"
              action={
                <button
                  type="button"
                  className={primaryButton}
                  onClick={controls.hasAnyFilter ? controls.reset : toggleModal}
                >
                  {controls.hasAnyFilter ? "Clear Filters" : "Add First Teacher"}
                </button>
              }
            >
              {controls.hasAnyFilter
                ? "No teachers match your current search or filter criteria."
                : "Get started by adding your first teacher to the system."}
            </EmptyNote>
          </div>
        ) : (
          <>
            <div className={rosterGrid}>
              {visible.map((teacher) => (
                <TeacherRosterCard
                  key={teacher._id}
                  teacher={teacher}
                  menuOpen={menuOpen === teacher._id}
                  onToggleMenu={(id) => setMenuOpen((open) => (open === id ? null : id))}
                  profileHref={`/users/teachers/${teacherUserId(teacher)}`}
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
    </Page>
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
