"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { rowButton } from "@/components/tl";

interface TablePaginationProps {
  /** Current page, 1-based. */
  page: number;
  /** Rows per page, as sent to the API. */
  pageSize: number;
  /** Total matching rows the API reported. */
  total: number;
  /** Called with the page to show. */
  onPageChange: (page: number) => void;
  /** True while the next page is being fetched. */
  busy?: boolean;
}

/**
 * Server-side pager for the fees tables, along the bottom of the table card.
 * Hidden when everything fits on one page, so short lists look exactly as
 * they did.
 *
 * @param props - Current page, page size and the total row count.
 * @param props.page - Current page.
 * @param props.pageSize - Rows per page.
 * @param props.total - Total rows.
 * @param props.onPageChange - Page change handler.
 * @param props.busy - Whether a page is being fetched.
 * @returns The pager, or null when there is only one page.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  busy = false,
}: TablePaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0 || lastPage === 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tl-line-soft px-5 py-3">
      <span className="text-[13px] text-tl-muted">
        Showing {first}–{last} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || busy}
          onClick={() => onPageChange(page - 1)}
          className={rowButton}
        >
          <FiChevronLeft size={14} aria-hidden /> Previous
        </button>
        <span className="text-[13px] text-tl-muted">
          Page {page} of {lastPage}
        </span>
        <button
          type="button"
          disabled={page >= lastPage || busy}
          onClick={() => onPageChange(page + 1)}
          className={rowButton}
        >
          Next <FiChevronRight size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
