"use client";

/**
 * The card of courses that can be dragged onto the grid, each in its tone.
 *
 * Cards are only draggable for a viewer who holds `manage:timetable`; without
 * it the card stays as a reference list of what the class is taught. On a
 * narrow screen the courses run in a row above the grid; on a wide one they
 * stand in a column beside it.
 */

import React from "react";
import { BookOpen, GripVertical } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyNote, cardFrame, sectionTitle, skeletonBlock } from "@/components/tl";
import type { TimetableCourse } from "@/app/services/timetable.service";
import { colorForCourse, courseTeacherName } from "./timetable.model";

/** Props for {@link CoursePalette}. */
interface CoursePaletteProps {
  /** The class's courses. */
  courses: TimetableCourse[];
  /** True while they load. */
  isLoading: boolean;
  /** Teacher names by id, for courses whose teacher is not populated. */
  teacherNames: Map<string, string>;
  /** True when the cards can be dragged. */
  canManage: boolean;
  /** Called with the course being dragged. */
  onDragStart: (course: TimetableCourse) => void;
}

/**
 * Renders the palette.
 *
 * @param props - See {@link CoursePaletteProps}.
 * @param props.courses - The courses.
 * @param props.isLoading - Whether they load.
 * @param props.teacherNames - Teacher names by id.
 * @param props.canManage - Whether cards drag.
 * @param props.onDragStart - Drag handler.
 * @returns The card.
 */
export function CoursePalette({
  courses,
  isLoading,
  teacherNames,
  canManage,
  onDragStart,
}: CoursePaletteProps) {
  return (
    <section
      className={`${cardFrame} flex min-w-0 flex-col lg:sticky lg:top-4 lg:max-h-[calc(100dvh-120px)]`}
      data-guide="timetable-subjects"
      aria-labelledby="timetable-palette-title"
    >
      <div className="px-4 pb-2 pt-4">
        <h2 id="timetable-palette-title" className={sectionTitle}>
          Subject
        </h2>
        {canManage && (
          <p className="mt-0.5 text-xs text-tl-muted">Drag a course onto a free period.</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto px-4 pb-4 lg:overflow-y-auto lg:overflow-x-hidden">
        {isLoading ? (
          <div aria-busy="true" aria-label="Loading courses" className="flex gap-2 lg:flex-col">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                aria-hidden
                className={`${skeletonBlock} h-[76px] w-[150px] shrink-0 rounded-[14px] lg:w-full`}
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyNote compact icon={<BookOpen />} title="No courses yet">
            <span className="text-[13px]">No courses found for this class.</span>
          </EmptyNote>
        ) : (
          <ul className="flex gap-2 lg:flex-col">
            {courses.map((course) => {
              const colors = colorForCourse(course._id);
              return (
                <li key={course._id} className="shrink-0 lg:shrink">
                  <Tooltip
                    content={
                      canManage
                        ? "Drag this course into an empty timetable slot. Its assigned teacher follows it automatically."
                        : "You need the Timetable permission to schedule this course."
                    }
                    side="right"
                  >
                    <div
                      draggable={canManage}
                      onDragStart={() => onDragStart(course)}
                      className={`${colors.bg} border ${colors.border} flex w-[160px] items-start gap-2 rounded-[14px] px-3 py-2.5 transition-shadow lg:w-full ${
                        canManage
                          ? "cursor-grab hover:shadow-[0_6px_16px_-10px_rgba(15,27,46,0.4)] active:cursor-grabbing"
                          : "cursor-default"
                      }`}
                    >
                      {canManage && (
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-tone-fg" aria-hidden />
                      )}
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-extrabold text-tone-fg">
                          {course.title}
                        </span>
                        <span className="mt-0.5 block break-words text-xs font-semibold text-tl-body">
                          {courseTeacherName(course, teacherNames)}
                        </span>
                      </span>
                    </div>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
