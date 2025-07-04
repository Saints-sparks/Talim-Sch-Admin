import React from "react"

const TeachersSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>

            <div className="pt-4">
                {/* Top section with title and search */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-x-4">
                        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded w-full md:w-48 animate-pulse"></div>
                    </div>
                </div>

                {/* Teachers Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, index) => (
                        <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-[10px] shadow-sm bg-white h-[218px] relative"
                        >
                            {/* Avatar skeleton */}
                            <div className="w-16 h-16 rounded-full mx-auto mb-2 bg-gray-200 animate-pulse"></div>

                            {/* Name skeleton */}
                            <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse"></div>

                            {/* Email and role skeleton */}
                            <div className="h-4 bg-gray-200 rounded w-40 mx-auto mb-4 animate-pulse"></div>

                            {/* Button skeleton */}
                            <div className="h-8 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>

                            {/* Menu dots skeleton */}
                            <div className="absolute top-4 right-4">
                                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="flex items-center gap-x-2">
                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TeachersSkeleton
