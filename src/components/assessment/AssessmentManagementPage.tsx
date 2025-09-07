"use client";

import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiRefreshCw,
  FiAlertTriangle,
  FiClipboard,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
  FiEdit,
  FiTrash2,
  FiEye,
  FiSearch,
} from "react-icons/fi";
import {
  Assessment,
  AssessmentForm,
  Term,
} from "@/components/assessment/AssessmentForm.types";
import { assessmentService } from "@/app/services/assessment.service";
import AssessmentList from "@/components/assessment/AssessmentList";
import AssessmentCreateModal from "@/components/assessment/AssessmentCreateModal";

interface AssessmentManagementPageProps {
  terms: Term[] | any[]; // Allow both Term[] and TermResponse[]
}

const AssessmentManagementPage: React.FC<AssessmentManagementPageProps> = ({
  terms,
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    assessment: Assessment | null;
    loading: boolean;
  }>({
    isOpen: false,
    assessment: null,
    loading: false,
  });

  // Filter assessments based on search and status
  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || assessment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats for dashboard cards
  const assessmentStats = {
    total: assessments.length,
    active: assessments.filter((a) => a.status === "active").length,
    pending: assessments.filter((a) => a.status === "pending").length,
    completed: assessments.filter((a) => a.status === "completed").length,
  };

  // Load assessments with improved error handling
  const loadAssessments = async (
    page: number = 1,
    showLoadingState: boolean = true
  ) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null); // Clear any previous errors

      const response = await assessmentService.getAssessmentsBySchool(
        page,
        pagination.limit
      );

      // Validate response structure
      if (!response || !response.assessments) {
        throw new Error("Invalid response format from server");
      }

      setAssessments(response.assessments);
      setPagination({
        currentPage: response.pagination?.currentPage || page,
        totalPages: response.pagination?.totalPages || 1,
        totalCount:
          response.pagination?.totalItems || response.assessments.length,
        limit: response.pagination?.itemsPerPage || pagination.limit,
      });

      setRetryCount(0); // Reset retry count on success
      setIsRetrying(false);
    } catch (err) {
      console.error("Error loading assessments:", err);

      // Determine error message based on error type
      let errorMessage = "Failed to load assessments. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("Network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          err.message.includes("401") ||
          err.message.includes("Unauthorized")
        ) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (
          err.message.includes("403") ||
          err.message.includes("Forbidden")
        ) {
          errorMessage = "You do not have permission to view assessments.";
        } else if (err.message.includes("404")) {
          errorMessage =
            "Assessment service not found. Please contact support.";
        } else if (err.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        }
      }

      setError(errorMessage);

      // Keep existing assessments if this is a refresh
      if (page === 1 && assessments.length === 0) {
        setAssessments([]);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Handle create assessment with proper error handling
  const handleCreateAssessment = async (assessmentData: AssessmentForm) => {
    try {
      const newAssessment = await assessmentService.createAssessment({
        name: assessmentData.name,
        description: assessmentData.description,
        termId: assessmentData.termId,
        startDate: assessmentData.startDate,
        endDate: assessmentData.endDate,
        status: assessmentData.status || "pending",
      });

      // Refresh the assessments list
      await loadAssessments(pagination.currentPage, false);
      setShowCreateModal(false);

      // Clear any existing errors
      setError(null);
    } catch (err) {
      console.error("Error creating assessment:", err);

      // Let the modal handle specific error display
      let errorMessage = "Failed to create assessment.";
      if (err instanceof Error) {
        if (
          err.message.includes("duplicate") ||
          err.message.includes("already exists")
        ) {
          errorMessage = "An assessment with this name already exists.";
        } else if (err.message.includes("validation")) {
          errorMessage = "Please check your input and try again.";
        } else if (err.message.includes("term")) {
          errorMessage = "Invalid term selected. Please choose a valid term.";
        }
      }

      throw new Error(errorMessage);
    }
  };

  // Handle edit assessment with proper error handling
  const handleEditAssessment = async (assessmentData: AssessmentForm) => {
    if (!editingAssessment) return;

    try {
      await assessmentService.updateAssessment(editingAssessment._id, {
        name: assessmentData.name,
        description: assessmentData.description,
        startDate: assessmentData.startDate,
        endDate: assessmentData.endDate,
        status: assessmentData.status,
      });

      // Refresh the assessments list
      await loadAssessments(pagination.currentPage, false);
      setEditingAssessment(null);
      setShowCreateModal(false);

      // Clear any existing errors
      setError(null);
    } catch (err) {
      console.error("Error updating assessment:", err);

      let errorMessage = "Failed to update assessment.";
      if (err instanceof Error) {
        if (err.message.includes("not found")) {
          errorMessage = "Assessment not found. It may have been deleted.";
        } else if (err.message.includes("permission")) {
          errorMessage = "You do not have permission to edit this assessment.";
        } else if (err.message.includes("validation")) {
          errorMessage = "Please check your input and try again.";
        }
      }

      throw new Error(errorMessage);
    }
  };

  // Handle delete assessment with proper error handling
  const handleDeleteAssessment = async () => {
    if (!deleteConfirm.assessment) return;

    try {
      setDeleteConfirm((prev) => ({ ...prev, loading: true }));
      await assessmentService.deleteAssessment(deleteConfirm.assessment._id);

      // Refresh the assessments list
      await loadAssessments(pagination.currentPage, false);
      setDeleteConfirm({ isOpen: false, assessment: null, loading: false });

      // Clear any existing errors
      setError(null);
    } catch (err) {
      console.error("Error deleting assessment:", err);
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));

      let errorMessage = "Failed to delete assessment.";
      if (err instanceof Error) {
        if (err.message.includes("not found")) {
          errorMessage =
            "Assessment not found. It may have already been deleted.";
        } else if (err.message.includes("permission")) {
          errorMessage =
            "You do not have permission to delete this assessment.";
        } else if (
          err.message.includes("has grades") ||
          err.message.includes("in use")
        ) {
          errorMessage =
            "Cannot delete assessment that has grades associated with it.";
        }
      }

      setError(errorMessage);
    }
  };

  // Handle page change with error handling
  const handlePageChange = (page: number) => {
    setError(null); // Clear errors when changing pages
    loadAssessments(page);
  };

  // Retry mechanism
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    await loadAssessments(pagination.currentPage);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Open edit modal
  const openEditModal = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setShowCreateModal(true);
  };

  // Open delete confirmation
  const openDeleteConfirm = (assessment: Assessment) => {
    setDeleteConfirm({ isOpen: true, assessment, loading: false });
  };

  // Handle view assessment (navigate to assessment details)
  const handleViewAssessment = (assessment: Assessment) => {
    // TODO: Navigate to assessment details page
    console.log("View assessment:", assessment);
  };

  return (
    <div className="flex bg-[#F8F8F8]">
      <main className="flex-grow flex flex-col">
        {/* Modern Header Section */}
        <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiClipboard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Assessment Management
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Create, manage and track student assessments
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setError(null);
                    loadAssessments(pagination.currentPage);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm disabled:opacity-50"
                  disabled={loading || isRetrying}
                >
                  <FiRefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loading || isRetrying ? "animate-spin" : ""
                    }`}
                  />
                  {loading || isRetrying ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  onClick={() => {
                    setEditingAssessment(null);
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FiPlus className="h-4 w-4 mr-2" />
                  Create Assessment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="px-6 py-6">
              {/* Stats Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiClipboard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Assessments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assessmentStats.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiTrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assessmentStats.active}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <FiCalendar className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assessmentStats.pending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiUsers className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assessmentStats.completed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <FiAlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-red-800">
                        Something went wrong
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>

                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={handleRetry}
                          disabled={isRetrying}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                          {isRetrying ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-800 mr-2"></div>
                              Retrying...
                            </>
                          ) : (
                            <>
                              <FiRefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </>
                          )}
                        </button>
                        <button
                          onClick={clearError}
                          className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>

                      {retryCount > 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          Retry attempts: {retryCount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              

              {/* Assessment Content */}
              {!loading && !error && filteredAssessments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiClipboard className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {searchQuery || filterStatus !== "all"
                      ? "No assessments found"
                      : "No assessments created yet"}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchQuery || filterStatus !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by creating your first assessment to evaluate student performance."}
                  </p>
                  {!searchQuery && filterStatus === "all" && (
                    <button
                      onClick={() => {
                        setEditingAssessment(null);
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg"
                    >
                      <FiPlus className="h-5 w-5 mr-2" />
                      Create Your First Assessment
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <AssessmentList
                    assessments={filteredAssessments}
                    terms={terms}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onEdit={openEditModal}
                    onDelete={openDeleteConfirm}
                    onView={handleViewAssessment}
                    onRefresh={() => {
                      setError(null);
                      loadAssessments(pagination.currentPage);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create/Edit Assessment Modal */}
      <AssessmentCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAssessment(null);
        }}
        onSubmit={
          editingAssessment ? handleEditAssessment : handleCreateAssessment
        }
        terms={terms}
        editingAssessment={editingAssessment}
        loading={loading}
      />

      {/* Enhanced Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.assessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FiAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Assessment
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    "{deleteConfirm.assessment?.name}"
                  </span>
                  ? All associated data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: false,
                      assessment: null,
                      loading: false,
                    })
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300"
                  disabled={deleteConfirm.loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAssessment}
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteConfirm.loading}
                >
                  {deleteConfirm.loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    "Delete Assessment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentManagementPage;
