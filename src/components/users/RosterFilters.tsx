"use client";

import React from "react";
import { ChevronDown, Search } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";

/** A class as the filter needs it — id and label only. */
export interface RosterFilterClass {
  _id: string;
  name: string;
}

interface RosterFiltersProps {
  /** Current search text (the raw input value; debounce it in the page). */
  search: string;
  /** Called on every keystroke. */
  onSearchChange: (value: string) => void;
  /** Placeholder for the search box. */
  searchPlaceholder?: string;
  /** Classes offered in the class select. */
  classes: RosterFilterClass[];
  /** Selected class id, or `null` for all classes. */
  selectedClass: string | null;
  /** Called with the new class id, or `null`. */
  onClassChange: (classId: string | null) => void;
  /** Explains what the class filter does. */
  classTooltip: string;
  /** Selected status: `""` (all), `"active"` or `"inactive"`. */
  status: string;
  /** Called with the new status. */
  onStatusChange: (status: string) => void;
  /** Explains what the status filter means. */
  statusTooltip: string;
  /** Marks the wrapper for the in-app product tour. */
  dataGuide?: string;
}

const selectClass =
  "appearance-none bg-white dark:bg-slate-800 border border-[#E0E0E0] dark:border-slate-600 h-[40px] rounded-xl px-4 py-2 pr-8 text-[15px] font-semibold w-[220px] text-gray-500 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

/** Search + class + status filters, shared by the student and teacher rosters. */
export function RosterFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Search name or ID",
  classes,
  selectedClass,
  onClassChange,
  classTooltip,
  status,
  onStatusChange,
  statusTooltip,
  dataGuide,
}: RosterFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl py-3 w-fit max-w-full" data-guide={dataGuide}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 px-6 py-4">
        <div className="relative flex-1 w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            <Search />
          </span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full pl-10 placeholder-[#B3B3B3] dark:placeholder-slate-500 placeholder:font-medium pr-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-[#E0E0E0] dark:border-slate-600 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="relative w-[220px] leading-[120%]">
          <Tooltip content={classTooltip} side="right">
            <select
              aria-label="Filter by class"
              className={selectClass}
              value={selectedClass || ""}
              onChange={(event) => onClassChange(event.target.value || null)}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </Tooltip>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
            <ChevronDown />
          </span>
        </div>

        <div className="relative w-[220px]">
          <Tooltip content={statusTooltip} side="right">
            <select
              aria-label="Filter by status"
              className={selectClass}
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Tooltip>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
            <ChevronDown />
          </span>
        </div>
      </div>
    </div>
  );
}

export default RosterFilters;
