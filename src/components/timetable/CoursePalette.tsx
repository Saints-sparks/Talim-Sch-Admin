"use client";

/**
 * The sidebar of courses that can be dragged onto the grid.
 *
 * Cards are only draggable for a viewer who holds `manage:timetable`; without
 * it the sidebar stays as a reference list of what the class is taught.
 */

import React from "react";
import { BookOpen } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TimetableCourse } from "@/app/services/timetable.service";
import { courseTeacherName } from "./timetable.model";

interface CoursePaletteProps {
  courses: TimetableCourse[];
  isLoading: boolean;
  teacherNames: Map<string, string>;
  canManage: boolean;
  onDragStart: (course: TimetableCourse) => void;
}

export function CoursePalette({
  courses,
  isLoading,
  teacherNames,
  canManage,
  onDragStart,
}: CoursePaletteProps) {
  return (
    <div
      className="w-[182px] bg-white dark:bg-slate-800 border border-[#F0F0F0] dark:border-slate-700 flex flex-col rounded-2xl"
      data-guide="timetable-subjects"
    >
      <div className="p-4">
        <h2 className="font-semibold text-[15px] text-[#1A1A1A] dark:text-slate-100">Subject</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 border-2 border-[#E0E0E0] dark:border-slate-600 rounded-lg flex items-center justify-center mb-4 bg-[#F8F8F8] dark:bg-slate-900/40">
              <BookOpen />
            </div>
            <p className="text-[13px] text-[#4D4D4D] dark:text-slate-400 text-center leading-relaxed">
              No courses found for this class.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <Tooltip
                key={course._id}
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
                  className={`w-[142px] h-[100px] bg-[#F2F2F2] dark:bg-slate-900/40 border border-[#E0E0E0] dark:border-slate-700 rounded-xl flex px-2 justify-center flex-col transition-colors hover:shadow-sm ${
                    canManage
                      ? "cursor-move hover:bg-gray-100 dark:hover:bg-slate-700"
                      : "cursor-default"
                  }`}
                >
                  <BookOpen />
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1A1A1A] dark:text-slate-100">
                    {course.title}
                  </div>
                  <div className="text-[15px] font-medium mt-1 text-[#4D4D4D] dark:text-slate-400">
                    {courseTeacherName(course, teacherNames)}
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
