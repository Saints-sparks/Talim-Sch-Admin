"use client";

/**
 * Search box and status filter above the leave queue.
 *
 * The counts come from the whole queue, not the filtered view, so a tab always
 * says how much work is behind it.
 */
import React from "react";
import { SearchField } from "@/components/tl/bits";
import { Segmented, type TabOption } from "@/components/tl/Tabs";
import { LEAVE_FILTERS, type LeaveFilter } from "./leave.presentation";

/** How each status is labelled. */
const LABELS: Record<LeaveFilter, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

interface LeaveRequestFiltersProps {
  filter: LeaveFilter;
  onFilterChange: (filter: LeaveFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: Record<LeaveFilter, number>;
}

/**
 * The queue's status filter (the portals' segmented control, each with its
 * count) and search box, in a toolbar that wraps on narrow screens.
 *
 * @param props - The active filter and search term, plus their handlers.
 * @param props.filter - The active status.
 * @param props.onFilterChange - Picks a status.
 * @param props.search - The search text.
 * @param props.onSearchChange - Changes the search.
 * @param props.counts - Requests per status.
 * @returns The toolbar.
 */
export function LeaveRequestFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
}: LeaveRequestFiltersProps) {
  const options: TabOption<LeaveFilter>[] = LEAVE_FILTERS.map((key) => ({
    value: key,
    label: `${LABELS[key]} (${counts[key]})`,
    tip:
      key === "pending"
        ? "Pending: awaiting your decision. Approved/Rejected: already actioned."
        : undefined,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Segmented
        options={options}
        value={filter}
        onChange={onFilterChange}
        label="Show requests that are"
      />
      <SearchField
        value={search}
        onChange={onSearchChange}
        label="Search leave requests"
        placeholder="Search"
        className="w-full max-w-[320px]"
      />
    </div>
  );
}
