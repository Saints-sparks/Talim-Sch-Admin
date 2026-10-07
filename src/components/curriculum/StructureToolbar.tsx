"use client";

/**
 * The stat tiles and the search / class filter card above the subject list
 * on the curriculum structure screen.
 */
import React from "react";
import { GraduationCap, LayoutList, Users } from "lucide-react";
import type { Class } from "@/app/services/school.service";
import { SearchField, StatGrid, StatTile, card, selectControl } from "@/components/tl";

/** Props for {@link StructureToolbar}. */
interface StructureToolbarProps {
  /** Subjects in the school. */
  totalSubjects: number;
  /** Courses across them. */
  totalCourses: number;
  /** Classes in the school. */
  totalClasses: number;
  /** The search text. */
  searchTerm: string;
  /** Called with new search text. */
  onSearchChange: (value: string) => void;
  /** The classes the filter offers. */
  classes: Class[];
  /** The selected class id, or "all". */
  selectedClass: string;
  /** Called with the chosen class id, or "all". */
  onClassChange: (classId: string) => void;
}

/**
 * Renders the stat tiles and the filter card.
 *
 * @param props - See {@link StructureToolbarProps}.
 * @param props.totalSubjects - Subjects.
 * @param props.totalCourses - Courses.
 * @param props.totalClasses - Classes.
 * @param props.searchTerm - Search text.
 * @param props.onSearchChange - Search handler.
 * @param props.classes - Filter options.
 * @param props.selectedClass - Chosen class.
 * @param props.onClassChange - Filter handler.
 * @returns The toolbar.
 */
export function StructureToolbar({
  totalSubjects,
  totalCourses,
  totalClasses,
  searchTerm,
  onSearchChange,
  classes,
  selectedClass,
  onClassChange,
}: StructureToolbarProps) {
  return (
    <>
      <div data-guide="curriculum-structure-stats">
        <StatGrid label="Structure figures">
          <StatTile label="Total Subjects" value={totalSubjects} icon={<LayoutList />} />
          <StatTile label="Total Courses" value={totalCourses} icon={<GraduationCap />} />
          <StatTile label="Classes" value={totalClasses} icon={<Users />} />
        </StatGrid>
      </div>

      <div
        className={`${card} flex flex-col gap-3 !py-4 sm:flex-row sm:items-center`}
        data-guide="curriculum-structure-filters"
      >
        <SearchField
          label="Search subjects"
          placeholder="Search subjects by name or code..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full flex-1"
        />
        <select
          value={selectedClass}
          onChange={(event) => onClassChange(event.target.value)}
          aria-label="Filter subjects by class"
          className={`${selectControl} w-full sm:w-auto sm:min-w-[180px]`}
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
