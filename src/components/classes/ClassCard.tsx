"use client";

/**
 * One class in the class grid: its grade, course and student counts, and the
 * two ways into it.
 *
 * The edit button is rendered only for an administrator holding
 * `manage:classes`; "Manage Class" is read-only and always available.
 */
import React from "react";
import Image from "next/image";
import { FiBook, FiCalendar, FiClock, FiEdit } from "react-icons/fi";
import { Tooltip } from "@/components/ui/Tooltip";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import type { ClassDetail, ClassStudent } from "@/components/classes/class.model";

/** How many student avatars the card stacks before it stops. */
const AVATAR_LIMIT = 3;

interface ClassCardProps {
  classItem: ClassDetail;
  onOpen: (classId: string) => void;
  onEdit: (classId: string) => void;
}

/** A student's avatar url and first name, however the route populated them. */
function studentIdentity(student: ClassStudent): { avatar: string; firstName: string } {
  const user = typeof student.userId === "object" ? student.userId : undefined;
  return {
    avatar: user?.userAvatar || student.userAvatar || "",
    firstName: user?.firstName || student.firstName || "",
  };
}

/** One labelled row inside the card body. */
function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
        {children}
      </div>
    </div>
  );
}

/**
 * Renders the card.
 *
 * @param props - See {@link ClassCardProps}.
 * @returns The card.
 */
export function ClassCard({ classItem, onOpen, onEdit }: ClassCardProps) {
  const students = classItem.students ?? [];
  const capacity = classItem.classCapacity || "50";
  const enrolled = classItem.studentCount ?? students.length;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-200 dark:border-slate-800 shadow-sm hover:border-[#003366] dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div
        className="px-4 py-3"
        style={{ background: "linear-gradient(to right, #003366, #004488)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg truncate">{classItem.name}</h3>
          <PermissionGate permission={Permission.MANAGE_CLASSES}>
            <Tooltip
              content="Update the class name, grade level, capacity, or description."
              side="top"
            >
              <button
                onClick={() => onEdit(classItem._id)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
                aria-label={`Edit ${classItem.name}`}
              >
                <FiEdit className="w-4 h-4 text-white" />
              </button>
            </Tooltip>
          </PermissionGate>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <CardRow label="Grade Level">
          <FiCalendar className="w-3.5 h-3.5 mr-1.5 text-[#003366] dark:text-blue-300" />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
            {classItem.gradeLevel || "Not set"}
          </span>
        </CardRow>

        <CardRow label="Courses">
          <FiBook className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
            {classItem.courses?.length ?? 0} courses
          </span>
        </CardRow>

        <CardRow label="Students">
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 mr-2">
            {enrolled}/{capacity}
          </span>
          <div className="flex -space-x-2">
            {students.slice(0, AVATAR_LIMIT).map((student, index) => {
              const { avatar, firstName } = studentIdentity(student);
              const key = student._id || `student-${index}`;
              return avatar ? (
                <Image
                  key={key}
                  src={avatar}
                  alt={firstName || "Student"}
                  width={20}
                  height={20}
                  unoptimized
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                />
              ) : (
                <div
                  key={key}
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-[#003366] flex items-center justify-center text-[7px] font-bold text-white"
                >
                  {firstName.charAt(0).toUpperCase() || "?"}
                </div>
              );
            })}
          </div>
        </CardRow>

        <CardRow label="Last Updated">
          <FiClock className="w-3.5 h-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
            {new Date(classItem.updatedAt || Date.now()).toLocaleDateString()}
          </span>
        </CardRow>
      </div>

      <div className="px-4 pb-4">
        <Tooltip
          content="Open class details to manage students, courses, and teacher relationships."
          side="top"
        >
          <button
            onClick={() => onOpen(classItem._id)}
            className="w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:opacity-90"
            style={{ background: "linear-gradient(to right, #003366, #004488)" }}
          >
            Manage Class
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
