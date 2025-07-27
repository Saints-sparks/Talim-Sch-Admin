"use client";

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { Assessment, AssessmentForm, Term } from '@/components/assessment/AssessmentForm.types';
import { assessmentService } from '@/services/assessmentService';
import AssessmentList from '@/components/assessment/AssessmentList';
import AssessmentCreateModal from '@/components/assessment/AssessmentCreateModal';

interface AssessmentManagementPageProps {
  terms: Term[];
}

const AssessmentManagementPage: React.FC<AssessmentManagementPageProps> = ({ terms }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  
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

  // Load assessments
  const loadAssessments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await assessmentService.getAssessmentsBySchool(page, pagination.limit);
      setAssessments(response.assessments);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalCount: response.pagination.totalItems,
        limit: response.pagination.itemsPerPage,
      });
    } catch (err) {
      console.error('Error loading assessments:', err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Handle create assessment
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
      await loadAssessments(pagination.currentPage);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating assessment:', err);
      throw err; // Re-throw to let the modal handle the error display
    }
  };

  // Handle edit assessment
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
      await loadAssessments(pagination.currentPage);
      setEditingAssessment(null);
    } catch (err) {
      console.error('Error updating assessment:', err);
      throw err; // Re-throw to let the modal handle the error display
    }
  };

  // Handle delete assessment
  const handleDeleteAssessment = async () => {
    if (!deleteConfirm.assessment) return;
    
    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));
      await assessmentService.deleteAssessment(deleteConfirm.assessment._id);
      
      // Refresh the assessments list
      await loadAssessments(pagination.currentPage);
      setDeleteConfirm({ isOpen: false, assessment: null, loading: false });
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
      // You might want to show an error message here
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadAssessments(page);
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
            onClick={() => loadAssessments(pagination.currentPage)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Assessment List */}
      <AssessmentList
        assessments={assessments}
        terms={terms}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={openEditModal}
        onDelete={openDeleteConfirm}
        onView={handleViewAssessment}
        onRefresh={() => loadAssessments(pagination.currentPage)}
      />

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
