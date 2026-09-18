"use client";

interface TablePagerProps {
  /** Current page, 1-based. */
  page: number;
  /** Rows per page requested from the server. */
  pageSize: number;
  /** Total rows the server reports. */
  total: number;
  /** True while the next page is loading, so the buttons can't be double-clicked. */
  busy?: boolean;
  onChange: (page: number) => void;
}

/**
 * Server-side pager shared by every finance and payments table.
 *
 * Renders nothing when everything fits on one page, and clamps the page so a
 * filter change that shrinks the result set can't strand the user on page 4 of
 * 1 with an empty table.
 *
 * @param props - Current page, page size, total rows and the change handler.
 * @returns The pager, or null when there is only one page.
 */
export function TablePager({ page, pageSize, total, busy = false, onChange }: TablePagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const current = Math.min(page, pages);

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        disabled={current <= 1 || busy}
        onClick={() => onChange(current - 1)}
        className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500 dark:text-slate-400">
        Page {current} of {pages}
      </span>
      <button
        type="button"
        disabled={current >= pages || busy}
        onClick={() => onChange(current + 1)}
        className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
