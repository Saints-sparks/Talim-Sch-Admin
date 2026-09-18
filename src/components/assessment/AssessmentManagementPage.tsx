"use client";

/**
 * Assessment management — the exam and test windows a school runs inside a
 * term.
 *
 * The list is a cached, server-paged query: changing page is cached, and every
 * write invalidates the list rather than refetching it by hand. Creating,
 * editing and deactivating are gated on `manage:assessments`, which is what
 * the endpoints check.
 */
import React, { useState } from "react";
import { FiAlertTriangle, FiClipboard, FiPlus, FiRefreshCw, FiTarget } from "react-icons/fi";
import AssessmentSkeleton from "@/components/AssessmentSkeleton";
import AssessmentList from "@/components/assessment/AssessmentList";
import AssessmentCreateModal from "@/components/assessment/AssessmentCreateModal";
import { AssessmentGradesConflictModal } from "@/components/assessment/AssessmentGradesConflictModal";
import { AssessmentStatCards } from "@/components/assessment/AssessmentStatCards";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Tooltip } from "@/components/ui/Tooltip";
import { toast } from "@/components/CustomToast";
import { useAssessments, useAssessmentMutations } from "@/hooks/assessments/queries";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AssessmentHasGradesError,
  type GradedCourseInfo,
} from "@/app/services/assessment.service";
import type { Assessment, AssessmentForm, Term } from "@/components/assessment/AssessmentForm.types";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";

/** Rows the API is asked for per page. */
const PAGE_SIZE = 10;

interface AssessmentManagementPageProps {
  terms: Term[];
}

/**
 * Renders the assessments screen.
 *
 * @param props - The terms an assessment can belong to.
 * @returns The screen.
 */
