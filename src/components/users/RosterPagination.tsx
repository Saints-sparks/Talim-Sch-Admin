"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { card, focusRing, selectControl } from "@/components/tl";

/** Props for {@link RosterPagination}. */
interface RosterPaginationProps {
  /** 1-based current page. */
  page: number;
  /** Rows per page. */
  pageSize: number;
  /** Total rows the server reports, across all pages. */
  total: number;
  /** Page sizes offered in the "Show" select. */
  pageSizeOptions?: number[];
  /** Plural noun for the counter, e.g. "students". */
  itemLabel: string;
  /** Called with the new 1-based page. */
  onPageChange: (page: number) => void;
  /** Called with the new page size. */
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * The window of numbered buttons around the current page (max five).
 *
 * @param page - The current page.
 * @param totalPages - How many pages there are.
 * @returns The page numbers to show.
 */
function pageWindow(page: number, totalPages: number): number[] {
  const count = Math.min(totalPages, 5);
  let first = 1;
  if (totalPages > 5) {
    if (page <= 3) first = 1;
    else if (page >= totalPages - 2) first = totalPages - 4;
    else first = page - 2;
  }
  return Array.from({ length: count }, (_, i) => first + i);
}

/** The previous and next arrows. */
const arrowClass = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tl-control bg-tl-surface text-tl-brand transition-colors hover:bg-tl-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/**
 * Server-side pagination controls shared by the people rosters: the "Showing
 * x to y of z" line, the page-size select and the page buttons, in one card.
 *
 * The counts come from the API's `meta`, so "showing x to y of z" is the real
 * total rather than the length of the page in memory.
 *
 * @param props - See {@link RosterPaginationProps}.
 * @param props.page - Current page.
 * @param props.pageSize - Rows per page.
 * @param props.total - Total rows.
 * @param props.pageSizeOptions - Page sizes offered.
 * @param props.itemLabel - Plural noun for the counter.
 * @param props.onPageChange - Page handler.
 * @param props.onPageSizeChange - Page-size handler.
 * @returns The pagination bar.
 */
export function RosterPagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [9, 18, 27, 45],
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: RosterPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <nav
      aria-label={`${itemLabel} pages`}
      className={`${card} flex flex-wrap items-center justify-between gap-4 !py-3.5`}
    >
      <p className="text-sm text-tl-muted">
        Showing <span className="font-bold text-tl-ink">{start}</span> to{" "}
        <span className="font-bold text-tl-ink">{end}</span> of{" "}
        <span className="font-bold text-tl-ink">{total}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-tl-muted">
          <span>Show:</span>
          <select
            className={selectControl}
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={arrowClass}
            disabled={safePage === 1}
            onClick={() => onPageChange(Math.max(safePage - 1, 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          {pageWindow(safePage, totalPages).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={safePage === pageNum ? "page" : undefined}
              className={`flex h-11 min-w-[44px] items-center justify-center rounded-xl px-2 text-sm font-bold transition-colors ${focusRing} ${
                safePage === pageNum
                  ? "bg-tl-brand-fill text-tl-on-brand"
                  : "text-tl-muted hover:bg-tl-bg hover:text-tl-ink"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            className={arrowClass}
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(Math.min(safePage + 1, totalPages))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default RosterPagination;
