import React from "react";

const LeaveRequestSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-80"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-300 rounded w-32"></div>
          <div className="h-10 bg-gray-300 rounded w-24"></div>
        </div>
      </div>

      {/* Filter Buttons Skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-10 bg-gray-300 rounded-full w-20"></div>
        ))}
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((card) => (
          <div key={card} className="bg-white shadow-md rounded-lg p-4">
            {/* Student Info */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="h-5 bg-gray-300 rounded-full w-16"></div>
            </div>

            {/* Request Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-300 rounded w-20"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-300 rounded w-12"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-300 rounded w-20"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <div className="h-3 bg-gray-300 rounded w-18"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>

            {/* Quick Actions (for some cards) */}
            {card <= 3 && (
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <div className="h-8 bg-gray-300 rounded w-20"></div>
                <div className="h-8 bg-gray-300 rounded w-20"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-between items-center mt-6">
        <div className="h-4 bg-gray-300 rounded w-32"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-300 rounded w-20"></div>
          <div className="h-10 bg-gray-300 rounded w-16"></div>
          <div className="h-10 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestSkeleton;
