"use client";

/**
 * Shown when an assessment cannot be deactivated because grades already exist
 * for it.
 *
 * The server answers `CONFLICT` with the courses that block the change; naming
 * the teachers who have already graded is the only way the administrator can
 * act on it.
 */
import React from "react";
import { FiAlertTriangle, FiUsers } from "react-icons/fi";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { GradedCourseInfo } from "@/app/services/assessment.service";

interface AssessmentGradesConflictModalProps {
  isOpen: boolean;
  assessmentName: string;
  courses: GradedCourseInfo[];
  onClose: () => void;
}

/**
 * Renders the conflict modal, or nothing when closed.
 *
 * @param props - See {@link AssessmentGradesConflictModalProps}.
 * @returns The modal.
 */
export function AssessmentGradesConflictModal({
  isOpen,
  assessmentName,
  courses,
  onClose,
}: AssessmentGradesConflictModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cannot deactivate assessment"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
              <FiAlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Cannot Deactivate Assessment
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
                Grades have already been recorded
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-6">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <span className="font-semibold">&ldquo;{assessmentName}&rdquo;</span> cannot be
              deactivated because the following courses already have grades recorded against it.
              Deactivating would cause those grades to disappear from reports.
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
              Courses with recorded grades:
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {courses.map((item, index) => (
                <div
                  key={`${item.courseName}-${item.teacherEmail || index}`}
                  className="flex items-start gap-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#003366] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiUsers className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {item.courseName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                      {item.teacherName}
                      {item.teacherEmail && (
                        <span className="text-gray-400 dark:text-slate-500">
                          {" "}
                          &middot; {item.teacherEmail}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#154473] transition-all duration-300 shadow-lg"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
