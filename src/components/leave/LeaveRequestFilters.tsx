"use client";

/**
 * Search box and status tabs above the leave queue.
 *
 * The counts come from the whole queue, not the filtered view, so a tab always
 * says how much work is behind it.
 */
import React from "react";
import { Search } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { LEAVE_FILTERS, type LeaveFilter } from "./leave.presentation";

/** How each tab is labelled and coloured while it is active. */
const TABS: Record<LeaveFilter, { label: string; active: string }> = {
  all: { label: "All", active: "bg-[#154473] text-white" },
  pending: { label: "Pending", active: "bg-amber-600 text-white" },
  approved: { label: "Approved", active: "bg-emerald-700 text-white" },
  rejected: { label: "Rejected", active: "bg-red-600 text-white" },
};

interface LeaveRequestFiltersProps {
  filter: LeaveFilter;
  onFilterChange: (filter: LeaveFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: Record<LeaveFilter, number>;
}

/**
 * Renders the queue's search box and status tabs.
 *
 * @param props - The active filter and search term, plus their handlers.
 */
export function LeaveRequestFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
}: LeaveRequestFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          aria-label="Search leave requests"
          className="w-full max-w-[300px] rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#154473] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search />
        </div>
      </div>

      {LEAVE_FILTERS.map((key) => {
        const tab = TABS[key];
        const button = (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            aria-pressed={filter === key}
            className={cn(
              "rounded-xl px-3 py-1.5 text-[15px] font-medium transition",
              filter === key
                ? tab.active
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {tab.label} ({counts[key]})
          </button>
        );

        return key === "pending" ? (
          <Tooltip
            key={key}
            content="Pending: awaiting your decision. Approved/Rejected: already actioned."
            side="bottom"
          >
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </div>
  );
}
