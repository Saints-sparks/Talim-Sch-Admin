"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useRouter } from "next/navigation";
import { getLeaveRequests, updateLeaveRequestStatus } from "../services/leave.service";
import { toast } from 'react-toastify';
import LeaveRequestSkeleton from "@/components/LeaveRequestSkeleton";

// Updated interface to match your actual API response
interface ApiLeaveRequest {
    _id: string;
    child: string;
    classTeacher: string;
    createdAt: string;
    endDate: string;
    leaveType: string;
    reason: string;
    startDate: string;
    status: string;
    studentProfile: {
        _id: string;
        userId: string;
    };
    studentUser: {
        _id: string;
        userId: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
    term: string;
    updatedAt: string;
    viewed: boolean;
    attachments: string[];
    __v: number;
}

// Type definition for transformed leave request to match your UI
interface TransformedLeaveRequest {
    id: string;
    studentName: string;
    studentImage?: string;
    grade: string;
    parent: string;
    startDate: string;
    endDate: string;
    description: string;
    status: "pending" | "approved" | "rejected";
    submittedDate: string;
    leaveType: string;
    attachments?: string[];
    viewed: boolean;
    originalData: ApiLeaveRequest;
}

const AdminLeaveRequestsPage: React.FC = () => {
    const router = useRouter();
    const [leaveRequests, setLeaveRequests] = useState<TransformedLeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch all leave requests for school admin
    useEffect(() => {
        const fetchLeaveRequests = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await getLeaveRequests(currentPage, 10);

                let apiData: ApiLeaveRequest[];

                if (Array.isArray(response)) {
                    apiData = response as unknown as ApiLeaveRequest[];
                } else if (response && Array.isArray(response.data)) {
                    apiData = response.data as unknown as ApiLeaveRequest[];
                } else {
                    throw new Error("Invalid API response format");
                }

                const transformedData = transformApiResponse(apiData);
                setLeaveRequests(transformedData);
                setTotalPages(1);

            } catch (err) {
                console.error("Error fetching leave requests:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch leave requests");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveRequests();
    }, [currentPage]);

    // Transform API response to match your UI interface
    const transformApiResponse = (data: ApiLeaveRequest[]): TransformedLeaveRequest[] => {
        return data.map(item => ({
            id: item._id,
            studentName: getStudentName(item.studentUser),
            studentImage: "/img/default-avatar.png",
            grade: item.leaveType,
            parent: "Unknown Parent",
            startDate: new Date(item.startDate).toLocaleDateString(),
            endDate: new Date(item.endDate).toLocaleDateString(),
            description: item.reason || "",
            status: item.status.toLowerCase() as "pending" | "approved" | "rejected",
            submittedDate: new Date(item.createdAt).toLocaleDateString(),
            leaveType: item.leaveType,
            attachments: item.attachments || [],
            viewed: item.viewed || false,
            originalData: item
        }));
    };

    // Helper function to get student name
    const getStudentName = (studentUser: ApiLeaveRequest['studentUser']): string => {
        if (studentUser.firstName && studentUser.lastName) {
            return `${studentUser.firstName} ${studentUser.lastName}`;
        }
        if (studentUser.firstName) {
            return studentUser.firstName;
        }
        if (studentUser.email) {
            return studentUser.email.split('@')[0];
        }
        return "Unknown Student";
    };

    // Handle status update using your service
    const handleQuickAction = async (requestId: string, newStatus: "approved" | "rejected") => {
        try {
            const apiStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

            await updateLeaveRequestStatus(requestId, apiStatus);

            setLeaveRequests(prev =>
                prev.map(request =>
                    request.id === requestId
                        ? { ...request, status: newStatus }
                        : request
                )
            );

            toast.success(`Request ${newStatus} successfully!`);

        } catch (err) {
            console.error("Error updating request:", err);
            toast.error("Failed to update request status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "text-yellow-600 bg-yellow-100";
            case "approved":
                return "text-green-600 bg-green-100";
            case "rejected":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const filteredRequests = leaveRequests.filter(request =>
        filter === "all" ? true : request.status === filter
    );

    const handleRequestClick = (requestId: string) => {
        router.push(`/leave-requests/${requestId}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Header />
                <div className="pt-4">
                    <LeaveRequestSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Header />
                <div className="pt-4">
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-lg border-2 border-red-200">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <svg
                                className="w-12 h-12 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-red-700 mb-2">
                            Error Loading Leave Requests
                        </h3>
                        <p className="text-red-600 text-center max-w-md mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => {
                                setError(null);
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Header />
            <div className="pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">All Leave Requests</h1>
                        <p className="text-gray-600">Review and manage student leave requests</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-md text-sm transition ${filter === "all"
                                    ? "bg-[#154473] text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            All ({leaveRequests.length})
                        </button>
                        <button
                            onClick={() => setFilter("pending")}
                            className={`px-4 py-2 rounded-md text-sm transition ${filter === "pending"
                                    ? "bg-[#154473] text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            Pending ({leaveRequests.filter(r => r.status === "pending").length})
                        </button>
                        <button
                            onClick={() => setFilter("approved")}
                            className={`px-4 py-2 rounded-md text-sm transition ${filter === "approved"
                                    ? "bg-[#154473] text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            Approved ({leaveRequests.filter(r => r.status === "approved").length})
                        </button>
                        <button
                            onClick={() => setFilter("rejected")}
                            className={`px-4 py-2 rounded-md text-sm transition ${filter === "rejected"
                                    ? "bg-[#154473] text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            Rejected ({leaveRequests.filter(r => r.status === "rejected").length})
                        </button>
                    </div>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <svg
                                className="w-12 h-12 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Leave Requests Found
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                            {filter === "all"
                                ? "There are no leave requests to display at the moment."
                                : `There are no ${filter} leave requests to display.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                onClick={() => handleRequestClick(request.id)}
                                className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                            >
                                {/* Student Info */}
                                <div className="flex items-center mb-4">
                                    <img
                                        src="https://www.girlsinc.org/wp-content/uploads/2023/12/front-page-hero-animated-v4-526x442.webp"
                                        alt={request.studentName}
                                        className="w-12 h-12 rounded-full object-cover mr-3"
                                        onError={(e) => (e.currentTarget.src = "https://www.girlsinc.org/wp-content/uploads/2023/12/front-page-hero-animated-v4-526x442.webp")}
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{request.studentName}</h3>
                                        <p className="text-sm text-gray-600">{request.leaveType}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>

                                {/* Request Details */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Leave Type:</span>
                                        <span className="text-gray-800">{request.leaveType}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Date:</span>
                                        <span className="text-gray-800">{request.startDate} - {request.endDate}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Reason:</span>
                                        <p className="text-gray-800 mt-1 line-clamp-2">{request.description}</p>
                                    </div>
                                    {request.attachments && request.attachments.length > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Attachments:</span>
                                            <span className="text-blue-600">{request.attachments.length} file(s)</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm pt-2 border-t">
                                        <span className="text-gray-500">Submitted:</span>
                                        <span className="text-gray-800">{request.submittedDate}</span>
                                    </div>
                                </div>

                                {/* Quick Actions for Pending Requests */}
                                {request.status === "pending" && (
                                    <div className="flex gap-2 mt-4 pt-3 border-t">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAction(request.id, "approved");
                                            }}
                                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAction(request.id, "rejected");
                                            }}
                                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-2 border rounded-md transition ${currentPage === page
                                            ? "bg-[#154473] text-white"
                                            : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLeaveRequestsPage;