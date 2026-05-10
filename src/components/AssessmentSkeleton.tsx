import React from "react";

const AssessmentSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 animate-pulse">
      {/* Header — matches bg-[#003366] m-6 rounded-2xl */}
      <div className="flex-shrink-0 bg-[#003366] m-6 rounded-2xl opacity-80">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: icon + title + subtitle */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <div className="h-7 w-7 bg-white/30 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-56 bg-white/30 rounded-lg" />
                <div className="h-4 w-40 bg-white/20 rounded-lg" />
              </div>
            </div>
            {/* Right: Create button */}
            <div className="h-10 w-44 bg-white/20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="px-6">
            {/* 4 stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                "bg-[#003366]/10",
                "bg-[#154473]/10",
                "bg-amber-500/10",
                "bg-[#003366]/10",
              ].map((accent, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-3.5 w-28 bg-gray-200 rounded" />
                      <div className="h-8 w-12 bg-gray-200 rounded" />
                    </div>
                    <div className={`p-3 ${accent} rounded-xl`}>
                      <div className="h-6 w-6 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search + filter row */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                <div className="h-9 flex-1 bg-gray-200 rounded-xl" />
                <div className="h-9 w-32 bg-gray-200 rounded-xl" />
                <div className="h-9 w-24 bg-gray-200 rounded-xl" />
              </div>

              {/* Table header */}
              <div className="flex items-center px-6 py-3 border-b border-gray-100 bg-gray-50 gap-4">
                <div className="w-8 h-4 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>

              {/* 8 assessment rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center px-6 py-4 border-b border-gray-50 gap-4"
                >
                  <div className="w-8 h-4 bg-gray-100 rounded" />
                  {/* Name + description */}
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="w-24 h-5 bg-gray-100 rounded-full" />
                  <div className="w-24 h-4 bg-gray-100 rounded" />
                  <div className="w-20 h-4 bg-gray-100 rounded" />
                  <div className="w-20 h-4 bg-gray-100 rounded" />
                  {/* Actions */}
                  <div className="w-24 flex gap-2">
                    <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-8 w-8 bg-gray-200 rounded-lg" />
                  ))}
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
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
