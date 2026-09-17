"use client";

import React from "react";
import { motion } from "framer-motion";

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

/** The window of numbered buttons around the current page (max five). */
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

const arrowClass =
  "w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center";

/**
 * Server-side pagination controls shared by the people rosters.
 *
 * The counts come from the API's `meta`, so "showing x to y of z" is the real
 * total rather than the length of the page in memory.
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
    <div className="mt-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-center px-8 py-6 gap-6">
          <div className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl">
            Showing <span className="font-semibold text-blue-600 dark:text-blue-400">{start}</span> to{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{end}</span> of{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{total}</span> {itemLabel}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
              <span className="font-medium">Show:</span>
              <select
                className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 border-2 border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
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

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={arrowClass}
                disabled={safePage === 1}
                onClick={() => onPageChange(Math.max(safePage - 1, 1))}
                aria-label="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>

              <div className="flex items-center gap-1">
                {pageWindow(safePage, totalPages).map((pageNum) => (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPageChange(pageNum)}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={safePage === pageNum ? "page" : undefined}
                    className={`w-10 h-10 text-sm rounded-xl font-medium transition-all flex items-center justify-center ${
                      safePage === pageNum
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={arrowClass}
                disabled={safePage >= totalPages}
                onClick={() => onPageChange(Math.min(safePage + 1, totalPages))}
                aria-label="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RosterPagination;
