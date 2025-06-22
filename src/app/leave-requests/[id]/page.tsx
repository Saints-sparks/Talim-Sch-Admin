"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useRouter, useParams } from "next/navigation";
import {
  getLeaveRequestById,
  updateLeaveRequestStatus,
} from "@/app/services/leave.service";
import { toast } from "react-toastify";

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
    classId: string;
    gradeLevel: string;
    isActive: boolean;
    parentContact: {
      fullName: string;
      phoneNumber: string;
      email: string;
    };
    parentId: string;
    enrolledCourses: string[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  studentUser: {
    _id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    schoolId: string;
    isActive: boolean;
    isEmailVerified: boolean;
    __v: number;
  };
  term: string;
  updatedAt: string;
  viewed: boolean;
  attachments: string[];
  __v: number;
}

// Type definition for transformed leave request
interface TransformedLeaveRequest {
  id: string;
  studentName: string;
  studentImage?: string;
  leaveType: string;
  gradeLevel: string;
  parent: string;
  parentPhone?: string;
  parentEmail?: string;
  studentEmail: string;
  studentPhone?: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  updatedDate: string;
  attachments?: string[];
  viewed: boolean;
  originalData: ApiLeaveRequest;
}

const AdminRequestDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [leaveRequest, setLeaveRequest] =
    useState<TransformedLeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch leave request details using your service
  useEffect(() => {
    const fetchLeaveRequest = async () => {
      if (!requestId) return;

      try {
        setLoading(true);
        setError(null);

        // Using your existing service function
        const response = await getLeaveRequestById(requestId);
        
        // Handle response structure - check if it's wrapped or direct
        let data: ApiLeaveRequest;
        if (response && typeof response === 'object') {
          if ('data' in response && response.data) {
            data = response.data as ApiLeaveRequest;
          } else if ('_id' in response) {
            // First cast to unknown to bypass type checking, then to ApiLeaveRequest
            data = response as unknown as ApiLeaveRequest;
          } else {
            throw new Error("Invalid API response format");
          }
        } else {
          throw new Error("Invalid API response format");
        }

        const transformedData = transformApiResponse(data);
        setLeaveRequest(transformedData);
      } catch (err) {
        console.error("Error fetching leave request:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch leave request"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequest();
  }, [requestId]);

  // Transform API response to match your UI interface
  const transformApiResponse = (
    data: ApiLeaveRequest
  ): TransformedLeaveRequest => {
    return {
      id: data._id,
      studentName: `${data.studentUser.firstName} ${data.studentUser.lastName}`,
      studentImage: "https://www.girlsinc.org/wp-content/uploads/2023/12/front-page-hero-animated-v4-526x442.webp",
      leaveType: data.leaveType,
      gradeLevel: data.studentProfile.gradeLevel,
      parent: data.studentProfile.parentContact.fullName,
      parentPhone: data.studentProfile.parentContact.phoneNumber,
      parentEmail: data.studentProfile.parentContact.email,
      studentEmail: data.studentUser.email,
      studentPhone: data.studentUser.phoneNumber,
      startDate: new Date(data.startDate).toLocaleDateString(),
      endDate: new Date(data.endDate).toLocaleDateString(),
      description: data.reason || "",
      status: data.status.toLowerCase() as "pending" | "approved" | "rejected",
      submittedDate: new Date(data.createdAt).toLocaleDateString(),
      updatedDate: new Date(data.updatedAt).toLocaleDateString(),
      attachments: data.attachments || [],
      viewed: data.viewed || false,
      originalData: data,
    };
  };

  const handleApprove = async () => {
    if (!leaveRequest) return;

    setActionLoading(true);

    try {
      // Using your existing service function
      await updateLeaveRequestStatus(leaveRequest.id, "Approved");

      const updatedRequest = {
        ...leaveRequest,
        status: "approved" as const,
        updatedDate: new Date().toLocaleDateString(),
      };

      setLeaveRequest(updatedRequest);
      toast.success("Leave request approved successfully!");
    } catch (err) {
      console.error("Error approving request:", err);
      toast.error("Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!leaveRequest) return;

    setActionLoading(true);

    try {
      // Using your existing service function
      await updateLeaveRequestStatus(leaveRequest.id, "Rejected");

      const updatedRequest = {
        ...leaveRequest,
        status: "rejected" as const,
        updatedDate: new Date().toLocaleDateString(),
      };

      setLeaveRequest(updatedRequest);
      toast.success("Leave request rejected.");
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error("Failed to reject request");
    } finally {
      setActionLoading(false);
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

  const handleDownloadAttachment = (attachment: string) => {
    // Implement download logic based on your file storage system
    window.open(attachment, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-shrink-0">
          <Header />
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
        <div className="flex-1 px-6 py-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push("/leave-requests")}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold">Leave Request Details</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => router.push("/leave-requests")}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Request Not Found
            </h3>
            <p className="text-gray-500 mb-4">
              The leave request you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/leave-requests")}
              className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Leave Requests
            </button>
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

      {/* Fixed Back Button and Title */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-100">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/leave-requests")}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold">Leave Request Details</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden px-6">
        <div className="h-full overflow-y-auto pb-6">
          {/* Main Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={leaveRequest.studentImage}
                    alt={leaveRequest.studentName}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://www.girlsinc.org/wp-content/uploads/2023/12/front-page-hero-animated-v4-526x442.webp";
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {leaveRequest.studentName}
                    </h2>
                    <p className="text-gray-600">{leaveRequest.gradeLevel} • {leaveRequest.leaveType}</p>
                  </div>
                </div>
                <span
                  className={`text-sm px-3 py-1 rounded-full capitalize font-medium ${getStatusColor(
                    leaveRequest.status
                  )}`}
                >
                  {leaveRequest.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Request Information */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Student Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Student Name:
                      </span>
                      <p className="text-gray-800">{leaveRequest.studentName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Grade Level:
                      </span>
                      <p className="text-gray-800">{leaveRequest.gradeLevel}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Student Email:
                      </span>
                      <p className="text-gray-800">{leaveRequest.studentEmail}</p>
                    </div>
                    {leaveRequest.studentPhone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Student Phone:
                        </span>
                        <p className="text-gray-800">{leaveRequest.studentPhone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Student ID:
                      </span>
                      <p className="text-gray-800">{leaveRequest.originalData.studentUser.userId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Parent Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Parent Name:
                      </span>
                      <p className="text-gray-800">{leaveRequest.parent}</p>
                    </div>
                    {leaveRequest.parentPhone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Parent Phone:
                        </span>
                        <p className="text-gray-800">{leaveRequest.parentPhone}</p>
                      </div>
                    )}
                    {leaveRequest.parentEmail && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Parent Email:
                        </span>
                        <p className="text-gray-800">{leaveRequest.parentEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Leave Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Leave Type:
                    </span>
                    <p className="text-gray-800">{leaveRequest.leaveType}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Leave Period:
                    </span>
                    <p className="text-gray-800">
                      {leaveRequest.startDate} - {leaveRequest.endDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Request Submitted:
                    </span>
                    <p className="text-gray-800">{leaveRequest.submittedDate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Last Updated:
                    </span>
                    <p className="text-gray-800">{leaveRequest.updatedDate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Current Status:
                    </span>
                    <p
                      className={`capitalize font-medium ${
                        leaveRequest.status === "pending"
                          ? "text-yellow-600"
                          : leaveRequest.status === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {leaveRequest.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Reason for Leave
                </h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-gray-800 leading-relaxed">
                    {leaveRequest.description}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {leaveRequest.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-md p-3"
                      >
                        <div className="flex items-center">
                          <div className="text-blue-500 mr-3">📎</div>
                          <span className="text-gray-800">{attachment}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Section - Only show for pending requests */}
              {leaveRequest.status === "pending" && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Take Action
                  </h3>

                  {/* Comments Input */}
                  <div className="mb-4">
                    <label
                      htmlFor="comments"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Admin Comments (Optional)
                    </label>
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add any comments about this decision..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-red-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Processing..." : "Reject"}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Processing..." : "Approve"}
                    </button>
                  </div>
                </div>
              )}

              {/* Message for already processed requests */}
              {leaveRequest.status !== "pending" && (
                <div className="border-t pt-6">
                  <div className="bg-gray-50 rounded-md p-4 text-center">
                    <p className="text-gray-600">
                      This request has already been {leaveRequest.status}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestDetailPage;