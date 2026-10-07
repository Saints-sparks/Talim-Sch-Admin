"use client";

/**
 * The assessment list: a filter bar, a grid of assessment cards and the pager.
 *
 * The page it renders comes from the server; the filters narrow that page
 * client-side. Edit and deactivate are only rendered when the signed-in
 * administrator holds `manage:assessments`.
 */
import React, { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import {
  AssessmentFilters,
  EMPTY_FILTERS,
  filterAssessments,
  hasActiveFilters,
  type AssessmentFilterState,
} from "@/components/assessment/AssessmentFilters";
import {
  AssessmentPagination,
  type PaginationState,
} from "@/components/assessment/AssessmentPagination";
import type {
  Assessment,
  AssessmentStatus,
  Term,
} from "@/components/assessment/AssessmentForm.types";

/** Milliseconds in a day, for the duration label. */
const DAY_MS = 1000 * 60 * 60 * 24;

interface AssessmentListProps {
  assessments: Assessment[];
  terms: Term[];
  loading: boolean;
  /** True when the signed-in administrator may edit and deactivate. */
  canManage: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onEdit: (assessment: Assessment) => void;
  onDelete: (assessment: Assessment) => void;
}

/** The icon beside a status badge. */
function statusIcon(status: AssessmentStatus) {
  if (status === "active") return <FiCheckCircle className="h-4 w-4 text-tl-success" />;
  if (status === "pending") return <FiClock className="h-4 w-4 text-tl-warning" />;
  if (status === "completed") return <FiCheckCircle className="h-4 w-4 text-tl-link" />;
  return <FiAlertCircle className="h-4 w-4 text-tl-muted" />;
}

/** Badge classes per status, in both themes. */
function statusBadge(status: AssessmentStatus): string {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const byStatus: Record<AssessmentStatus, string> = {
    active: "bg-tl-success-bg text-tl-success",
    pending: "bg-tl-warning-bg text-tl-warning",
    completed: "bg-tl-select text-tl-brand",
    cancelled: "bg-tl-danger-bg text-tl-danger",
  };
  return `${base} ${byStatus[status] ?? "bg-tl-track text-tl-ink"}`;
}

/** How long an assessment runs, in whole days. */
function durationLabel(assessment: Assessment): string {
  const days = Math.ceil(
    (new Date(assessment.endDate).getTime() - new Date(assessment.startDate).getTime()) / DAY_MS
  );
  if (!Number.isFinite(days)) return "Unknown";
  return days === 1 ? "1 day" : `${days} days`;
}

/**
 * How an assessment's max score reads on its card.
 *
 * @param maxScore - The assessment's max score.
 * @returns E.g. "out of 100".
 */
export function maxScoreLabel(maxScore: number): string {
  return `out of ${maxScore}`;
}

/**
 * Renders the filter bar, the grid and the pager.
 *
 * @param props - See {@link AssessmentListProps}.
 * @returns The list.
 */
const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  terms,
  loading,
  canManage,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  const [filters, setFilters] = useState<AssessmentFilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => filterAssessments(assessments, filters), [assessments, filters]);
  const isFiltered = hasActiveFilters(filters);

  return (
    <div className="space-y-6 p-6">
      <AssessmentFilters
        filters={filters}
        onChange={setFilters}
        terms={terms}
        isOpen={showFilters}
        onToggle={() => setShowFilters((open) => !open)}
      />

      <div>
        {loading && assessments.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-tl-surface rounded-xl border border-tl-line p-6 animate-pulse h-56"
              >
                <div className="h-5 bg-tl-line rounded w-3/4 mb-3" />
                <div className="h-4 bg-tl-line rounded w-1/2 mb-2" />
                <div className="h-3 bg-tl-line rounded w-1/3 mb-6" />
                <div className="h-3 bg-tl-line rounded w-full mb-2" />
                <div className="h-3 bg-tl-line rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-tl-surface rounded-xl border border-tl-line p-12 text-center">
            <div className="w-20 h-20 bg-tl-track rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCalendar className="h-10 w-10 text-tl-faint" />
            </div>
            <h3 className="text-xl font-semibold text-tl-ink mb-3">
              {isFiltered ? "No assessments match your criteria" : "No assessments found"}
            </h3>
            <p className="text-tl-muted mb-6 max-w-md mx-auto">
              {isFiltered
                ? "Try adjusting your search terms or clearing some filters to see more results."
                : "Create your first assessment to start evaluating student performance and track academic progress."}
            </p>
            {isFiltered && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center px-6 py-3 bg-tl-brand-fill text-white font-medium rounded-lg hover:bg-tl-brand-fill-hover transition-all duration-300"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((assessment) => (
                <div
                  key={assessment._id}
                  className="bg-tl-surface rounded-xl border border-tl-line hover:border-tl-control transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-tl-ink truncate mb-2">
                          {assessment.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-tl-muted mb-2">
                          <FiCalendar className="h-4 w-4 flex-shrink-0" />
                          <span>{new Date(assessment.startDate).toLocaleDateString()}</span>
                          <span>-</span>
                          <span>{new Date(assessment.endDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-tl-muted line-clamp-2">
                          {assessment.description || "No description provided"}
                        </p>
                      </div>
                      <span className={`${statusBadge(assessment.status)} ml-4 flex-shrink-0`}>
                        {statusIcon(assessment.status)}
                        <span className="ml-1 capitalize">{assessment.status}</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-tl-muted">Term:</span>
                        <span className="font-medium text-tl-ink">
                          {assessment.termId?.name ?? "Unknown Term"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-tl-muted">Duration:</span>
                        <span className="font-medium text-tl-ink">{durationLabel(assessment)}</span>
                      </div>

                      {assessment.maxScore !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-tl-muted">Max score:</span>
                          <span className="font-medium text-tl-ink">
                            {maxScoreLabel(assessment.maxScore)}
                          </span>
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex justify-center space-x-2 pt-4 mt-4 border-t border-tl-line-soft">
                        <button
                          onClick={() => onEdit(assessment)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-tl-success bg-tl-success-bg rounded-lg hover:bg-tl-success-bg transition-all duration-300"
                        >
                          <FiEdit className="h-4 w-4 mr-1" />
                          Edit
                        </button>

                        <button
                          onClick={() => onDelete(assessment)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-tl-danger bg-tl-danger-bg rounded-lg hover:bg-tl-danger-bg transition-all duration-300"
                        >
                          <FiTrash2 className="h-4 w-4 mr-1" />
                          Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <AssessmentPagination pagination={pagination} onPageChange={onPageChange} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssessmentList;
