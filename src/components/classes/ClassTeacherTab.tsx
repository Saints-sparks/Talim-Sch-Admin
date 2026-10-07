"use client";

/**
 * The "Class Teacher" tab on the class detail screen: who the form teacher is,
 * or the way to assign one.
 *
 * The "Assign Teacher" call to action is gated on `manage:classes` — assigning
 * a class teacher grants them grading and attendance access to the class, so a
 * role that cannot do it is not offered the button.
 */
import React from "react";
import { BadgeCheck, GraduationCap, Mail, User, UserPlus } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Avatar, CardHeader, EmptyNote, Pill, card, primaryButton } from "@/components/tl";
import { ClassInfoTile } from "@/components/classes/ClassInfoTile";
import { Permission } from "@/lib/permissions";
import {
  classTeacherEmail,
  classTeacherName,
  classTeacherRecord,
  classTeacherUser,
  type ClassDetail,
} from "@/components/classes/class.model";

/** Props for {@link ClassTeacherTab}. */
interface ClassTeacherTabProps {
  /** The class. */
  classData: ClassDetail;
  /** Opens the screen where a teacher is assigned. */
  onAssignTeacher: () => void;
}

/**
 * Renders the class teacher tab.
 *
 * @param props - See {@link ClassTeacherTabProps}.
 * @param props.classData - The class.
 * @param props.onAssignTeacher - Opens the assign screen.
 * @returns The tab body.
 */
export function ClassTeacherTab({ classData, onAssignTeacher }: ClassTeacherTabProps) {
  const teacher = classTeacherRecord(classData);
  const user = classTeacherUser(classData);
  const name = classTeacherName(classData);

  return (
    <section className={card}>
      <CardHeader
        title="Class Teacher Information"
        subtitle="The class teacher takes this class's morning register. Teachers who are only assigned to the class, or who teach its courses, cannot."
      />

      {user ? (
        <div className="mt-[18px] flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-tl-line-soft bg-tl-subtle p-4">
            <Avatar id={teacher?._id || name} name={name} size={64} />
            <div className="min-w-0">
              <h3 className="break-words text-[19px] font-extrabold tracking-[-0.3px] text-tl-ink">
                {name}
              </h3>
              <p className="mt-0.5 text-sm text-tl-muted">
                {teacher?.isFormTeacher ? "Form Teacher" : "Class Teacher"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ClassInfoTile label="First Name" icon={<User />} value={user.firstName || "Not set"} />
            <ClassInfoTile label="Last Name" icon={<User />} value={user.lastName || "Not set"} />
            <ClassInfoTile
              label="Email"
              icon={<Mail />}
              value={<span className="break-all">{classTeacherEmail(classData) || "Not set"}</span>}
            />
            {teacher?.specialization && (
              <ClassInfoTile
                label="Specialization"
                icon={<GraduationCap />}
                value={teacher.specialization}
              />
            )}
            <ClassInfoTile
              label="Form Teacher Status"
              icon={<BadgeCheck />}
              value={
                <Pill tone={teacher?.isFormTeacher ? "success" : "muted"}>
                  {teacher?.isFormTeacher ? "Yes" : "No"}
                </Pill>
              }
            />
          </div>
        </div>
      ) : (
        <EmptyNote
          icon={<User />}
          title="No teacher assigned"
          action={
            <PermissionGate permission={Permission.MANAGE_CLASSES}>
              <button type="button" onClick={onAssignTeacher} className={primaryButton}>
                <UserPlus className="h-4 w-4" aria-hidden />
                Assign Teacher
              </button>
            </PermissionGate>
          }
        >
          A teacher can be assigned through the edit page.
        </EmptyNote>
      )}
    </section>
  );
}
