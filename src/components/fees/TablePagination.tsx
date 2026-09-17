"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { mutedTextClass, secondaryButtonClass } from "./ui";

interface TablePaginationProps {
  /** Current page, 1-based. */
  page: number;
  /** Rows per page, as sent to the API. */
  pageSize: number;
  /** Total matching rows the API reported. */
  total: number;
  onPageChange: (page: number) => void;
  /** True while the next page is being fetched. */
  busy?: boolean;
}

/**
 * Server-side pager for the fees tables. Hidden when everything fits on one
 * page, so short lists look exactly as they did.
 *
 * @param props - Current page, page size and the total row count.
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
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-50 dark:border-gray-800">
      <span className={`text-xs ${mutedTextClass}`}>
        Showing {first}–{last} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || busy}
          onClick={() => onPageChange(page - 1)}
          className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 ${secondaryButtonClass}`}
        >
          <FiChevronLeft size={12} /> Previous
        </button>
        <span className={`text-xs ${mutedTextClass}`}>
          Page {page} of {lastPage}
        </span>
        <button
          type="button"
          disabled={page >= lastPage || busy}
          onClick={() => onPageChange(page + 1)}
          className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 ${secondaryButtonClass}`}
        >
          Next <FiChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
