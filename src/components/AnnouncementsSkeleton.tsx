import React from 'react';

const AnnouncementsSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header Skeleton */}
            <div className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
            </div>

            {/* Title and Add Button Skeleton */}
            <div className="animate-pulse mb-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
            </div>

            {/* Announcements Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                        {/* Announcement Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>

                        {/* Announcement Content */}
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                        </div>

                        {/* Announcement Footer */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center mt-8">
                <div className="animate-pulse">
                    <div className="flex gap-2">
                        <div className="h-10 bg-gray-200 rounded w-20"></div>
                        <div className="h-10 bg-gray-200 rounded w-10"></div>
                        <div className="h-10 bg-gray-200 rounded w-10"></div>
                        <div className="h-10 bg-gray-200 rounded w-10"></div>
                        <div className="h-10 bg-gray-200 rounded w-20"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsSkeleton;
