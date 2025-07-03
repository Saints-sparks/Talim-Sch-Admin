import React from 'react';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#F8F8F8] p-2">
      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
        </div>

        {/* Title Skeleton */}
        <div className="animate-pulse px-5 py-5">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Overview Cards Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-8 items-start">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-white p-6 shadow rounded-2xl animate-pulse">
              <div className="flex items-center gap-5 pt-5">
                <div className="border-2 rounded-[10px] p-2 border-[#F1F1F1]">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="h-8 bg-gray-200 rounded mb-2 w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
              
              <div className="pt-4 border-b-2 border-[#F1F1F1]"></div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}

          {/* See All Button Skeleton */}
          <div className="col-span-1 md:col-span-3 flex justify-center">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </section>

        {/* Classes Table Skeleton */}
        <div className="px-8">
          <section className="bg-white shadow rounded-[20px] p-6">
            <div className="animate-pulse">
              {/* Table Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>

              {/* Table Structure */}
              <div className="w-full">
                {/* Table Headers */}
                <div className="grid grid-cols-4 gap-4 border-b pb-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>

                {/* Table Rows */}
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-8"></div>
                      <div className="h-8 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardSkeleton;
