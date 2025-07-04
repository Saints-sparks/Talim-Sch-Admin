import React from 'react';

const ClassesSkeleton: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <main className="flex-grow p-8">
                {/* Header Skeleton */}
                <div className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
                </div>

                {/* Title Skeleton */}
                <div className="animate-pulse px-5 py-5">
                    <div className="h-8 bg-gray-200 rounded w-64"></div>
                </div>

                {/* Classes Table Skeleton */}
                <section className="bg-white shadow rounded p-6">
                    <div className="animate-pulse">
                        {/* Table Header */}
                        <div className="flex items-center gap-x-4 mb-4">
                            <div className="h-8 bg-gray-200 rounded w-32"></div>
                            <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>

                        {/* Table Structure */}
                        <div className="w-full">
                            {/* Table Headers */}
                            <div className="flex border-b pb-2 mb-4">
                                <div className="flex-1 px-4">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="flex-1 px-4">
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </div>
                                <div className="flex-1 px-4">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                </div>
                                <div className="flex-1 px-4">
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>

                            {/* Table Rows */}
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                                <div key={row} className="flex border-b py-3">
                                    <div className="flex-1 px-4">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </div>
                                    <div className="flex-1 px-4">
                                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                                    </div>
                                    <div className="flex-1 px-4">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    </div>
                                    <div className="flex-1 px-4">
                                        <div className="flex gap-2">
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                            <div className="h-8 bg-gray-200 rounded w-8"></div>
                                            <div className="h-8 bg-gray-200 rounded w-8"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Skeleton */}
                        <div className="flex justify-between items-center mt-4">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                                <div className="h-8 bg-gray-200 rounded w-8"></div>
                                <div className="h-8 bg-gray-200 rounded w-8"></div>
                                <div className="h-8 bg-gray-200 rounded w-8"></div>
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ClassesSkeleton;
