"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { SearchField, card, selectControl } from "@/components/tl";

/** A class as the filter needs it — id and label only. */
export interface RosterFilterClass {
  _id: string;
  name: string;
}

/** Props for {@link RosterFilters}. */
interface RosterFiltersProps {
  /** Current search text (the raw input value; debounce it in the page). */
  search: string;
  /** Called on every keystroke. */
  onSearchChange: (value: string) => void;
  /** Placeholder (and accessible name) for the search box. */
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

/**
 * The roster toolbar shared by the student and teacher rosters: a search box,
 * then the class and status selects, in one card that wraps on narrow
 * screens.
 *
 * @param props - See {@link RosterFiltersProps}.
 * @param props.search - The search text.
 * @param props.onSearchChange - Search handler.
 * @param props.searchPlaceholder - Search placeholder and name.
 * @param props.classes - The classes to filter by.
 * @param props.selectedClass - The chosen class.
 * @param props.onClassChange - Class handler.
 * @param props.classTooltip - The class filter's hint.
 * @param props.status - The chosen status.
 * @param props.onStatusChange - Status handler.
 * @param props.statusTooltip - The status filter's hint.
 * @param props.dataGuide - Tour target.
 * @returns The toolbar.
 */
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
    <div className={`${card} flex flex-wrap items-center gap-3 !py-3.5`} data-guide={dataGuide}>
      <SearchField
        value={search}
        onChange={onSearchChange}
        label={searchPlaceholder}
        className="flex-1 basis-[260px]"
      />

      <Tooltip content={classTooltip} side="top">
        <select
          aria-label="Filter by class"
          className={`${selectControl} w-full sm:w-auto sm:min-w-[180px]`}
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

      <Tooltip content={statusTooltip} side="top">
        <select
          aria-label="Filter by status"
          className={`${selectControl} w-full sm:w-auto sm:min-w-[150px]`}
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Tooltip>
    </div>
  );
}

export default RosterFilters;
