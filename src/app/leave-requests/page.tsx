"use client";

import React, { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import {
  getLeaveRequests,
  updateLeaveRequestStatus,
} from "../services/leave.service";
import { toast } from "react-toastify";
import LeaveRequestSkeleton from "@/components/LeaveRequestSkeleton";
import { Search } from "@/components/Icons";

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
  const [leaveRequests, setLeaveRequests] = useState<TransformedLeaveRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [search, setSearch] = useState("");
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
        setError(
          err instanceof Error ? err.message : "Failed to fetch leave requests"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [currentPage]);

  // Transform API response to match your UI interface
  const transformApiResponse = (
    data: ApiLeaveRequest[]
  ): TransformedLeaveRequest[] => {
    return data.map((item) => ({
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
      originalData: item,
    }));
  };

  // Helper function to get student name
  const getStudentName = (
    studentUser: ApiLeaveRequest["studentUser"]
  ): string => {
    if (studentUser.firstName && studentUser.lastName) {
      return `${studentUser.firstName} ${studentUser.lastName}`;
    }
    if (studentUser.firstName) {
      return studentUser.firstName;
    }
    if (studentUser.email) {
      return studentUser.email.split("@")[0];
    }
    return "Unknown Student";
  };

  // Handle status update using your service
  const handleQuickAction = async (
    requestId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      const apiStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

      await updateLeaveRequestStatus(requestId, apiStatus);

      setLeaveRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status: newStatus } : request
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
        return "text-[#FFB400]";
      case "approved":
        return "text-[#2E8B57]";
      case "rejected":
        return "text-red-600 ";
      default:
        return "text-gray-600";
    }
  };

  const filteredRequests = leaveRequests.filter((request) =>
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
      <div className="min-h-screen  p-4">
        <div className="pt-4">
          <LeaveRequestSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
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
            <p className="text-red-600 text-center max-w-md mb-6">{error}</p>
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
    <div className="min-h-screen p-4">
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-[19px] font-semibold">
              Request Leave
            </h1>
          </div>

          

          <div className="flex gap-2 items-center">
            <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="search"
                value={typeof search !== "undefined" ? search : ""}
                onChange={(e) => {
                  // Update local search state if available (guard for TS)
                  try {
                    // @ts-ignore
                    setSearch(e.target.value);
                  } catch (err) {}
                }}
                placeholder="Search"
                className="w-full border border-[#E0E0E0] rounded-xl py-2 px-4 pl-10 max-w-[300px] text-[15px] focus:outline-none focus:ring-1 focus:ring-[#154473]"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search />
              </div>
            </div>
          </div>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-[15px] transition font-medium ${
                filter === "all"
                  ? "bg-[#154473] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All ({leaveRequests.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-xl text-[15px] transition font-medium ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Pending (
              {leaveRequests.filter((r) => r.status === "pending").length})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-3 py-1.5 rounded-xl text-[15px] transition font-medium ${
                filter === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Rejected (
              {leaveRequests.filter((r) => r.status === "rejected").length})
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
                : `There are no ${filter} leave requests to display.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests
              .filter((r) =>
                `${r.studentName} ${r.leaveType} ${r.description}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleRequestClick(request.id)}
                  className="bg-white border border-[#F0F0F0] max-w-[356px] rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <img
                        src={request.studentImage || "/img/default-avatar.png"}
                        alt={request.studentName}
                        className="w-11 h-11 rounded-full object-cover mr-3"
                        onError={(e) =>
                          (e.currentTarget.src = "/img/default-teacher.png")
                        }
                      />
                      <div>
                        <h3 className="text-[15px] font-semibold ">
                          {request.studentName}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[15px] border border-[#E0E0E0] leading-[120%] px-2 py-1 rounded-xl capitalize ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-[15px]">Leave Type:</span>
                      <span className="text-[#4D4D4D] text-[15px] border border-[#F2F2F2] px-2 py-1 rounded-xl">{request.leaveType}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-[15px]">Date:</span>
                      <span className="text-[#4D4D4D] text-[15px] border border-[#F2F2F2] px-2 py-1 rounded-xl">
                        {request.startDate} - {request.endDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-[15px]">Attachments:</span>
                       <span className="text-[#4D4D4D] text-[15px] border border-[#F2F2F2] px-2 py-1 rounded-xl flex gap-2">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h11"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 10l5 5 5-5"
                          />
                        </svg>
                        {request.attachments && request.attachments.length > 0
                          ? `${request.attachments.length} file`
                          : "0 files"}
                      </span>
                    </div>

                    <div className="bg-[#F2F2F2] rounded-xl font-medium p-3 text-[15px] text-[#4D4D4D]">
                      {request.description || "No reason provided."}
                    </div>

                    
                  </div>

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

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-md transition ${
                      currentPage === page
                        ? "bg-[#154473] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

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
