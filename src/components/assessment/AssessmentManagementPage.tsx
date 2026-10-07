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
import { FiClipboard, FiPlus } from "react-icons/fi";
import { Page, PageHeader } from "@/components/tl/Page";
import { EmptyNote, ScreenError } from "@/components/tl/states";
import { cardFrame, primaryButton } from "@/components/tl/styles";
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
import { AssessmentHasGradesError, type GradedCourseInfo } from "@/app/services/assessment.service";
import type {
  Assessment,
  AssessmentForm,
  Term,
} from "@/components/assessment/AssessmentForm.types";
import {
  toCreateAssessmentPayload,
  toUpdateAssessmentPayload,
} from "@/components/assessment/assessment.form";
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
   * Saves the form. Rethrows what the save threw, so the modal keeps the
   * draft on screen and can show the failure beside the form, or beside the
   * max score when the API refuses to change it (409 once scores are
   * published).
   */
  const handleSubmit = async (form: AssessmentForm) => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing._id,
          payload: toUpdateAssessmentPayload(form, editing),
        });
        toast.success("Assessment updated successfully!");
      } else {
        await create.mutateAsync(toCreateAssessmentPayload(form));
        toast.success("Assessment created successfully!");
      }
      closeForm();
    } catch (error) {
      logger.error("assessments", `Failed to ${editing ? "update" : "create"} assessment`, error);
      throw error;
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
    <Page guide="assessments">
      <div data-guide="assessments-header">
        <PageHeader
          eyebrowText="Academics"
          title="Assessment Management"
          subtitle="Create, manage and track student assessments"
          actions={
            <PermissionGate permission={Permission.MANAGE_ASSESSMENTS}>
              <Tooltip content="Set up an exam, test, or project for the selected term." side="top">
                <button
                  data-guide="assessments-create"
                  onClick={openCreate}
                  className={primaryButton}
                >
                  <FiPlus className="h-4 w-4" aria-hidden />
                  Create Assessment
                </button>
              </Tooltip>
            </PermissionGate>
          }
        />
      </div>

      <AssessmentStatCards
        assessments={assessments}
        isLoading={assessmentsQuery.isFetching && assessments.length === 0}
      />

      {assessmentsQuery.isError && (
        <ScreenError
          title="Something went wrong"
          message={getErrorMessage(
            assessmentsQuery.error,
            "Failed to load assessments. Please try again."
          )}
          onRetry={() => void assessmentsQuery.refetch()}
          retrying={assessmentsQuery.isFetching}
          retryLabel="Try Again"
        />
      )}

      {!assessmentsQuery.isError && assessments.length === 0 ? (
        <div className={cardFrame} data-guide="assessments-list">
          <EmptyNote
            icon={<FiClipboard />}
            title="No assessments created yet"
            action={
              <PermissionGate permission={Permission.MANAGE_ASSESSMENTS}>
                <button onClick={openCreate} className={primaryButton}>
                  <FiPlus className="h-4 w-4" aria-hidden />
                  Create Your First Assessment
                </button>
              </PermissionGate>
            }
          >
            {canManage
              ? "Get started by creating your first assessment to evaluate student performance and track academic progress."
              : "Assessments created for this school will appear here."}
          </EmptyNote>
        </div>
      ) : (
        !assessmentsQuery.isError && (
          <div className={cardFrame} data-guide="assessments-list">
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
    </Page>
  );
};

export default AssessmentManagementPage;
