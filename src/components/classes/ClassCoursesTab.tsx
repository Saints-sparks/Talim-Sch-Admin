"use client";

/**
 * The "Courses" tab on the class detail screen: one tile per course, each in
 * its subject's tone.
 *
 * Editing and deleting a course is a curriculum change, so those controls are
 * gated on `manage:curriculum` — the permission the courses endpoints check —
 * rather than on `manage:classes`.
 */
import React from "react";
import { BookOpen, Clock, Pencil, Trash2 } from "lucide-react";
import {
  CardHeader,
  EmptyNote,
  Pill,
  card,
  focusRing,
  iconButton,
  toneClass,
} from "@/components/tl";
import type { ClassCourse } from "@/components/classes/class.model";

/** Props for {@link ClassCoursesTab}. */
interface ClassCoursesTabProps {
  /** The class's courses. */
  courses: ClassCourse[];
  /** True when the signed-in administrator may change the curriculum. */
  canManageCurriculum: boolean;
  /** The course currently being deleted, so its row can show progress. */
  deletingCourseId: string | null;
  /** Opens the course in the course sheet. */
  onEditCourse: (course: ClassCourse) => void;
  /** Asks to delete the course. */
  onDeleteCourse: (course: ClassCourse) => void;
}

/**
 * A course's subject, however the route populated it.
 *
 * @param course - The course.
 * @returns "Mathematics (MTH)", the name alone, or "Not set".
 */
function subjectLabel(course: ClassCourse): string {
  const subject = course.subjectId;
  if (!subject || typeof subject === "string") return "Not set";
  return subject.code
    ? `${subject.name ?? "Subject"} (${subject.code})`
    : (subject.name ?? "Not set");
}

/**
 * The id a course's tone is keyed on: its subject, so every course of one
 * subject wears the same colour.
 *
 * @param course - The course.
 * @returns A stable id.
 */
function toneKey(course: ClassCourse): string {
  const subject = course.subjectId;
  if (typeof subject === "string") return subject;
  return subject?._id || course._id;
}

/**
 * Renders the courses tab.
 *
 * @param props - See {@link ClassCoursesTabProps}.
 * @param props.courses - The courses.
 * @param props.canManageCurriculum - Whether edit and delete show.
 * @param props.deletingCourseId - The course being deleted.
 * @param props.onEditCourse - Edit handler.
 * @param props.onDeleteCourse - Delete handler.
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
    <section className={card}>
      <CardHeader title="Courses" subtitle="Manage courses for this class" />

      {courses.length === 0 ? (
        <EmptyNote icon={<BookOpen />} title="No courses yet">
          Courses assigned from Curriculum will appear here.
        </EmptyNote>
      ) : (
        <ul className="mt-[18px] grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
          {courses.map((course) => (
            <li
              key={course._id}
              className={`${toneClass(toneKey(course))} flex flex-col gap-3 rounded-2xl border border-tl-line-soft bg-tl-subtle p-4`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tone-bd bg-tone-bg text-tone-fg"
                  >
                    <BookOpen className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="min-w-0 truncate text-[15px] font-extrabold text-tl-ink">
                    {course.title || "Untitled Course"}
                  </h3>
                </div>
                {canManageCurriculum && (
                  <div className="-mr-2 -mt-2 flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => onEditCourse(course)}
                      className={iconButton}
                      aria-label={`Edit ${course.title ?? "course"}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCourse(course)}
                      disabled={deletingCourseId === course._id}
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tl-danger transition-colors hover:bg-tl-danger-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                      aria-label={`Delete ${course.title ?? "course"}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-tl-body">
                <Pill tone="muted">{course.courseCode || "N/A"}</Pill>
                <span className="min-w-0 break-words">{subjectLabel(course)}</span>
              </div>

              {course.updatedAt && (
                <p className="flex items-center gap-1.5 text-xs text-tl-muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Updated {new Date(course.updatedAt).toLocaleDateString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
