"use client";

/**
 * The "Courses" tab on the class detail screen.
 *
 * Editing and deleting a course is a curriculum change, so those controls are
 * gated on `manage:curriculum` — the permission the courses endpoints check —
 * rather than on `manage:classes`.
 */
import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { BookOpen, Clock } from "lucide-react";
import type { ClassCourse } from "@/components/classes/class.model";

interface ClassCoursesTabProps {
  courses: ClassCourse[];
  /** True when the signed-in administrator may change the curriculum. */
  canManageCurriculum: boolean;
  /** The course currently being deleted, so its row can show progress. */
  deletingCourseId: string | null;
  onEditCourse: (course: ClassCourse) => void;
  onDeleteCourse: (course: ClassCourse) => void;
}

/** A course's subject, however the route populated it. */
function subjectLabel(course: ClassCourse): string {
  const subject = course.subjectId;
  if (!subject || typeof subject === "string") return "Not set";
  return subject.code ? `${subject.name ?? "Subject"} (${subject.code})` : (subject.name ?? "Not set");
}

/**
 * Renders the courses tab.
 *
 * @param props - See {@link ClassCoursesTabProps}.
 * @returns The tab body.
 */
export function ClassCoursesTab({
  courses,
  canManageCurriculum,
  deletingCourseId,
  onEditCourse,
  onDeleteCourse,
}: ClassCoursesTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Courses</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage courses for this class</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
            No courses yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Courses assigned from Curriculum will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 min-w-0 truncate">
                  {course.title || "Untitled Course"}
                </h3>
                {canManageCurriculum && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEditCourse(course)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                      aria-label={`Edit ${course.title ?? "course"}`}
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCourse(course)}
                      disabled={deletingCourseId === course._id}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition disabled:opacity-50"
                      aria-label={`Delete ${course.title ?? "course"}`}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700 dark:text-slate-300">Code:</span>
                  <span className="text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {course.courseCode || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700 dark:text-slate-300">Subject:</span>
                  <span className="text-gray-900 dark:text-slate-100">{subjectLabel(course)}</span>
                </div>

                {course.updatedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-slate-400">
                      Updated {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
