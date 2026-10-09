"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Pill, card, focusRing, iconButton, rowButton } from "@/components/tl";
import { Tooltip } from "@/components/ui/Tooltip";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import type { Teacher } from "@/app/services/teacher.service";

/** The teacher fields the card shows, whichever shape the API populated. */
export interface TeacherCardFields {
  firstName: string;
  lastName: string;
  staffNumber: string;
  avatar: string;
}

/**
 * Reads a teacher's display fields from either the account or the profile.
 *
 * @param teacher - The roster row.
 * @returns Name, staff number and photo.
 */
export function teacherFields(teacher: Teacher): TeacherCardFields {
  const user = typeof teacher.userId === "object" ? teacher.userId : null;
  return {
    firstName: user?.firstName || teacher.firstName || "",
    lastName: user?.lastName || teacher.lastName || "",
    staffNumber: teacher.staffNumber || "",
    avatar: teacher.userAvatar || user?.userAvatar || "",
  };
}

/** Props for {@link TeacherRosterCard}. */
interface TeacherRosterCardProps {
  /** The teacher to show. */
  teacher: Teacher;
  /** True when this card's action menu is open. */
  menuOpen: boolean;
  /** Opens or closes this card's action menu. */
  onToggleMenu: (teacherId: string) => void;
  /** The teacher's profile page (a link, so it opens before the page has hydrated, and in a new tab). */
  profileHref: string;
  /** Opens the teacher editor. */
  onEdit: (teacher: Teacher) => void;
  /** Deactivates the teacher. */
  onDeactivate: (teacher: Teacher) => void;
}

/** One item of the card's action menu. */
const menuItem = `flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/**
 * One card in the teachers grid: avatar, name, staff number, a class and the
 * status pill, View Profile, and (for admins who manage teachers) the ⋮ menu
 * with Edit and Deactivate.
 *
 * @param props - See {@link TeacherRosterCardProps}.
 * @param props.teacher - The teacher.
 * @param props.menuOpen - Whether the menu is open.
 * @param props.onToggleMenu - Opens or closes the menu.
 * @param props.profileHref - The profile page.
 * @param props.onEdit - Opens the editor.
 * @param props.onDeactivate - Deactivates the teacher.
 * @returns The card.
 */
export function TeacherRosterCard({
  teacher,
  menuOpen,
  onToggleMenu,
  profileHref,
  onEdit,
  onDeactivate,
}: TeacherRosterCardProps) {
  const { firstName, lastName, staffNumber, avatar } = teacherFields(teacher);
  const assignedClasses = teacher.assignedClasses ?? [];
  const name = `${firstName} ${lastName}`.trim();

  return (
    <article
      aria-label={name || undefined}
      className={`${card} relative flex flex-col items-center text-center`}
    >
      <PermissionGate permission={Permission.MANAGE_TEACHERS}>
        <button
          type="button"
          className={`${iconButton} absolute right-2.5 top-2.5`}
          onClick={() => onToggleMenu(teacher._id)}
          aria-label={`Actions for ${firstName} ${lastName}`.trim()}
          aria-expanded={menuOpen}
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </button>
        {menuOpen && (
          <div className="absolute right-2.5 top-14 z-10 w-40 rounded-2xl border border-tl-line bg-tl-surface p-1.5 text-left shadow-[0_14px_30px_-12px_rgba(15,27,46,0.25)]">
            <button
              type="button"
              className={`${menuItem} text-tl-ink hover:bg-tl-bg`}
              onClick={() => onEdit(teacher)}
            >
              Edit
            </button>
            <Tooltip
              content="Prevents the teacher from logging in. Their records and history are retained."
              side="top"
            >
              <button
                type="button"
                className={`${menuItem} text-tl-danger hover:bg-tl-danger-bg`}
                onClick={() => onDeactivate(teacher)}
                disabled={!teacher.isActive}
              >
                Deactivate
              </button>
            </Tooltip>
          </div>
        )}
      </PermissionGate>

      <Avatar
        src={avatar}
        firstName={firstName}
        lastName={lastName}
        className="h-[72px] w-[72px] text-xl"
      />

      <div className="mt-3 flex w-full flex-1 flex-col items-center">
        <h2 className="break-words text-base font-extrabold text-tl-ink">
          {firstName} {lastName}
        </h2>
        <p className="mt-1 text-[13px] font-bold text-tl-muted">
          Staff No. {staffNumber || "Not assigned"}
        </p>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {assignedClasses.slice(0, 1).map((cls) => (
            <Tooltip
              key={cls._id ?? cls.name}
              content="Classes this teacher is currently assigned to. Manage assignments in the teacher's profile."
              side="top"
            >
              <span className="inline-flex">
                <Pill tone="info">{cls.name}</Pill>
              </span>
            </Tooltip>
          ))}
          <Pill tone={teacher.isActive ? "success" : "muted"} dot>
            {teacher.isActive ? "Active" : "Inactive"}
          </Pill>
        </div>
        {!teacher.hasTeacherProfile && (
          <p className="mt-2.5 text-[13px] font-bold text-tl-warning">Profile setup pending</p>
        )}
        <div className="mt-auto w-full pt-4">
          <Link href={profileHref} className={`${rowButton} w-full`}>
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}

export default TeacherRosterCard;
