"use client";

/**
 * Assessments route.
 *
 * The terms an assessment belongs to are shared reference data, so they come
 * from `useTerms()` rather than being fetched on mount — arriving here from
 * the timetable or the results screens costs no request.
 */
import React from "react";
import AssessmentManagementPage from "@/components/assessment/AssessmentManagementPage";
import AssessmentSkeleton from "@/components/AssessmentSkeleton";
import { ErrorState } from "@/components/StateComponents";
import { useTerms } from "@/hooks/queries/reference";
import { getErrorMessage } from "@/lib/apiError";

/**
 * Renders the assessments screen once the terms are known.
 *
 * @returns The page.
 */
export default function AssessmentsPage() {
  const termsQuery = useTerms();

  if (termsQuery.isLoading && !termsQuery.data) return <AssessmentSkeleton />;

  // Without the terms the create form has nothing to attach an assessment to,
  // so a failure here is the page's failure, not a silent empty dropdown.
  if (termsQuery.isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-md mx-auto mt-24">
          <ErrorState
            title="Could not load terms"
            message={getErrorMessage(
              termsQuery.error,
              "Assessments belong to a term, and the term list could not be loaded.",
            )}
            onRetry={() => termsQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <AssessmentManagementPage terms={termsQuery.data ?? []} />
    </div>
  );
}
