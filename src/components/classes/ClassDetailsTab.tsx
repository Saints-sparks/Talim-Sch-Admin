"use client";

/**
 * The "Class Details" tab: the class's own fields and the three counters
 * derived from them.
 */
import React from "react";
import { BookOpen, GraduationCap, Info, User, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { classTeacherName, type ClassDetail } from "@/components/classes/class.model";

interface ClassDetailsTabProps {
  classData: ClassDetail;
}

/** One read-only labelled field. */
function Field({
  label,
  icon,
  value,
  tooltip,
  className = "",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  tooltip?: string;
  className?: string;
}) {
  const labelNode = (
    <label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-2">
      {icon}
      {label}
    </label>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {tooltip ? (
        <Tooltip content={tooltip} side="right">
          {labelNode}
        </Tooltip>
      ) : (
        labelNode
      )}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
        <span className="text-gray-900 dark:text-slate-100">{value}</span>
      </div>
    </div>
  );
}

/** One counter card. */
function Counter({ value, label, icon }: { value: string | number; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{label}</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

/**
 * Renders the details tab.
 *
 * @param props - The class to describe.
 * @returns The tab body.
 */
export function ClassDetailsTab({ classData }: ClassDetailsTabProps) {
  const courseCount = classData.courses?.length ?? 0;
  const hasTeacher = classTeacherName(classData) !== "No teacher assigned";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{classData.name}</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Class information and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Class Name"
          icon={<GraduationCap className="w-4 h-4" />}
          value={classData.name}
        />
        <Field
          label="Grade Level"
          icon={<GraduationCap className="w-4 h-4" />}
          value={classData.gradeLevel || "Not set"}
        />
        <Field
          label="Total Courses"
          icon={<BookOpen className="w-4 h-4" />}
          value={`${courseCount} courses`}
        />
        <Field
          label="Class Capacity"
          icon={<Users className="w-4 h-4" />}
          value={classData.classCapacity || "Not set"}
        />
        <Field
          label="Class Teacher"
          icon={<User className="w-4 h-4" />}
          value={classTeacherName(classData)}
          tooltip="The form teacher responsible for this class. Assign one from the edit page."
        />
        <Field
          label="Class Description"
          icon={<Info className="w-4 h-4" />}
          value={classData.classDescription || "No description available"}
          className="md:col-span-2"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Counter
          value={courseCount}
          label="Total Courses"
          icon={<BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-300" />}
        />
        <Counter
          value={classData.classCapacity || "0"}
          label="Class Capacity"
          icon={<Users className="w-6 h-6 text-[#003366] dark:text-blue-300" />}
        />
        <Counter
          value={hasTeacher ? 1 : 0}
          label="Class Teacher"
          icon={<User className="w-6 h-6 text-[#003366] dark:text-blue-300" />}
        />
      </div>
    </div>
  );
}
