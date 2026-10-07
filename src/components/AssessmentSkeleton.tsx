import React from "react";

/**
 * The assessments screen's loading state.
 *
 * Mirrors the real screen — banner, four counters, filter bar and card grid —
 * so nothing shifts when the data lands.
 *
 * @returns The skeleton.
 */
const AssessmentSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-tl-bg animate-pulse">
      {/* Header — matches bg-tl-brand-fill m-6 rounded-2xl */}
      <div className="flex-shrink-0 bg-tl-brand-fill m-6 rounded-2xl opacity-80">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: icon + title + subtitle */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-tl-surface rounded-xl">
                <div className="h-7 w-7 bg-tl-surface rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-56 bg-tl-surface rounded-lg" />
                <div className="h-4 w-40 bg-tl-surface rounded-lg" />
              </div>
            </div>
            {/* Right: Create button */}
            <div className="h-10 w-44 bg-tl-surface rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="px-6">
            {/* 4 stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {["bg-tl-select", "bg-tl-select", "bg-tl-warning-bg", "bg-tl-select"].map(
                (accent, i) => (
                  <div
                    key={i}
                    className="bg-tl-surface rounded-2xl shadow-sm border border-tl-line-soft p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-3.5 w-28 bg-tl-line rounded" />
                        <div className="h-8 w-12 bg-tl-line rounded" />
                      </div>
                      <div className={`p-3 ${accent} rounded-xl`}>
                        <div className="h-6 w-6 bg-tl-line rounded" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Search + filter row */}
            <div className="bg-tl-surface rounded-2xl shadow-sm border border-tl-line-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-tl-line-soft flex items-center gap-4">
                <div className="h-9 flex-1 bg-tl-line rounded-xl" />
                <div className="h-9 w-32 bg-tl-line rounded-xl" />
                <div className="h-9 w-24 bg-tl-line rounded-xl" />
              </div>

              {/* Table header */}
              <div className="flex items-center px-6 py-3 border-b border-tl-line-soft bg-tl-subtle gap-4">
                <div className="w-8 h-4 bg-tl-line rounded" />
                <div className="flex-1 h-4 bg-tl-line rounded" />
                <div className="w-24 h-4 bg-tl-line rounded" />
                <div className="w-24 h-4 bg-tl-line rounded" />
                <div className="w-20 h-4 bg-tl-line rounded" />
                <div className="w-20 h-4 bg-tl-line rounded" />
                <div className="w-24 h-4 bg-tl-line rounded" />
              </div>

              {/* 8 assessment rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center px-6 py-4 border-b border-tl-line-soft gap-4"
                >
                  <div className="w-8 h-4 bg-tl-track rounded" />
                  {/* Name + description */}
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-tl-line rounded w-3/4" />
                    <div className="h-3 bg-tl-track rounded w-1/2" />
                  </div>
                  <div className="w-24 h-5 bg-tl-track rounded-full" />
                  <div className="w-24 h-4 bg-tl-track rounded" />
                  <div className="w-20 h-4 bg-tl-track rounded" />
                  <div className="w-20 h-4 bg-tl-track rounded" />
                  {/* Actions */}
                  <div className="w-24 flex gap-2">
                    <div className="h-8 w-8 bg-tl-track rounded-lg" />
                    <div className="h-8 w-8 bg-tl-track rounded-lg" />
                    <div className="h-8 w-8 bg-tl-track rounded-lg" />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="h-4 w-40 bg-tl-line rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-tl-line rounded-lg" />
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-8 w-8 bg-tl-line rounded-lg" />
                  ))}
                  <div className="h-8 w-20 bg-tl-line rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSkeleton;
