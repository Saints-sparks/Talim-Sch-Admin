"use client";

/**
 * One class in the class grid: its tone chip, grade, course and student
 * counts, and the two ways into it.
 *
 * The edit button is rendered only for an administrator holding
 * `manage:classes`; "Manage Class" is read-only and always available.
 */
import React from "react";
import { BookOpen, CalendarClock, Pencil, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Avatar, Pill, card, ghostButton, iconButton, toneClass } from "@/components/tl";
import { Permission } from "@/lib/permissions";
import type { ClassDetail, ClassStudent } from "@/components/classes/class.model";

/** How many student avatars the card stacks before it stops. */
const AVATAR_LIMIT = 3;

/** Props for {@link ClassCard}. */
interface ClassCardProps {
  /** The class to show. */
  classItem: ClassDetail;
  /** Opens the class detail screen. */
  onOpen: (classId: string) => void;
  /** Opens the class edit screen. */
  onEdit: (classId: string) => void;
}

/**
 * A student's avatar url and first name, however the route populated them.
 *
 * @param student - One embedded student.
 * @returns The avatar url (or "") and the first name (or "").
 */
function studentIdentity(student: ClassStudent): { avatar: string; firstName: string } {
  const user = typeof student.userId === "object" ? student.userId : undefined;
  return {
    avatar: user?.userAvatar || student.userAvatar || "",
    firstName: user?.firstName || student.firstName || "",
  };
}

/**
 * Up to two letters that stand for a class on its tone chip ("5A" for
 * "Grade 5A", "JS" for "JSS One").
 *
 * @param name - The class name.
 * @returns The letters, upper-cased.
 */
function classMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? "";
  if (/\d/.test(last)) return last.slice(0, 3).toUpperCase();
  const letters = words.length > 1 ? `${words[0][0]}${last[0]}` : last.slice(0, 2);
  return letters.toUpperCase() || "?";
}

/**
 * Renders the card: the class's tone chip and name, its counts as pills, the
 * student avatar stack and the "Manage Class" button.
 *
 * @param props - See {@link ClassCardProps}.
 * @param props.classItem - The class.
 * @param props.onOpen - Opens the class.
 * @param props.onEdit - Edits the class.
 * @returns The card.
 */
export function ClassCard({ classItem, onOpen, onEdit }: ClassCardProps) {
  const students = classItem.students ?? [];
  const capacity = classItem.classCapacity || "50";
  const enrolled = classItem.studentCount ?? students.length;
  const courseCount = classItem.courses?.length ?? 0;
  const full = Number(capacity) > 0 && enrolled >= Number(capacity);

  return (
    <article className={`${card} flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className={`${toneClass(classItem._id || classItem.name)} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-tone-bd bg-tone-bg text-sm font-extrabold text-tone-fg`}
          >
            {classMonogram(classItem.name)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-extrabold tracking-[-0.2px] text-tl-ink">
              {classItem.name}
            </h3>
            <p className="truncate text-[13px] text-tl-muted">
              {classItem.gradeLevel || "Grade not set"}
            </p>
          </div>
        </div>
        <PermissionGate permission={Permission.MANAGE_CLASSES}>
          <Tooltip
            content="Update the class name, grade level, capacity, or description."
            side="top"
          >
            <button
              type="button"
              onClick={() => onEdit(classItem._id)}
              className={`${iconButton} -mr-2 -mt-2`}
              aria-label={`Edit ${classItem.name}`}
            >
              <Pencil className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </Tooltip>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill tone="info">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          {courseCount} {courseCount === 1 ? "course" : "courses"}
        </Pill>
        <Pill tone={full ? "warning" : "success"} title="Students enrolled out of the capacity">
          <Users className="h-3.5 w-3.5" aria-hidden />
          <span>
            {enrolled}/{capacity}
          </span>
          students
        </Pill>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-tl-line-soft bg-tl-subtle px-3.5 py-2.5">
        <div className="flex -space-x-2" aria-hidden>
          {students.length === 0 ? (
            <span className="text-[13px] text-tl-muted">No students yet</span>
          ) : (
            students.slice(0, AVATAR_LIMIT).map((student, index) => {
              const { avatar, firstName } = studentIdentity(student);
              const key = student._id || `student-${index}`;
              return (
                <span key={key} className="rounded-full ring-2 ring-tl-subtle">
                  <Avatar id={key} name={firstName || "?"} src={avatar || null} size={26} />
                </span>
              );
            })
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-tl-muted">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Updated {new Date(classItem.updatedAt || Date.now()).toLocaleDateString()}
        </span>
      </div>

      <Tooltip
        content="Open class details to manage students, courses, and teacher relationships."
        side="top"
      >
        <button
          type="button"
          onClick={() => onOpen(classItem._id)}
          className={`${ghostButton} mt-auto w-full`}
        >
          Manage Class
        </button>
      </Tooltip>
    </article>
  );
}
