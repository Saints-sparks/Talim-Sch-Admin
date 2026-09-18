"use client";

/**
 * The counters and the search / class filter above the subject list on the
 * curriculum structure screen.
 */
import React from "react";
import { Filter, GraduationCap, LayoutList, Search, Users } from "lucide-react";
import type { Class } from "@/app/services/school.service";

interface StructureToolbarProps {
  totalSubjects: number;
  totalCourses: number;
  totalClasses: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  classes: Class[];
  /** The selected class id, or "all". */
  selectedClass: string;
  onClassChange: (classId: string) => void;
}

/**
 * Renders the stats row and the filter bar.
 *
 * @param props - See {@link StructureToolbarProps}.
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
  const stats = [
    { label: "Total Subjects", value: totalSubjects, icon: <LayoutList className="w-4 h-4" /> },
    { label: "Total Courses", value: totalCourses, icon: <GraduationCap className="w-4 h-4" /> },
    { label: "Classes", value: totalClasses, icon: <Users className="w-4 h-4" /> },
  ];

  const fieldClass =
    "py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] text-sm text-gray-900 dark:text-slate-100 transition-all";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" data-guide="curriculum-structure-stats">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 px-5 py-4 flex items-center gap-3 ${
              index === 2 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#003366]/10 dark:bg-blue-900/30 text-[#003366] dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex flex-col sm:flex-row gap-3"
        data-guide="curriculum-structure-filters"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="search"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search subjects"
            className={`${fieldClass} w-full pl-9 pr-4 placeholder-gray-400 dark:placeholder-slate-500`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedClass}
            onChange={(event) => onClassChange(event.target.value)}
            aria-label="Filter subjects by class"
            className={`${fieldClass} min-w-[160px]`}
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
