"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useRouter } from "next/navigation";
import { getLeaveRequests, updateLeaveRequestStatus } from "../services/leave.service";
import { toast } from 'react-toastify';

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
    // Add other student profile fields as needed
  };
  studentUser: {
    _id: string;
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    // Add other user fields as needed
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
  originalData: ApiLeaveRequest; // Keep original data for API calls
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

        // Get the raw response from your API
        const response = await getLeaveRequests(currentPage, 10);
        
        // Handle the response based on its actual structure
        let apiData: ApiLeaveRequest[];
        
        // Check if response is wrapped in a data property or is direct array
        if (Array.isArray(response)) {
          apiData = response as unknown as ApiLeaveRequest[];
        } else if (response && Array.isArray(response.data)) {
          apiData = response.data as unknown as ApiLeaveRequest[];
        } else {
          throw new Error("Invalid API response format");
        }
        
        // Transform API response to match your UI interface
        const transformedData = transformApiResponse(apiData);
        setLeaveRequests(transformedData);
        
        // Set pagination info (you might need to get this from headers or adjust API)
        // For now, assuming single page since your API doesn't return pagination meta
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
      studentImage: "/img/default-avatar.png", // You might need to add this to your API
      grade: item.leaveType, // Using leaveType as grade for now
      parent: "Unknown Parent", // You might need to fetch parent info separately
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
      return studentUser.email.split('@')[0]; // Use email prefix as fallback
    }
    return "Unknown Student";
  };

  // Handle status update using your service
  const handleQuickAction = async (requestId: string, newStatus: "approved" | "rejected") => {
    try {
      // Capitalize first letter to match your API expectation
      const apiStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      
      await updateLeaveRequestStatus(requestId, apiStatus);

      // Update local state
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
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div className="flex-shrink-0 px-6 py-4 bg-gray-100">
          <h1 className="text-2xl font-semibold">All Leave Requests</h1>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#154473]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div className="flex-shrink-0 px-6 py-4 bg-gray-100">
          <h1 className="text-2xl font-semibold">All Leave Requests</h1>
        </div>
        <div className="flex-1 px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>
      
      {/* Fixed Page Title and Filter */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">All Leave Requests</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                filter === "all" 
                  ? "bg-[#154473] text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All ({leaveRequests.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                filter === "pending" 
                  ? "bg-[#154473] text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Pending ({leaveRequests.filter(r => r.status === "pending").length})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                filter === "approved" 
                  ? "bg-[#154473] text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Approved ({leaveRequests.filter(r => r.status === "approved").length})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                filter === "rejected" 
                  ? "bg-[#154473] text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Rejected ({leaveRequests.filter(r => r.status === "rejected").length})
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden px-6">
        <div className="h-full overflow-y-auto">
          {/* Leave Requests Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => handleRequestClick(request.id)}
                className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                {/* Student Info */}
                <div className="flex items-center mb-4">
                  <img
                    src={ "https://www.girlsinc.org/wp-content/uploads/2023/12/front-page-hero-animated-v4-526x442.webp"}
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
                        handleQuickAction(request.id, "rejected");
                      }}
                      className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-red-100 hover:text-red-700 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(request.id, "approved");
                      }}
                      className="flex-1 px-3 py-1 bg-[#154473] text-white rounded text-sm hover:bg-blue-700 transition"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
              <p className="text-gray-500">
                {filter === "all" 
                  ? "There are no leave requests to display." 
                  : `There are no ${filter} leave requests.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 px-6 py-4 bg-gray-100 border-t">
          <div className="flex justify-center">
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
                  className={`px-3 py-2 border rounded-md transition ${
                    currentPage === page
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
        </div>
      )}
    </div>
  );
};

export default AdminLeaveRequestsPage;