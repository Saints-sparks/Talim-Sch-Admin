"use client";

import React from "react";

/**
 * The student profile and editor while they load — the same frame the real
 * page uses, so nothing jumps when the data lands.
 */
export function StudentProfileSkeleton() {
  return (
    <div className="min-h-screen bg-tl-subtle">
      <div className="w-full bg-tl-surface shadow-sm">
        <div className="h-16 bg-tl-track animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-tl-surface border-b border-tl-line">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-tl-line rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-tl-line rounded animate-pulse" />
                <div className="h-4 w-32 bg-tl-line rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="border-b border-tl-line px-6 py-4">
            <div className="flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-24 bg-tl-line rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="h-8 w-48 bg-tl-line rounded animate-pulse" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 bg-tl-line rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-tl-line rounded-full animate-pulse" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 bg-tl-line rounded animate-pulse" />
                      <div className="h-10 bg-tl-track border border-tl-line rounded-md animate-pulse" />
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
    <div className="min-h-screen bg-tl-subtle p-6">
      <div className="max-w-md mx-auto mt-32">
        <div className="bg-tl-surface rounded-lg shadow-sm border border-tl-danger/30 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-tl-danger-bg rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-tl-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-tl-ink mb-2">{title}</h3>
          <p className="text-tl-danger mb-6">{message}</p>
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 border border-tl-line text-tl-body rounded-lg hover:bg-tl-bg transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2 bg-tl-brand-fill text-white rounded-lg hover:bg-tl-brand-fill-hover transition-colors"
            >
              Back to Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
