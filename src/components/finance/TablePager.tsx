"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { rowButton } from "@/components/tl";

/** Props for {@link TablePager}. */
interface TablePagerProps {
  /** Current page, 1-based. */
  page: number;
  /** Rows per page requested from the server. */
  pageSize: number;
  /** Total rows the server reports. */
  total: number;
  /** True while the next page is loading, so the buttons can't be double-clicked. */
  busy?: boolean;
  /** Called with the page to show. */
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
 * @param props.page - Current page.
 * @param props.pageSize - Rows per page.
 * @param props.total - Total rows.
 * @param props.busy - Whether a page is loading.
 * @param props.onChange - Page change handler.
 * @returns The pager, or null when there is only one page.
 */
export function TablePager({ page, pageSize, total, busy = false, onChange }: TablePagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const current = Math.min(page, pages);

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={current <= 1 || busy}
        onClick={() => onChange(current - 1)}
        className={rowButton}
      >
        <ChevronLeft size={15} aria-hidden /> Previous
      </button>
      <span className="text-[13px] font-semibold text-tl-muted">
        Page {current} of {pages}
      </span>
      <button
        type="button"
        disabled={current >= pages || busy}
        onClick={() => onChange(current + 1)}
        className={rowButton}
      >
        Next <ChevronRight size={15} aria-hidden />
      </button>
    </div>
  );
}
