import React from 'react';

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

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 h-4 bg-gray-300 rounded"></div>
            <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
            <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
            <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
            <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
            <div className="col-span-1 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <div key={row} className="border-b border-gray-200 p-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Student Info */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>

              {/* Other columns */}
              <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-300 rounded"></div>
              <div className="col-span-1 flex gap-2">
                <div className="h-8 bg-gray-300 rounded w-16"></div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
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
