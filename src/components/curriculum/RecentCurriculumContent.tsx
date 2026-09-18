"use client";

/**
 * The "Recent Curriculum Content" panel: the five newest entries teachers have
 * published, with its own loading, error and empty states so a failed request
 * never leaves the dashboard half-drawn.
 */
import React from "react";
import { Book, FileText, TrendingUp } from "lucide-react";
import type { CurriculumContent } from "@/app/services/subjects.service";
import {
  contentTeacherDisplay,
  courseDisplay,
  termDisplay,
} from "@/components/curriculum/curriculum.presentation";
import { getErrorMessage } from "@/lib/apiError";

interface RecentCurriculumContentProps {
  entries: CurriculumContent[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

/**
 * Renders the panel.
 *
 * @param props - The entries (already sorted newest first) and query state.
 * @returns The panel.
 */
export function RecentCurriculumContent({
  entries,
  isLoading,
  error,
  onRetry,
}: RecentCurriculumContentProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Recent Curriculum Content
        </h2>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-20 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-700 dark:text-red-300">
              {getErrorMessage(error, "Could not load curriculum content.")}
            </p>
            <button
              onClick={onRetry}
              className="mt-4 px-5 py-2 rounded-xl bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((content) => (
              <div
                key={content._id}
                className="group flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex-shrink-0">
                    <Book className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {courseDisplay(content.course)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-1 truncate">
                      {termDisplay(content.term)} • {contentTeacherDisplay(content)}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex-shrink-0">
                  {new Date(content.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              No curriculum content yet
            </h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Start creating curriculum content to see them appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
