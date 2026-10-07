"use client";

/**
 * Class management — every class in the school as a grid of class cards, with
 * the create-class sheet.
 *
 * The list is shared reference data (`useClasses`), so arriving here from
 * another screen costs no request and creating a class invalidates the same
 * cache every other dropdown in the app reads.
 */
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, School } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import ClassesSkeleton from "@/components/ClassesSkeleton";
import { ErrorState } from "@/components/StateComponents";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassFormModal } from "@/components/classes/ClassFormModal";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { EmptyNote, Page, PageHeader, card, ghostButton, primaryButton } from "@/components/tl";
import { useClasses } from "@/hooks/queries/reference";
import { usePermissions } from "@/hooks/usePermissions";
import { getErrorMessage } from "@/lib/apiError";
import { Permission } from "@/lib/permissions";
import type { ClassDetail } from "@/components/classes/class.model";

/** Cards per page in the grid. */
const CARDS_PER_PAGE = 8;

/**
 * The class list route: the heading with "Add Class", the class cards and the
 * pager, or the loading, error and empty states.
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
    [classesQuery.data]
  );

  const totalPages = Math.max(1, Math.ceil(classes.length / CARDS_PER_PAGE));
  // Deleting or filtering can leave the page number past the end; clamp rather
  // than showing an empty grid.
  const page = Math.min(currentPage, totalPages);
  const displayedClasses = useMemo(
    () => classes.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE),
    [classes, page]
  );

  if (classesQuery.isLoading && classes.length === 0) return <ClassesSkeleton />;

  return (
    <>
      <Page>
        <PageHeader
          guide="classes-header"
          title="Class Management"
          subtitle="Manage and organize your classes"
          actions={
            <PermissionGate permission={Permission.MANAGE_CLASSES}>
              <Tooltip
                content="Create a new class. You can assign students, teachers, and courses to it afterwards."
                side="top"
              >
                <button
                  type="button"
                  data-guide="classes-create"
                  onClick={() => setIsModalOpen(true)}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add Class
                </button>
              </Tooltip>
            </PermissionGate>
          }
        />

        <div data-guide="classes-overview">
          {classesQuery.isError ? (
            <ErrorState
              title="Error Loading Classes"
              message={getErrorMessage(
                classesQuery.error,
                "Failed to load classes. Please try again later."
              )}
              onRetry={() => classesQuery.refetch()}
            />
          ) : classes.length === 0 ? (
            <div data-guide="classes-list" className={card}>
              <EmptyNote
                icon={<School />}
                title="No Classes Found"
                action={
                  canManage ? (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className={primaryButton}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Create Your First Class
                    </button>
                  ) : undefined
                }
              >
                {canManage
                  ? "Get started by creating your first class to organize your students."
                  : "No classes have been created for this school yet."}
              </EmptyNote>
            </div>
          ) : (
            <div className="flex flex-col gap-[18px]">
              <div
                data-guide="classes-list"
                className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]"
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
                <nav
                  aria-label="Class pages"
                  className="flex flex-wrap items-center justify-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                    disabled={page === 1}
                    className={ghostButton}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </button>
                  <span className="px-2 text-sm font-bold text-tl-muted" aria-live="polite">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                    disabled={page === totalPages}
                    className={ghostButton}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </Page>

      <ClassFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
