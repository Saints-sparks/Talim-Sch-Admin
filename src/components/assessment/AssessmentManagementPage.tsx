"use client";

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { Assessment, AssessmentForm, Term } from '@/components/assessment/AssessmentForm.types';
import { assessmentService } from '@/app/services/assessment.service';
import AssessmentList from '@/components/assessment/AssessmentList';
import AssessmentCreateModal from '@/components/assessment/AssessmentCreateModal';

interface AssessmentManagementPageProps {
  terms: Term[] | any[]; // Allow both Term[] and TermResponse[]
}

const AssessmentManagementPage: React.FC<AssessmentManagementPageProps> = ({ terms }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
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

  // Load assessments with improved error handling
  const loadAssessments = async (page: number = 1, showLoadingState: boolean = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null); // Clear any previous errors
      
      const response = await assessmentService.getAssessmentsBySchool(page, pagination.limit);
      
      // Validate response structure
      if (!response || !response.assessments) {
        throw new Error('Invalid response format from server');
      }
      
      setAssessments(response.assessments);
      setPagination({
        currentPage: response.pagination?.currentPage || page,
        totalPages: response.pagination?.totalPages || 1,
        totalCount: response.pagination?.totalItems || response.assessments.length,
        limit: response.pagination?.itemsPerPage || pagination.limit,
      });
      
      setRetryCount(0); // Reset retry count on success
      setIsRetrying(false);

    } catch (err) {
      console.error('Error loading assessments:', err);
      
      // Determine error message based on error type
      let errorMessage = 'Failed to load assessments. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'You do not have permission to view assessments.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Assessment service not found. Please contact support.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
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
        status: assessmentData.status || 'pending',
      });
      
      // Refresh the assessments list
      await loadAssessments(pagination.currentPage, false);
      setShowCreateModal(false);
      
      // Clear any existing errors
      setError(null);
    } catch (err) {
      console.error('Error creating assessment:', err);
      
      // Let the modal handle specific error display
      let errorMessage = 'Failed to create assessment.';
      if (err instanceof Error) {
        if (err.message.includes('duplicate') || err.message.includes('already exists')) {
          errorMessage = 'An assessment with this name already exists.';
        } else if (err.message.includes('validation')) {
          errorMessage = 'Please check your input and try again.';
        } else if (err.message.includes('term')) {
          errorMessage = 'Invalid term selected. Please choose a valid term.';
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
      console.error('Error updating assessment:', err);
      
      let errorMessage = 'Failed to update assessment.';
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          errorMessage = 'Assessment not found. It may have been deleted.';
        } else if (err.message.includes('permission')) {
          errorMessage = 'You do not have permission to edit this assessment.';
        } else if (err.message.includes('validation')) {
          errorMessage = 'Please check your input and try again.';
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  // Handle delete assessment with proper error handling
  const handleDeleteAssessment = async () => {
    if (!deleteConfirm.assessment) return;
    
    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));
      await assessmentService.deleteAssessment(deleteConfirm.assessment._id);
      
      // Refresh the assessments list
      await loadAssessments(pagination.currentPage, false);
      setDeleteConfirm({ isOpen: false, assessment: null, loading: false });
      
      // Clear any existing errors
      setError(null);
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
      
      let errorMessage = 'Failed to delete assessment.';
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          errorMessage = 'Assessment not found. It may have already been deleted.';
        } else if (err.message.includes('permission')) {
          errorMessage = 'You do not have permission to delete this assessment.';
        } else if (err.message.includes('has grades') || err.message.includes('in use')) {
          errorMessage = 'Cannot delete assessment that has grades associated with it.';
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
    setRetryCount(prev => prev + 1);
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
    console.log('View assessment:', assessment);
  };

  return (
    <div className="space-y-6">
      {/* Title and Controls - Following students page pattern */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <h1 className="text-xl font-medium text-gray-800">Assessments</h1>
          <button
            onClick={() => {
              setEditingAssessment(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            <span className="text-lg">+</span>
            Add
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setError(null);
              loadAssessments(pagination.currentPage);
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || isRetrying}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRetrying) ? 'animate-spin' : ''}`} />
            {loading || isRetrying ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Enhanced Error Message with Retry */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              
              {/* Retry and dismiss actions */}
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="text-sm font-medium text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-800 mr-1"></div>
                      Retrying...
                    </div>
                  ) : (
                    'Try Again'
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

      {/* Assessment List or Empty State */}
      {!loading && !error && assessments.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
          <p className="text-gray-500 mb-6">
            Get started by creating your first assessment for your school.
          </p>
          <button
            onClick={() => {
              setEditingAssessment(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </button>
        </div>
      ) : (
        <AssessmentList
          assessments={assessments}
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
      )}

      {/* Create/Edit Assessment Modal */}
      <AssessmentCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAssessment(null);
        }}
        onSubmit={editingAssessment ? handleEditAssessment : handleCreateAssessment}
        terms={terms}
        editingAssessment={editingAssessment}
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.assessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Delete Assessment</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{deleteConfirm.assessment.name}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, assessment: null, loading: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={deleteConfirm.loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAssessment}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteConfirm.loading}
                >
                  {deleteConfirm.loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
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
