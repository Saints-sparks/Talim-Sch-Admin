"use client";

/**
 * The "Subjects Overview" grid on the curriculum dashboard's Structure tab.
 *
 * Read-only: the card opens the subject, and the "create your first subject"
 * call to action is gated on `manage:curriculum`.
 */
import React from "react";
import { BookOpen, GraduationCap, Plus } from "lucide-react";
import type { Subject } from "@/app/services/subjects.service";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/apiError";

interface SubjectsOverviewProps {
  subjects: Subject[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  /** True when the empty grid is the result of a search rather than no data. */
  isFiltered: boolean;
  onOpenSubject: (subjectId: string) => void;
  onAddSubject: () => void;
}

/**
 * Renders the subject grid.
 *
 * @param props - The subjects to show plus query and filter state.
 * @returns The panel.
 */
export function SubjectsOverview({
  subjects,
  isLoading,
  error,
  onRetry,
  isFiltered,
  onOpenSubject,
  onAddSubject,
}: SubjectsOverviewProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Subjects Overview
        </h2>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="h-36 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-700 dark:text-red-300">
              {getErrorMessage(error, "Could not load subjects.")}
            </p>
            <button
              onClick={onRetry}
              className="mt-4 px-5 py-2 rounded-xl bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : subjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <button
                key={subject._id}
                type="button"
                onClick={() => onOpenSubject(subject._id)}
                className="group text-left border-2 border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg">
                    {subject.code}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  {subject.name}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400">
                  <GraduationCap className="w-4 h-4 mr-1.5" />
                  {subject.courseCount ?? subject.courses?.length ?? 0} courses
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              {isFiltered ? "No subjects found" : "No subjects created yet"}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {isFiltered
                ? "Try adjusting your search criteria to find what you're looking for."
                : "Get started by creating your first subject to organize your curriculum."}
            </p>
            {!isFiltered && (
              <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
                <button
                  onClick={onAddSubject}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create Your First Subject
                </button>
              </PermissionGate>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
