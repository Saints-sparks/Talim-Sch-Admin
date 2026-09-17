"use client";

import React from "react";
import { ChevronLeft, User } from "lucide-react";

/** The teacher profile while it loads — the same frame the loaded page uses. */
export function TeacherProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md mx-8">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse" />
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4">
            <div className="flex space-x-8">
              {[1, 2, 3, 4, 5].map((i) => (
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

interface TeacherProfileErrorProps {
  /** Heading for the panel. */
  title: string;
  /** What went wrong, in the user's words. */
  message: string;
  /** True for "not found", which changes the icon from an alert to a person. */
  notFound?: boolean;
  /** Goes back to the roster. */
  onBack: () => void;
  /** Retries the request, when retrying could help. */
  onRetry?: () => void;
}

/** A full-page failure for the teacher profile and editor. */
export function TeacherProfileError({
  title,
  message,
  notFound = false,
  onBack,
  onRetry,
}: TeacherProfileErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-md mx-auto mt-32">
        <div
          className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-8 text-center ${
            notFound ? "border-gray-200 dark:border-slate-700" : "border-red-200 dark:border-red-900/40"
          }`}
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              notFound ? "bg-gray-100 dark:bg-slate-700" : "bg-red-100 dark:bg-red-900/30"
            }`}
          >
            {notFound ? (
              <User className="w-8 h-8 text-gray-400" />
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className={`mb-6 ${notFound ? "text-gray-600 dark:text-slate-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </p>
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Teachers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
