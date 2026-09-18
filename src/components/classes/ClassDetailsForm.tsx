"use client";

/**
 * The "Class Details" form on the class edit screen.
 *
 * Presentational: the page owns the form state and the save, because the same
 * values drive the statistics preview underneath.
 */
import React from "react";
import { BookOpen, Info, User, Users } from "lucide-react";
import {
  GRADE_OPTIONS,
  type ClassFormErrors,
  type ClassPayload,
} from "@/components/classes/class.model";

interface ClassDetailsFormProps {
  form: ClassPayload;
  errors: ClassFormErrors;
  onChange: (field: keyof ClassPayload, value: string) => void;
  /** Read-only figures shown under the form. */
  courseCount: number;
  teacherName: string;
  /** False for a role that may not edit the class; the fields go read-only. */
  canManage: boolean;
}

/**
 * Renders the edit form and its statistics preview.
 *
 * @param props - See {@link ClassDetailsFormProps}.
 * @returns The tab body.
 */
export function ClassDetailsForm({
  form,
  errors,
  onChange,
  courseCount,
  teacherName,
  canManage,
}: ClassDetailsFormProps) {
  const fieldClass =
    "w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2";
  const errorClass = "text-sm text-red-600 dark:text-red-400 mt-1";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center">
          <div className="p-2 bg-[#003366]/10 dark:bg-blue-950/40 rounded-lg mr-3">
            <Info className="w-5 h-5 text-[#003366] dark:text-blue-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            Edit Class Information
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className={labelClass} htmlFor="edit-class-name">
            Class Name *
          </label>
          <input
            id="edit-class-name"
            type="text"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            disabled={!canManage}
            className={fieldClass}
            placeholder="Enter class name (e.g., Grade 1A)"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-class-grade">
            Grade Level *
          </label>
          <select
            id="edit-class-grade"
            value={form.gradeLevel}
            onChange={(event) => onChange("gradeLevel", event.target.value)}
            disabled={!canManage}
            className={fieldClass}
          >
            <option value="">Select grade</option>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          {errors.gradeLevel && <p className={errorClass}>{errors.gradeLevel}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-class-capacity">
            Class Capacity *
          </label>
          <input
            id="edit-class-capacity"
            type="number"
            min="1"
            value={form.classCapacity}
            onChange={(event) => onChange("classCapacity", event.target.value)}
            disabled={!canManage}
            className={fieldClass}
            placeholder="Enter maximum number of students"
          />
          {errors.classCapacity && <p className={errorClass}>{errors.classCapacity}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-class-description">
            Class Description
          </label>
          <textarea
            id="edit-class-description"
            rows={4}
            value={form.classDescription}
            onChange={(event) => onChange("classDescription", event.target.value)}
            disabled={!canManage}
            className={`${fieldClass} resize-none`}
            placeholder="Enter class description (optional)"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">
            Current Class Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#003366] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-200">Total Courses</p>
                  <p className="text-2xl font-bold text-white">{courseCount}</p>
                  <p className="text-sm text-blue-200">assigned</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-200 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-900/50">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#003366] dark:text-blue-300">Capacity</p>
                  <p className="text-2xl font-bold text-[#003366] dark:text-blue-200">
                    {form.classCapacity || "0"}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">students</p>
                </div>
                <Users className="w-8 h-8 text-[#003366] dark:text-blue-300 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-[#003366]/5 dark:bg-slate-800 rounded-lg p-6 border border-[#003366]/20 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#003366] dark:text-blue-300">
                    Class Teacher
                  </p>
                  <p className="text-lg font-bold text-[#003366] dark:text-blue-200 truncate">
                    {teacherName}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">assigned</p>
                </div>
                <User className="w-8 h-8 text-[#003366] dark:text-blue-300 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
