"use client";

/**
 * Pager for the server-paged assessment list.
 */
import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/** How many numbered buttons the pager shows at once. */
const WINDOW = 5;

/** One page of the list, as the API describes it. */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

/**
 * The page numbers to show, centred on the current page where it can be.
 *
 * @param currentPage - The page being viewed.
 * @param totalPages - How many pages there are.
 * @returns At most {@link WINDOW} page numbers, in order.
 */
export function pageWindow(currentPage: number, totalPages: number): number[] {
  const size = Math.min(totalPages, WINDOW);
  if (size <= 0) return [];

  let first = currentPage - Math.floor(size / 2);
  first = Math.max(1, Math.min(first, totalPages - size + 1));
  return Array.from({ length: size }, (_, index) => first + index);
}

interface AssessmentPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

/**
 * Renders the pager, or nothing when there is only one page.
 *
 * @param props - See {@link AssessmentPaginationProps}.
 * @returns The pager.
 */
export function AssessmentPagination({ pagination, onPageChange }: AssessmentPaginationProps) {
  const { currentPage, totalPages, totalCount, limit } = pagination;
  if (totalPages <= 1) return null;

  const first = (currentPage - 1) * limit + 1;
  const last = Math.min(currentPage * limit, totalCount);

  const buttonClass =
    "inline-flex items-center px-3 py-2 border border-tl-control bg-tl-surface text-sm font-medium text-tl-muted rounded-lg hover:bg-tl-bg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <nav
      aria-label="Assessment pages"
      className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-tl-subtle border-t border-tl-line"
    >
      <p className="text-sm text-tl-muted">
        Showing <span className="font-medium">{first}</span> to{" "}
        <span className="font-medium">{last}</span> of{" "}
        <span className="font-medium">{totalCount}</span> assessments
      </p>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={buttonClass}
        >
          <FiChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>

        <div className="flex space-x-1">
          {pageWindow(currentPage, totalPages).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                page === currentPage
                  ? "bg-tl-brand-fill text-white shadow-lg"
                  : "bg-tl-surface text-tl-muted hover:bg-tl-bg border border-tl-control"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={buttonClass}
        >
          Next
          <FiChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </nav>
  );
}
