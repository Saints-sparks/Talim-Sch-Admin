"use client";

import React, { useState, useEffect } from "react";
import ModernLoader from "@/components/ModernLoader";
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
  FiFilter,
  FiTarget,
  FiArrowLeft,
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {loading && <ModernLoader />}

      {!loading && (
        <>
          {/* Enhanced Header with Talim Styling */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 m-6 rounded-2xl">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FiTarget className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Assessment Management
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Create, manage and track student assessments
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setEditingAssessment(null);
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center px-6 py-2.5 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="px-6 ">
                {/* Enhanced Stats Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Total Assessments
                        </p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          {assessmentStats.total}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-200">
                        <FiClipboard className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Active
                        </p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                          {assessmentStats.active}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-200">
                        <FiTrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Pending
                        </p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                          {assessmentStats.pending}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-amber-200">
                        <FiCalendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Completed
                        </p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                          {assessmentStats.completed}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-200">
                        <FiUsers className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <FiAlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                          Something went wrong
                        </h3>
                        <p className="text-red-700 mb-4">{error}</p>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleRetry}
                            disabled={isRetrying}
                            className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
                          >
                            {isRetrying ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                            className="px-5 py-2.5 text-red-600 hover:text-red-800 font-medium bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all duration-300"
                          >
                            Dismiss
                          </button>
                        </div>

                        {retryCount > 0 && (
                          <p className="mt-3 text-sm text-red-600 bg-red-100 px-3 py-1 rounded-lg inline-block">
                            Retry attempts: {retryCount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Assessment Content */}
                {!error && filteredAssessments.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-8">
                      <FiClipboard className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {searchQuery || filterStatus !== "all"
                        ? "No assessments found"
                        : "No assessments created yet"}
                    </h3>
                    <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
                      {searchQuery || filterStatus !== "all"
                        ? "Try adjusting your search or filter criteria to find what you're looking for."
                        : "Get started by creating your first assessment to evaluate student performance and track academic progress."}
                    </p>
                    {!searchQuery && filterStatus === "all" && (
                      <button
                        onClick={() => {
                          setEditingAssessment(null);
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                      >
                        <FiPlus className="h-5 w-5 mr-3" />
                        Create Your First Assessment
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <AssessmentList
                      assessments={filteredAssessments}
                      terms={terms}
                      loading={false}
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
        </>
      )}

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

      {/* Enhanced Delete Confirmation Modal with Talim Styling */}
      {deleteConfirm.isOpen && deleteConfirm.assessment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mr-4">
                  <FiAlertTriangle className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Delete Assessment
                  </h3>
                  <p className="text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-8">
                <p className="text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-gray-900">
                    "{deleteConfirm.assessment?.name}"
                  </span>
                  ? All associated data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: false,
                      assessment: null,
                      loading: false,
                    })
                  }
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300"
                  disabled={deleteConfirm.loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAssessment}
                  className="px-8 py-3 text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
