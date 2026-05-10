import React from "react";

const CurriculumSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-pulse">
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
                <div className="h-4 w-44 bg-white/20 rounded-lg" />
              </div>
            </div>
            {/* Right: Manage Structure button */}
            <div className="h-10 w-40 bg-white/20 rounded-xl" />
          </div>

          {/* Search bar */}
          <div className="mt-6">
            <div className="h-12 max-w-md bg-white/20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="px-6">
            {/* 4 KPI stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                "bg-[#003366]/10",
                "bg-emerald-500/10",
                "bg-amber-500/10",
                "bg-purple-500/10",
              ].map((accent, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-3.5 w-24 bg-gray-200 rounded" />
                      <div className="h-8 w-12 bg-gray-200 rounded" />
                    </div>
                    <div className={`p-3 ${accent} rounded-xl`}>
                      <div className="h-6 w-6 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <div className="h-10 w-28 bg-gray-200 rounded-xl" />
                <div className="h-10 w-28 bg-gray-100 rounded-xl" />
              </div>
            </div>

            {/* Quick Actions card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              {/* Section title */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-5 w-32 bg-gray-200 rounded" />
              </div>
              {/* 3 action buttons */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-200 rounded-xl h-12 w-12" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className="h-5 w-5 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Curriculum Content card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              {/* Section title */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-5 w-44 bg-gray-200 rounded" />
              </div>
              {/* 5 content rows */}
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gray-200 rounded-xl h-11 w-11 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-7 w-24 bg-gray-100 rounded-lg flex-shrink-0 ml-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumSkeleton;
