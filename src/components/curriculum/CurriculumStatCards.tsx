"use client";

/**
 * The four headline counters on the curriculum dashboard, as stat tiles.
 *
 * Each tile shows a pulse while the KPI request is in flight, then the server
 * figure; the page passes a locally computed fallback for the sub-admins whose
 * role cannot read `/curriculum/kpis`.
 */
import React from "react";
import { BookOpen, FolderOpen, GraduationCap, Users } from "lucide-react";
import { StatGrid, StatTile, skeletonBlock } from "@/components/tl";

/** One counter's value and presentation. */
interface StatCard {
  /** The small uppercase label. */
  label: string;
  /** The figure. */
  value: number;
  /** The corner icon. */
  icon: React.ReactNode;
  /** Colour classes for the figure. */
  valueClass: string;
  /** What the label means, on hover. */
  tooltip?: string;
}

/** Props for {@link CurriculumStatCards}. */
interface CurriculumStatCardsProps {
  /** Subjects in the school. */
  totalSubjects: number;
  /** Courses across them. */
  totalCourses: number;
  /** Classes in the school. */
  totalClasses: number;
  /** Teachers who have published curriculum content. */
  activeTeachers: number;
  /** True while the figures load. */
  isLoading: boolean;
}

/**
 * Renders the counter row.
 *
 * @param props - The four totals and whether they are still loading.
 * @param props.totalSubjects - Subjects.
 * @param props.totalCourses - Courses.
 * @param props.totalClasses - Classes.
 * @param props.activeTeachers - Active teachers.
 * @param props.isLoading - Whether they load.
 * @returns The grid of tiles.
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
      icon: <BookOpen />,
      valueClass: "text-[28px] text-tl-brand",
      tooltip: "A broad area of study (e.g. Mathematics, English Language).",
    },
    {
      label: "Total Courses",
      value: totalCourses,
      icon: <GraduationCap />,
      valueClass: "text-[28px] text-tl-success",
      tooltip:
        "A specific unit or module within a subject (e.g. Algebra, Essay Writing). Assigned to a class.",
    },
    {
      label: "Total Classes",
      value: totalClasses,
      icon: <FolderOpen />,
      valueClass: "text-[28px] text-tl-warning",
    },
    {
      label: "Active Teachers",
      value: activeTeachers,
      icon: <Users />,
      valueClass: "text-[28px] text-tl-accent",
    },
  ];

  return (
    <div data-guide="curriculum-stats">
      <StatGrid label="Curriculum figures">
        {cards.map((card) => (
          <StatTile
            key={card.label}
            label={card.label}
            tip={card.tooltip}
            icon={card.icon}
            valueClass={card.valueClass}
            value={
              isLoading ? (
                <span className={`${skeletonBlock} block h-8 w-16 rounded-lg`}>
                  <span className="sr-only">Loading</span>
                </span>
              ) : (
                card.value
              )
            }
          />
        ))}
      </StatGrid>
    </div>
  );
}
