"use client";

/**
 * Class management — every class in the school as a card grid, with the
 * create-class modal.
 *
 * The list is shared reference data (`useClasses`), so arriving here from
 * another screen costs no request and creating a class invalidates the same
 * cache every other dropdown in the app reads.
 */
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiChevronRight, FiGrid, FiPlus } from "react-icons/fi";
import { Tooltip } from "@/components/ui/Tooltip";
import ClassesSkeleton from "@/components/ClassesSkeleton";
import { ErrorState, EmptyState } from "@/components/StateComponents";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassFormModal } from "@/components/classes/ClassFormModal";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useClasses } from "@/hooks/queries/reference";
import { usePermissions } from "@/hooks/usePermissions";
import { getErrorMessage } from "@/lib/apiError";
import { Permission } from "@/lib/permissions";
import type { ClassDetail } from "@/components/classes/class.model";

/** Cards per page in the grid. */
const CARDS_PER_PAGE = 8;

/**
 * The class list route.
 *
 * @returns The page.
 */
export default function ClassesPage() {
  const router = useRouter();
  const classesQuery = useClasses();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_CLASSES);

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // The reference hook is typed for the list route; the grid reads the extra
  // populated fields (students, courses) the same route returns.
  const classes = useMemo(
    () => (classesQuery.data ?? []) as unknown as ClassDetail[],
    [classesQuery.data],
  );

  const totalPages = Math.max(1, Math.ceil(classes.length / CARDS_PER_PAGE));
  // Deleting or filtering can leave the page number past the end; clamp rather
  // than showing an empty grid.
  const page = Math.min(currentPage, totalPages);
  const displayedClasses = useMemo(
    () => classes.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE),
    [classes, page],
  );

  if (classesQuery.isLoading && classes.length === 0) return <ClassesSkeleton />;

  return (
    <>
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div
          data-guide="classes-header"
          className="flex-shrink-0 m-6 rounded-2xl"
          style={{ background: "linear-gradient(to right, #003366, #004488)" }}
        >
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FiGrid className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Class Management</h1>
                  <p className="text-blue-100 mt-1">Manage and organize your classes</p>
                </div>
              </div>

              <PermissionGate permission={Permission.MANAGE_CLASSES}>
                <Tooltip
                  content="Create a new class. You can assign students, teachers, and courses to it afterwards."
                  side="top"
                >
                  <button
                    data-guide="classes-create"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-white text-[#003366] hover:opacity-90 transition-all duration-300 shadow-lg"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Add Class
                  </button>
                </Tooltip>
              </PermissionGate>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="px-6 pb-6" data-guide="classes-overview">
              {classesQuery.isError ? (
                <ErrorState
                  title="Error Loading Classes"
                  message={getErrorMessage(
                    classesQuery.error,
                    "Failed to load classes. Please try again later.",
                  )}
                  onRetry={() => classesQuery.refetch()}
                />
              ) : classes.length === 0 ? (
                <div data-guide="classes-list">
                  <EmptyState
                    icon="🏫"
                    title="No Classes Found"
                    message={
                      canManage
                        ? "Get started by creating your first class to organize your students."
                        : "No classes have been created for this school yet."
                    }
                    actionText={canManage ? "Create Your First Class" : undefined}
                    onAction={canManage ? () => setIsModalOpen(true) : undefined}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div
                    data-guide="classes-list"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {displayedClasses.map((classItem) => (
                      <ClassCard
                        key={classItem._id}
                        classItem={classItem}
                        onOpen={(id) => router.push(`/classes/${id}`)}
                        onEdit={(id) => router.push(`/classes/edit-class/${id}`)}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-6">
                      <button
                        onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-2 border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <FiChevronLeft className="w-5 h-5" />
                        Previous
                      </button>

                      <div
                        className="px-6 py-3 text-white font-semibold rounded-xl shadow-lg"
                        style={{ background: "linear-gradient(to right, #003366, #004488)" }}
                      >
                        Page {page} of {totalPages}
                      </div>

                      <button
                        onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-2 border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Next
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ClassFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
