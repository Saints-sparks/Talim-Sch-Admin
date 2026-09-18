"use client";

/**
 * The four headline counters on the curriculum dashboard.
 *
 * Each card shows a pulse while the KPI request is in flight, then the server
 * figure; the page passes a locally computed fallback for the sub-admins whose
 * role cannot read `/curriculum/kpis`.
 */
import React from "react";
import { BookOpen, FolderOpen, GraduationCap, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

/** One counter's value and presentation. */
interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  /** Tailwind classes for the icon tile. */
  iconClass: string;
  /** Tailwind classes for the number. */
  valueClass: string;
  tooltip?: string;
}

interface CurriculumStatCardsProps {
  totalSubjects: number;
  totalCourses: number;
  totalClasses: number;
  activeTeachers: number;
  isLoading: boolean;
}

/**
 * Renders the counter row.
 *
 * @param props - The four totals and whether they are still loading.
 * @returns The grid of cards.
 */
export function CurriculumStatCards({
  totalSubjects,
  totalCourses,
  totalClasses,
  activeTeachers,
  isLoading,
}: CurriculumStatCardsProps) {
  const cards: StatCard[] = [
    {
      label: "Total Subjects",
      value: totalSubjects,
      icon: <BookOpen className="h-6 w-6 text-white" />,
      iconClass: "bg-[#003366]",
      valueClass: "text-[#003366] dark:text-blue-300",
      tooltip: "A broad area of study (e.g. Mathematics, English Language).",
    },
    {
      label: "Total Courses",
      value: totalCourses,
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      iconClass: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      valueClass: "text-emerald-600 dark:text-emerald-400",
      tooltip:
        "A specific unit or module within a subject (e.g. Algebra, Essay Writing). Assigned to a class.",
    },
    {
      label: "Total Classes",
      value: totalClasses,
      icon: <FolderOpen className="h-6 w-6 text-white" />,
      iconClass: "bg-gradient-to-r from-amber-500 to-amber-600",
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Active Teachers",
      value: activeTeachers,
      icon: <Users className="h-6 w-6 text-white" />,
      iconClass: "bg-gradient-to-r from-purple-500 to-purple-600",
      valueClass: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      data-guide="curriculum-stats"
    >
      {cards.map((card) => {
        const label = (
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{card.label}</p>
        );

        return (
          <div
            key={card.label}
            className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                {card.tooltip ? (
                  <Tooltip content={card.tooltip} side="right">
                    {label}
                  </Tooltip>
                ) : (
                  label
                )}
                <p className={`text-3xl font-bold ${card.valueClass}`}>
                  {isLoading ? (
                    <span className="block h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div className={`p-3 rounded-xl shadow-lg ${card.iconClass}`}>{card.icon}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
