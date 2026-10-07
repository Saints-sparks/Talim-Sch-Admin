"use client";

import React from "react";
import { Badge, BookOpen, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { EmptyNote, Pill, eyebrow, tile } from "@/components/tl";
import type { TeacherById, TeacherClass } from "@/app/services/teacher.service";
import { DetailTile, SectionCard } from "../parts";
import { ClassTeacherHint } from "./ClassTeacherHint";

type ClassRow = TeacherClass;

/** How the teacher stands in a class (A6: class teacher only from `Class.classTeacherId`). */
type ClassRole = "Class Teacher" | "Assigned";

/**
 * One class the teacher is assigned to, with their role in it.
 *
 * @param props - The class and the teacher's role in it.
 * @param props.cls - The class.
 * @param props.role - "Class Teacher" or "Assigned".
 * @returns The row.
 */
function ClassCard({ cls, role }: { cls: ClassRow; role: ClassRole }) {
  const isForm = role === "Class Teacher";
  const Icon = isForm ? Badge : Users;

  return (
    <li className={`${tile} flex items-start justify-between gap-3`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-tl-brand" aria-hidden />
          <span className="font-extrabold text-tl-ink">{cls.name}</span>
        </div>
        <p className="mt-1 text-[13px] text-tl-muted">
          Capacity: {cls.classCapacity ?? "—"} students
        </p>
        {cls.classDescription && <p className="mt-1 text-[13px] text-tl-body">{cls.classDescription}</p>}
      </div>
      <Pill tone={isForm ? "success" : "info"}>{role}</Pill>
    </li>
  );
}

/**
 * The muted note shown in a list with nothing in it.
 *
 * @param props - The icon and message.
 * @param props.icon - The icon.
 * @param props.message - The words.
 * @returns The empty note.
 */
function EmptyBox({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-tl-control">
      <EmptyNote compact icon={<Icon />} title={message} />
    </div>
  );
}

/**
 * A small heading over a list inside the assignments card.
 *
 * @param props - The icon and words.
 * @param props.icon - The icon.
 * @param props.children - The words.
 * @returns The heading.
 */
function ListHeading({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-tl-ink">
      <Icon className="h-[18px] w-[18px] text-tl-brand" aria-hidden />
      {children}
    </h3>
  );
}

/**
 * The classes the teacher is assigned to, which of them they are the class
 * teacher of, and their courses.
 *
 * Since A6 class-teacher (register) access comes only from
 * `Class.classTeacherId`, which the profile's `classTeacherOf` reports. The
 * older `classTeacherClasses` merges in the assigned classes, so it cannot say
 * who the class teacher is. Classes the teacher is
 * assigned to without being their class teacher get a hint.
 *
 * @param props - The teacher and the classes they are the class teacher of.
 * @param props.teacher - The teacher's profile.
 * @param props.classTeacherOf - Class ids from `Class.classTeacherId`; omit while unknown.
 * @returns The tab.
 */
export function TeacherAssignmentsTab({
  teacher,
  classTeacherOf,
}: {
  teacher: TeacherById;
  classTeacherOf?: ReadonlySet<string>;
}) {
  const courses = teacher.assignedCourses ?? [];
  // One card per class, whichever list(s) it came in.
  const classes = [
    ...new Map(
      [...(teacher.assignedClasses ?? []), ...(teacher.classTeacherClasses ?? [])].map((cls) => [cls._id, cls]),
    ).values(),
  ];
  const noClasses = classes.length === 0;
  const roleIn = (classId: string): ClassRole => (classTeacherOf?.has(classId) ? "Class Teacher" : "Assigned");
  const classTeacherNames = classes.filter((cls) => classTeacherOf?.has(cls._id)).map((cls) => cls.name);

  /**
   * The class name for a course, falling back to its id. `GET /teachers/:userId`
   * populates a course's `classId` (`{ _id, name, ... }`); other answers send
   * the bare id.
   *
   * @param classId - The course's `classId`, populated or not.
   * @returns The class's name, else its id.
   */
  const classNameFor = (classId: string | Record<string, unknown> | undefined) => {
    if (classId && typeof classId === "object") {
      const id = String(classId._id ?? "");
      const populatedName = typeof classId.name === "string" ? classId.name : "";
      return populatedName || classes.find((cls) => cls._id === id)?.name || id;
    }
    return classes.find((cls) => cls._id === classId)?.name ?? classId;
  };

  return (
    <SectionCard title="Class and Subject Assignments">
      <div className="flex flex-col gap-5">
        <DetailTile
          icon={Badge}
          label="Class Teacher Status"
          value={
            <Pill tone={classTeacherNames.length > 0 ? "success" : "muted"}>
              {classTeacherOf === undefined
                ? "Not reported"
                : classTeacherNames.length > 0
                  ? `Class teacher of ${classTeacherNames.join(", ")}`
                  : "Not a class teacher"}
            </Pill>
          }
          hint={teacher.isFormTeacher ? "Labelled as a form teacher." : undefined}
        />

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          <div className="flex flex-col gap-3">
            <ListHeading icon={Users}>Assigned Classes</ListHeading>
            {noClasses ? (
              <EmptyBox icon={Users} message="No classes assigned" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {classes.map((cls) => (
                  <ClassCard key={cls._id} cls={cls} role={roleIn(cls._id)} />
                ))}
              </ul>
            )}
            {classTeacherOf && (
              <ClassTeacherHint
                assigned={classes.map((cls) => ({ id: cls._id, name: cls.name }))}
                classTeacherOf={classTeacherOf}
                action="Set the class teacher on the class's page or in Edit Profile."
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <ListHeading icon={BookOpen}>Assigned Courses</ListHeading>
            {courses.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {courses.map((course) => (
                  <li key={course._id} className={tile}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0 text-tl-brand" aria-hidden />
                      <span className="font-extrabold text-tl-ink">{course.title}</span>
                    </div>
                    <p className="mt-1 text-[13px] font-bold text-tl-muted">
                      Code: {course.courseCode}
                    </p>
                    {course.description && (
                      <p className="mt-1 text-[13px] text-tl-body">{course.description}</p>
                    )}
                    <p className="mt-1 text-[13px] text-tl-muted">
                      Class: {classNameFor(course.classId)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyBox icon={BookOpen} message="No courses assigned" />
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * The days and hours the teacher is available.
 *
 * @param props - The teacher.
 * @param props.teacher - The teacher's profile.
 * @returns The tab.
 */
export function TeacherAvailabilityTab({ teacher }: { teacher: TeacherById }) {
  const days = teacher.availabilityDays ?? [];

  return (
    <SectionCard title="Teacher Availability" subtitle="Work schedule and teaching hours">
      <div className="flex flex-col gap-3">
        <div className={tile}>
          <div className={`${eyebrow} flex items-center gap-1.5`}>
            <CalendarIcon className="h-3.5 w-3.5" aria-hidden />
            Available Days
          </div>
          {days.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {days.map((day) => (
                <li key={day}>
                  <Pill tone="info">{day}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[15px] text-tl-muted">No specific days specified</p>
          )}
        </div>
        <DetailTile
          icon={Clock}
          label="Available Time"
          value={
            teacher.availableTime ? (
              teacher.availableTime
            ) : (
              <span className="font-medium text-tl-muted">No specific time specified</span>
            )
          }
          hint={teacher.availableTime ? "Working hours" : undefined}
        />
      </div>
    </SectionCard>
  );
}
