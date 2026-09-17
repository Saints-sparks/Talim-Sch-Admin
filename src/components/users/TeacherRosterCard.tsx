"use client";

import React from "react";
import Avatar from "@/components/Avatar";
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

/** Reads a teacher's display fields from either the account or the profile. */
export function teacherFields(teacher: Teacher): TeacherCardFields {
  const user = typeof teacher.userId === "object" ? teacher.userId : null;
  return {
    firstName: user?.firstName || teacher.firstName || "",
    lastName: user?.lastName || teacher.lastName || "",
    staffNumber: teacher.staffNumber || "",
    avatar: teacher.userAvatar || user?.userAvatar || "",
  };
}

interface TeacherRosterCardProps {
  /** The teacher to show. */
  teacher: Teacher;
  /** True when this card's action menu is open. */
  menuOpen: boolean;
  /** Opens or closes this card's action menu. */
  onToggleMenu: (teacherId: string) => void;
  /** Opens the teacher's profile. */
  onViewProfile: (teacher: Teacher) => void;
  /** Opens the teacher editor. */
  onEdit: (teacher: Teacher) => void;
  /** Deactivates the teacher. */
  onDeactivate: (teacher: Teacher) => void;
}

/** One card in the teachers grid. */
export function TeacherRosterCard({
  teacher,
  menuOpen,
  onToggleMenu,
  onViewProfile,
  onEdit,
  onDeactivate,
}: TeacherRosterCardProps) {
  const { firstName, lastName, staffNumber, avatar } = teacherFields(teacher);
  const assignedClasses = teacher.assignedClasses ?? [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center relative group transition-shadow hover:shadow-lg">
      <PermissionGate permission={Permission.MANAGE_TEACHERS}>
        <button
          className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1"
          onClick={() => onToggleMenu(teacher._id)}
          aria-label={`Actions for ${firstName} ${lastName}`.trim()}
          aria-expanded={menuOpen}
        >
          <span className="text-xl font-bold">⋮</span>
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-12 w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
            <button
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-t-lg"
              onClick={() => onEdit(teacher)}
            >
              Edit
            </button>
            <Tooltip
              content="Prevents the teacher from logging in. Their records and history are retained."
              side="top"
            >
              <button
                className="block w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-b-lg disabled:opacity-50"
                onClick={() => onDeactivate(teacher)}
                disabled={!teacher.isActive}
              >
                Deactivate
              </button>
            </Tooltip>
          </div>
        )}
      </PermissionGate>

      <Avatar src={avatar} firstName={firstName} lastName={lastName} className="w-16 h-16 mb-3" />

      <div className="text-center flex flex-col items-center flex-1 w-full">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
          {firstName} {lastName}
        </h3>
        <p className="text-xs font-medium text-[#154473] dark:text-blue-400 mb-2">
          Staff No. {staffNumber || "Not assigned"}
        </p>
        <div className="flex gap-2 mb-3">
          {assignedClasses.slice(0, 1).map((cls) => (
            <Tooltip
              key={cls._id ?? cls.name}
              content="Classes this teacher is currently assigned to. Manage assignments in the teacher's profile."
              side="top"
            >
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-medium px-2 py-1 rounded">
                {cls.name}
              </span>
            </Tooltip>
          ))}
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              teacher.isActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            {teacher.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {!teacher.hasTeacherProfile && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">Profile setup pending</p>
        )}
        <button
          onClick={() => onViewProfile(teacher)}
          className="w-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-100 font-medium rounded-lg py-2 mt-auto transition"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

export default TeacherRosterCard;
