"use client";

import React, { useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  Assessment,
  AssessmentStatus,
  Term,
} from "@/components/assessment/AssessmentForm.types";
import AssessmentCard from "./AssessmentCard";
import TermSelector from "./TermSelector";

interface AssessmentListProps {
  assessments: Assessment[];
  terms: Term[];
  loading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onEdit: (assessment: Assessment) => void;
  onDelete: (assessment: Assessment) => void;
  onView: (assessment: Assessment) => void;
  onRefresh: () => void;
}

interface FilterState {
  search: string;
  termId: string;
  status: AssessmentStatus | "";
}

const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  terms,
  loading,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onRefresh,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    termId: "",
    status: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      termId: "",
      status: "",
    });
  };

  const getFilteredAssessments = () => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        !filters.search ||
        assessment.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        assessment.description
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesTerm =
        !filters.termId || assessment.termId._id === filters.termId;
      const matchesStatus =
        !filters.status || assessment.status === filters.status;

      return matchesSearch && matchesTerm && matchesStatus;
    });
  };

  const filteredAssessments = getFilteredAssessments();
  const hasActiveFilters = filters.search || filters.termId || filters.status;

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <span>
            Showing{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalCount}</span>{" "}
            assessments
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from(
              { length: Math.min(pagination.totalPages, 5) },
              (_, i) => {
                let page;
                if (pagination.totalPages <= 5) {
                  page = i + 1;
                } else if (pagination.currentPage <= 3) {
                  page = i + 1;
                } else if (
                  pagination.currentPage >=
                  pagination.totalPages - 2
                ) {
                  page = pagination.totalPages - 4 + i;
                } else {
                  page = pagination.currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      page === pagination.currentPage
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FiChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case "active":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <FiClock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <FiCheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FiAlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: AssessmentStatus) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "completed":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "cancelled":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Enhanced Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Search assessments by name or description..."
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg transition-all duration-300 ${
                hasActiveFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {showFilters && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Term Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Term
                </label>
                <TermSelector
                  terms={terms}
                  selectedTermId={filters.termId}
                  onTermSelect={(termId) =>
                    handleFilterChange("termId", termId)
                  }
                  placeholder="All terms"
                  allowEmpty
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Assessment Content */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCalendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {hasActiveFilters
                ? "No assessments match your criteria"
                : "No assessments found"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search terms or clearing some filters to see more results."
                : "Create your first assessment to start evaluating student performance and track academic progress."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Enhanced Assessment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.map((assessment, index) => (
                <div
                  key={assessment._id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.6s ease-out forwards",
                  }}
                >
                  <div className="p-6">
                    {/* Assessment Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                          {assessment.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                          <FiCalendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              assessment.startDate
                            ).toLocaleDateString()}
                          </span>
                          <span>-</span>
                          <span>
                            {new Date(assessment.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assessment.description || "No description provided"}
                        </p>
                      </div>
                      <div className="flex items-center ml-4">
                        <span className={getStatusBadge(assessment.status)}>
                          {getStatusIcon(assessment.status)}
                          <span className="ml-1 capitalize">
                            {assessment.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Assessment Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Term:</span>
                        <span className="font-medium text-gray-900">
                          {typeof assessment.termId === "object"
                            ? assessment.termId.name
                            : "Unknown Term"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium text-gray-900">
                          {Math.ceil(
                            (new Date(assessment.endDate).getTime() -
                              new Date(assessment.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-2 pt-4 mt-4 border-t border-gray-100">
                      <button
                        onClick={() => onView(assessment)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-300"
                        title="View Assessment"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onEdit(assessment)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-300"
                        title="Edit Assessment"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(assessment)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-300"
                        title="Delete Assessment"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">{renderPagination()}</div>
            )}
          </>
        )}
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AssessmentList;