const AssessmentManagementPage: React.FC<AssessmentManagementPageProps> = ({ terms }) => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_ASSESSMENTS);

  const [page, setPage] = useState(1);
  const assessmentsQuery = useAssessments(page, PAGE_SIZE);
  const { create, update, deactivate } = useAssessmentMutations();

  const [editing, setEditing] = useState<Assessment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<Assessment | null>(null);
  const [gradesConflict, setGradesConflict] = useState<{
    name: string;
    courses: GradedCourseInfo[];
  } | null>(null);

  const assessments = assessmentsQuery.data?.assessments ?? [];
  const apiPagination = assessmentsQuery.data?.pagination;
  const pagination = {
    currentPage: apiPagination?.currentPage ?? page,
    totalPages: apiPagination?.totalPages ?? 1,
    totalCount: apiPagination?.totalItems ?? assessments.length,
    limit: apiPagination?.itemsPerPage ?? PAGE_SIZE,
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  /**
   * Saves the form. Throws so the modal keeps the draft on screen and can show
   * the failure next to the fields.
   */
  const handleSubmit = async (form: AssessmentForm) => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing._id,
          payload: {
            name: form.name,
            description: form.description,
            startDate: form.startDate,
            endDate: form.endDate,
            status: form.status,
          },
        });
        toast.success("Assessment updated successfully!");
      } else {
        await create.mutateAsync({
          name: form.name,
          description: form.description,
          termId: form.termId,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status ?? "pending",
        });
        toast.success("Assessment created successfully!");
      }
      closeForm();
    } catch (error) {
      logger.error("assessments", `Failed to ${editing ? "update" : "create"} assessment`, error);
      throw new Error(
        getErrorMessage(
          error,
          editing ? "Failed to update assessment." : "Failed to create assessment.",
        ),
      );
    }
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    const name = toDeactivate.name;

    try {
      await deactivate.mutateAsync(toDeactivate._id);
      setToDeactivate(null);
      toast.success(`"${name}" has been deactivated.`);
    } catch (error) {
      setToDeactivate(null);

      // A CONFLICT here is not a failure to report as one: it lists the
      // courses whose grades block the change.
      if (error instanceof AssessmentHasGradesError) {
        setGradesConflict({ name, courses: error.coursesWithGrades });
        return;
      }

      logger.error("assessments", "Failed to deactivate assessment", error);
      toast.error(getErrorMessage(error, "Failed to deactivate assessment."));
    }
  };

  if (assessmentsQuery.isLoading && assessments.length === 0) return <AssessmentSkeleton />;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
      <div
        className="flex-shrink-0 bg-[#003366] m-6 rounded-2xl"
        data-guide="assessments-header"
      >
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FiTarget className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Assessment Management</h1>
                <p className="text-blue-100 mt-1">Create, manage and track student assessments</p>
              </div>
            </div>

            <PermissionGate permission={Permission.MANAGE_ASSESSMENTS}>
              <Tooltip content="Set up an exam, test, or project for the selected term." side="top">
                <button
                  data-guide="assessments-create"
                  onClick={openCreate}
                  className="inline-flex items-center px-6 py-2.5 bg-white text-[#003366] text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg"
                >
                  <FiPlus className="h-4 w-4 mr-2" />
                  Create Assessment
                </button>
              </Tooltip>
            </PermissionGate>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="px-6 pb-6">
            <AssessmentStatCards
              assessments={assessments}
              isLoading={assessmentsQuery.isFetching && assessments.length === 0}
            />

            {assessmentsQuery.isError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex items-start">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-xl flex-shrink-0">
                    <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Something went wrong
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mb-4">
                      {getErrorMessage(
                        assessmentsQuery.error,
                        "Failed to load assessments. Please try again.",
                      )}
                    </p>
                    <button
                      onClick={() => assessmentsQuery.refetch()}
                      disabled={assessmentsQuery.isFetching}
                      className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
                    >
                      <FiRefreshCw
                        className={`h-4 w-4 mr-2 ${assessmentsQuery.isFetching ? "animate-spin" : ""}`}
                      />
                      {assessmentsQuery.isFetching ? "Retrying..." : "Try Again"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!assessmentsQuery.isError && assessments.length === 0 ? (
              <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-16 text-center"
                data-guide="assessments-list"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <FiClipboard className="h-12 w-12 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                  No assessments created yet
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-10 max-w-md mx-auto text-lg">
                  {canManage
                    ? "Get started by creating your first assessment to evaluate student performance and track academic progress."
                    : "Assessments created for this school will appear here."}
                </p>
                <PermissionGate permission={Permission.MANAGE_ASSESSMENTS}>
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl"
                  >
                    <FiPlus className="h-5 w-5 mr-3" />
                    Create Your First Assessment
                  </button>
                </PermissionGate>
              </div>
            ) : (
              !assessmentsQuery.isError && (
                <div
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden"
                  data-guide="assessments-list"
                >
                  <AssessmentList
                    assessments={assessments}
                    terms={terms}
                    loading={assessmentsQuery.isFetching}
                    canManage={canManage}
                    pagination={pagination}
                    onPageChange={setPage}
                    onEdit={(assessment) => {
                      setEditing(assessment);
                      setIsFormOpen(true);
                    }}
                    onDelete={setToDeactivate}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <AssessmentCreateModal
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        terms={terms}
        editingAssessment={editing}
        loading={create.isPending || update.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(toDeactivate)}
        title="Deactivate Assessment"
        message={`Are you sure you want to deactivate "${toDeactivate?.name}"? It will be hidden from teachers and no longer available for grading.`}
        confirmLabel="Deactivate Assessment"
        pendingLabel="Deactivating..."
        isPending={deactivate.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setToDeactivate(null)}
      />

      <AssessmentGradesConflictModal
        isOpen={Boolean(gradesConflict)}
        assessmentName={gradesConflict?.name ?? ""}
        courses={gradesConflict?.courses ?? []}
        onClose={() => setGradesConflict(null)}
      />
    </div>
  );
};

export default AssessmentManagementPage;
