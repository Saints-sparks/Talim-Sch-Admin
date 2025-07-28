"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { Assessment, AssessmentForm, Term } from '@/components/assessment/AssessmentForm.types';
import TermSelector from './TermSelector';
import { assessmentService } from '@/app/services/assessment.service';

interface AssessmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assessmentData: AssessmentForm) => Promise<void>;
  terms: Term[];
  editingAssessment?: Assessment | null;
  loading?: boolean;
}

const AssessmentCreateModal: React.FC<AssessmentCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  terms,
  editingAssessment,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AssessmentForm>({
    name: '',
    description: '',
    termId: '',
    startDate: '',
    endDate: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState<Partial<AssessmentForm>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingAssessment) {
      setFormData({
        name: editingAssessment.name,
        description: editingAssessment.description || '',
        termId: editingAssessment.termId._id,
        startDate: editingAssessment.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: editingAssessment.endDate.split('T')[0],
        status: editingAssessment.status,
      });
    } else {
      // Reset form for new assessment
      setFormData({
        name: '',
        description: '',
        termId: '',
        startDate: '',
        endDate: '',
        status: 'pending',
      });
    }
    setErrors({});
  }, [editingAssessment, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AssessmentForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Assessment name is required';
    }

    if (!formData.termId) {
      newErrors.termId = 'Term selection is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const validation = assessmentService.validateAssessmentDates(
        formData.startDate,
        formData.endDate
      );
      if (!validation.isValid) {
        newErrors.endDate = validation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        startDate: assessmentService.formatDateForAPI(formData.startDate),
        endDate: assessmentService.formatDateForAPI(formData.endDate),
      });
      onClose();
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof AssessmentForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTermSelect = (termId: string) => {
    setFormData(prev => ({ ...prev, termId }));
    if (errors.termId) {
      setErrors(prev => ({ ...prev, termId: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Assessment Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2" />
              Assessment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., First Term Examination 2025"
              disabled={submitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide additional details about this assessment..."
              disabled={submitting}
            />
          </div>

          {/* Term Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term *
            </label>
            <TermSelector
              terms={terms}
              selectedTermId={formData.termId}
              onTermSelect={handleTermSelect}
              loading={loading}
              placeholder="Select assessment term"
              className={errors.termId ? 'border-red-500' : ''}
            />
            {errors.termId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.termId}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 mr-2" />
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Status (only for editing) */}
          {editingAssessment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingAssessment ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                editingAssessment ? 'Update Assessment' : 'Create Assessment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentCreateModal;
