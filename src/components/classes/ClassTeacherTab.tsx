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
import { Badge, GraduationCap, Mail, User } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import {
  classTeacherEmail,
  classTeacherName,
  classTeacherRecord,
  classTeacherUser,
  type ClassDetail,
} from "@/components/classes/class.model";

interface ClassTeacherTabProps {
  classData: ClassDetail;
  onAssignTeacher: () => void;
}

/** One read-only labelled field. */
function Field({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
        <span className="text-gray-900 dark:text-slate-100 break-all">{value}</span>
      </div>
    </div>
  );
}

/**
 * Renders the class teacher tab.
 *
 * @param props - See {@link ClassTeacherTabProps}.
 * @returns The tab body.
 */
export function ClassTeacherTab({ classData, onAssignTeacher }: ClassTeacherTabProps) {
  const teacher = classTeacherRecord(classData);
  const user = classTeacherUser(classData);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Class Teacher Information
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Teacher assigned to this class</p>
      </div>

      {user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">
              {initials || <User className="w-8 h-8" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                {classTeacherName(classData)}
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mt-1">
                {teacher?.isFormTeacher ? "Form Teacher" : "Class Teacher"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="First Name"
              icon={<User className="w-4 h-4" />}
              value={user.firstName || "Not set"}
            />
            <Field
              label="Last Name"
              icon={<User className="w-4 h-4" />}
              value={user.lastName || "Not set"}
            />
            <Field
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              value={classTeacherEmail(classData) || "Not set"}
            />
            {teacher?.specialization && (
              <Field
                label="Specialization"
                icon={<GraduationCap className="w-4 h-4" />}
                value={teacher.specialization}
              />
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-2">
                <Badge className="w-4 h-4" />
                Form Teacher Status
              </label>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    teacher?.isFormTeacher
                      ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200"
                  }`}
                >
                  {teacher?.isFormTeacher ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <User className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
            No teacher assigned
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            A teacher can be assigned through the edit page.
          </p>
          <PermissionGate permission={Permission.MANAGE_CLASSES}>
            <button
              onClick={onAssignTeacher}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] text-sm font-medium"
            >
              Assign Teacher
            </button>
          </PermissionGate>
        </div>
      )}
    </div>
  );
}
