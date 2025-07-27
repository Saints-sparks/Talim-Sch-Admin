"use client";

import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Assessment, AssessmentStatus, Term } from '@/components/assessment/AssessmentForm.types';
import AssessmentCard from './AssessmentCard';
import TermSelector from './TermSelector';

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
  status: AssessmentStatus | '';
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
    search: '',
    termId: '',
    status: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      termId: '',
      status: '',
    });
  };

  const getFilteredAssessments = () => {
    return assessments.filter(assessment => {
      const matchesSearch = !filters.search || 
        assessment.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        assessment.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesTerm = !filters.termId || assessment.termId._id === filters.termId;
      const matchesStatus = !filters.status || assessment.status === filters.status;

      return matchesSearch && matchesTerm && matchesStatus;
    });
  };

  const filteredAssessments = getFilteredAssessments();
  const hasActiveFilters = filters.search || filters.termId || filters.status;

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} assessments
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                page === pagination.currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header with Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search assessments..."
            />
          </div>

          {/* Filter Toggle and Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                hasActiveFilters ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
            </button>
            
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Term Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Term
                </label>
                <TermSelector
                  terms={terms}
                  selectedTermId={filters.termId}
                  onTermSelect={(termId) => handleFilterChange('termId', termId)}
                  placeholder="All terms"
                  allowEmpty
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assessment List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="flex justify-center gap-2 pt-4 mt-4 border-t border-gray-100">
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">
              {hasActiveFilters ? (
                <>
                  <p className="text-lg font-medium">No assessments match your filters</p>
                  <p className="mt-1">Try adjusting your search criteria or clearing filters</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No assessments found</p>
                  <p className="mt-1">Create your first assessment to get started</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Grid Layout like students page */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredAssessments.map((assessment, index) => (
                <div 
                  key={assessment._id}
                  className="animate-in fade-in duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <AssessmentCard
                    assessment={assessment}
                    onEdit={() => onEdit(assessment)}
                    onDelete={() => onDelete(assessment)}
                    onView={() => onView(assessment)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredAssessments.length > 0 && renderPagination()}
    </div>
  );
};

export default AssessmentList;
