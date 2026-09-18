"use client";

/**
 * The subject list on the curriculum structure screen: one collapsible row per
 * subject, its courses inside.
 *
 * Every write here (add / edit / delete a course, edit or delete the subject)
 * is rendered only for an administrator holding `manage:curriculum`, so a
 * sub-admin without it gets a readable list instead of buttons the API refuses.
 */
import React from "react";
import { BookOpen, ChevronDown, ChevronRight, Edit, GraduationCap, Plus, Trash2, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { resolveTeacherName } from "@/components/curriculum/curriculum.presentation";
import type { Course, Subject, Teacher } from "@/app/services/subjects.service";
import type { Class } from "@/app/services/school.service";

interface SubjectAccordionProps {
  subjects: Subject[];
  classes: Class[];
  teachers: Teacher[];
  /** Ids of the subjects whose courses are showing. */
  expanded: Set<string>;
  onToggle: (subjectId: string) => void;
  /** True when the signed-in administrator may change the curriculum. */
  canManage: boolean;
  /** Course currently being deleted, so its row can show progress. */
  deletingCourseId: string | null;
  onAddCourse: (subject: Subject) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
}

/** The classes a subject's courses are taught to, as readable names. */
function subjectClassNames(subject: Subject, classes: Class[]): string[] {
  const ids = new Set(
    (subject.courses ?? [])
      .map((course) => (typeof course.classId === "string" ? course.classId : ""))
      .filter(Boolean),
  );
  return classes.filter((cls) => ids.has(cls._id)).map((cls) => cls.name);
}

/**
 * Renders the accordion.
 *
 * @param props - See {@link SubjectAccordionProps}.
 * @returns The list.
 */
export function SubjectAccordion({
  subjects,
  classes,
  teachers,
  expanded,
  onToggle,
  canManage,
  deletingCourseId,
  onAddCourse,
  onEditSubject,
  onDeleteSubject,
  onEditCourse,
  onDeleteCourse,
}: SubjectAccordionProps) {
  return (
    <div className="space-y-2">
      {subjects.map((subject) => {
        const isExpanded = expanded.has(subject._id);
        const courses = subject.courses ?? [];
        const classNames = subjectClassNames(subject, classes);

        return (
          <div
            key={subject._id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Tooltip
                content="Expand the subject to view its courses, teachers, and course actions."
                side="right"
              >
                <button
                  onClick={() => onToggle(subject._id)}
                  className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? `Collapse ${subject.name}` : `Expand ${subject.name}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  )}
                </button>
              </Tooltip>

              <div className="w-8 h-8 rounded-lg bg-[#003366]/10 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#003366] dark:text-blue-300" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                    {subject.name}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#003366]/10 dark:bg-blue-900/30 text-[#003366] dark:text-blue-300">
                    {subject.code}
                  </span>
                  {classNames.slice(0, 2).map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                    >
                      {name}
                    </span>
                  ))}
                  {classNames.length > 2 && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      +{classNames.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0 hidden sm:block">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </span>

              {canManage && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Tooltip
                    content="Create a course within the selected subject. Choose which class it belongs to."
                    side="top"
                  >
                    <button
                      onClick={() => onAddCourse(subject)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Course</span>
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Edit the subject name or code used across courses, reports, and timetables."
                    side="top"
                  >
                    <button
                      onClick={() => onEditSubject(subject)}
                      className="p-1.5 text-gray-400 hover:text-[#003366] dark:hover:text-blue-300 hover:bg-[#003366]/5 dark:hover:bg-slate-800 rounded-lg transition-all"
                      aria-label={`Edit ${subject.name}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Deleting a subject removes all its courses. This cannot be undone."
                    side="top"
                  >
                    <button
                      onClick={() => onDeleteSubject(subject)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                      aria-label={`Delete ${subject.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40">
                {courses.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {courses.map((course) => (
                      <div
                        key={course._id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-[#003366]/5 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-3.5 h-3.5 text-[#003366] dark:text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate">
                              {course.title}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                              {course.courseCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
                              {resolveTeacherName(course.teacherId, teachers)}
                            </span>
                          </div>
                        </div>
                        {course.description && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 hidden md:block max-w-xs flex-shrink-0">
                            {course.description}
                          </p>
                        )}
                        {canManage && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Tooltip
                              content="Update the course class, teacher, code, or description."
                              side="top"
                            >
                              <button
                                onClick={() => onEditCourse(course)}
                                className="p-1.5 text-gray-400 hover:text-[#003366] dark:hover:text-blue-300 hover:bg-[#003366]/5 dark:hover:bg-slate-800 rounded-lg transition-all"
                                aria-label={`Edit ${course.title}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip
                              content="Remove this course from the curriculum structure."
                              side="top"
                            >
                              <button
                                onClick={() => onDeleteCourse(course)}
                                disabled={deletingCourseId === course._id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all disabled:opacity-50"
                                aria-label={`Delete ${course.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    ))}
                    {canManage && (
                      <div className="px-5 py-2.5">
                        <Tooltip content="Add another class-level course under this subject." side="top">
                          <button
                            onClick={() => onAddCourse(subject)}
                            className="flex items-center gap-1.5 text-xs text-[#003366] dark:text-blue-300 hover:text-[#002244] font-medium transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add another course
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#003366]/10 dark:bg-blue-900/30 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-[#003366] dark:text-blue-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        No courses yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Add the first course to this subject
                      </p>
                    </div>
                    {canManage && (
                      <Tooltip
                        content="Create the first course for this subject so it can be assigned to classes and teachers."
                        side="top"
                      >
                        <button
                          onClick={() => onAddCourse(subject)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Add Course
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
