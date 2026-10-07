"use client";

/**
 * The subject list on the curriculum structure screen: one collapsible card
 * per subject, in its tone, with its courses inside.
 *
 * Every write here (add / edit / delete a course, edit or delete the subject)
 * is rendered only for an administrator holding `manage:curriculum`, so a
 * sub-admin without it gets a readable list instead of buttons the API refuses.
 */
import React from "react";
import { BookOpen, ChevronDown, GraduationCap, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { resolveTeacherName } from "@/components/curriculum/curriculum.presentation";
import {
  EmptyNote,
  Pill,
  cardFrame,
  focusRing,
  iconButton,
  quietButton,
  rowButton,
  toneClass,
} from "@/components/tl";
import type { Course, Subject, Teacher } from "@/app/services/subjects.service";
import type { Class } from "@/app/services/school.service";

/** A round red icon button (Delete on a row). */
const dangerIconButton = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tl-danger transition-colors hover:bg-tl-danger-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** Props for {@link SubjectAccordion}. */
interface SubjectAccordionProps {
  /** The subjects to list. */
  subjects: Subject[];
  /** The school's classes, to name each subject's classes. */
  classes: Class[];
  /** The school's teachers, to name each course's teacher. */
  teachers: Teacher[];
  /** Ids of the subjects whose courses are showing. */
  expanded: Set<string>;
  /** Opens or closes one subject. */
  onToggle: (subjectId: string) => void;
  /** True when the signed-in administrator may change the curriculum. */
  canManage: boolean;
  /** Course currently being deleted, so its row can show progress. */
  deletingCourseId: string | null;
  /** Opens the add-course sheet for a subject. */
  onAddCourse: (subject: Subject) => void;
  /** Opens the subject sheet. */
  onEditSubject: (subject: Subject) => void;
  /** Asks to delete a subject. */
  onDeleteSubject: (subject: Subject) => void;
  /** Opens the course sheet. */
  onEditCourse: (course: Course) => void;
  /** Asks to delete a course. */
  onDeleteCourse: (course: Course) => void;
}

/**
 * The classes a subject's courses are taught to, as readable names.
 *
 * @param subject - The subject.
 * @param classes - The school's classes.
 * @returns The class names.
 */
function subjectClassNames(subject: Subject, classes: Class[]): string[] {
  const ids = new Set(
    (subject.courses ?? [])
      .map((course) => (typeof course.classId === "string" ? course.classId : ""))
      .filter(Boolean)
  );
  return classes.filter((cls) => ids.has(cls._id)).map((cls) => cls.name);
}

/**
 * Renders the accordion.
 *
 * @param props - See {@link SubjectAccordionProps}.
 * @param props.subjects - The subjects.
 * @param props.classes - The classes.
 * @param props.teachers - The teachers.
 * @param props.expanded - Open subjects.
 * @param props.onToggle - Opens or closes one.
 * @param props.canManage - Whether writes show.
 * @param props.deletingCourseId - The course being deleted.
 * @param props.onAddCourse - Add a course.
 * @param props.onEditSubject - Edit a subject.
 * @param props.onDeleteSubject - Delete a subject.
 * @param props.onEditCourse - Edit a course.
 * @param props.onDeleteCourse - Delete a course.
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
    <ul className="flex flex-col gap-3">
      {subjects.map((subject) => {
        const isExpanded = expanded.has(subject._id);
        const courses = subject.courses ?? [];
        const classNames = subjectClassNames(subject, classes);

        return (
          <li key={subject._id} className={`${cardFrame} ${toneClass(subject._id)}`}>
            <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
              <Tooltip
                content="Expand the subject to view its courses, teachers, and course actions."
                side="right"
              >
                <button
                  type="button"
                  onClick={() => onToggle(subject._id)}
                  className={iconButton}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? `Collapse ${subject.name}` : `Expand ${subject.name}`}
                >
                  <ChevronDown
                    aria-hidden
                    className={`h-5 w-5 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                  />
                </button>
              </Tooltip>

              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tone-bd bg-tone-bg text-tone-fg"
              >
                <BookOpen className="h-[18px] w-[18px]" />
              </span>

              <div className="min-w-0 flex-1 basis-[180px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[15px] font-extrabold text-tl-ink">
                    {subject.name}
                  </span>
                  <Pill tone="info">{subject.code}</Pill>
                  {classNames.slice(0, 2).map((name) => (
                    <Pill key={name} tone="muted">
                      {name}
                    </Pill>
                  ))}
                  {classNames.length > 2 && (
                    <span className="text-xs text-tl-muted">+{classNames.length - 2} more</span>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] text-tl-muted">
                  {courses.length} {courses.length === 1 ? "course" : "courses"}
                </p>
              </div>

              {canManage && (
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <Tooltip
                    content="Create a course within the selected subject. Choose which class it belongs to."
                    side="top"
                  >
                    <button
                      type="button"
                      onClick={() => onAddCourse(subject)}
                      className={rowButton}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Add Course
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Edit the subject name or code used across courses, reports, and timetables."
                    side="top"
                  >
                    <button
                      type="button"
                      onClick={() => onEditSubject(subject)}
                      className={iconButton}
                      aria-label={`Edit ${subject.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Deleting a subject removes all its courses. This cannot be undone."
                    side="top"
                  >
                    <button
                      type="button"
                      onClick={() => onDeleteSubject(subject)}
                      className={dangerIconButton}
                      aria-label={`Delete ${subject.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-tl-line-soft bg-tl-subtle">
                {courses.length > 0 ? (
                  <ul>
                    {courses.map((course) => (
                      <li
                        key={course._id}
                        className="flex flex-wrap items-center gap-3 border-b border-tl-line-soft px-4 py-3 sm:pl-[68px]"
                      >
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tone-bg text-tone-fg"
                        >
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 basis-[160px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-tl-ink">
                              {course.title}
                            </span>
                            <Pill tone="muted">{course.courseCode}</Pill>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-tl-muted">
                            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="truncate">
                              {resolveTeacherName(course.teacherId, teachers)}
                            </span>
                          </div>
                        </div>
                        {course.description && (
                          <p className="hidden max-w-xs shrink-0 text-xs text-tl-muted line-clamp-1 md:block">
                            {course.description}
                          </p>
                        )}
                        {canManage && (
                          <div className="ml-auto flex shrink-0 items-center">
                            <Tooltip
                              content="Update the course class, teacher, code, or description."
                              side="top"
                            >
                              <button
                                type="button"
                                onClick={() => onEditCourse(course)}
                                className={iconButton}
                                aria-label={`Edit ${course.title}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                            </Tooltip>
                            <Tooltip
                              content="Remove this course from the curriculum structure."
                              side="top"
                            >
                              <button
                                type="button"
                                onClick={() => onDeleteCourse(course)}
                                disabled={deletingCourseId === course._id}
                                className={dangerIconButton}
                                aria-label={`Delete ${course.title}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </li>
                    ))}
                    {canManage && (
                      <li className="px-4 py-1.5 sm:pl-[60px]">
                        <Tooltip
                          content="Add another class-level course under this subject."
                          side="top"
                        >
                          <button
                            type="button"
                            onClick={() => onAddCourse(subject)}
                            className={`${quietButton} text-tl-link hover:text-tl-link`}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                            Add another course
                          </button>
                        </Tooltip>
                      </li>
                    )}
                  </ul>
                ) : (
                  <EmptyNote
                    compact
                    icon={<GraduationCap />}
                    title="No courses yet"
                    action={
                      canManage ? (
                        <Tooltip
                          content="Create the first course for this subject so it can be assigned to classes and teachers."
                          side="top"
                        >
                          <button
                            type="button"
                            onClick={() => onAddCourse(subject)}
                            className={rowButton}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                            Add Course
                          </button>
                        </Tooltip>
                      ) : undefined
                    }
                  >
                    Add the first course to this subject
                  </EmptyNote>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
