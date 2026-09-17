"use client";

import React from "react";

/**
 * The student profile and editor while they load — the same frame the real
 * page uses, so nothing jumps when the data lands.
 */
export function StudentProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="w-full bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-16 bg-gray-100 dark:bg-slate-700 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4">
            <div className="flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-10 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StudentProfileErrorProps {
  /** Heading for the panel. */
  title: string;
  /** What went wrong, in the user's words. */
  message: string;
  /** Goes back to the roster. */
  onBack: () => void;
  /** Retries the request, when retrying could help. */
  onRetry?: () => void;
}

/** A full-page failure for the student profile and editor. */
export function StudentProfileError({ title, message, onBack, onRetry }: StudentProfileErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-md mx-auto mt-32">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-red-200 dark:border-red-900/40 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{message}</p>
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
