"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, FileText, AlertCircle, Target } from "lucide-react";
import TalimModal from "@/components/ui/TalimModal";
import {
  Assessment,
  AssessmentForm,
  Term,
} from "@/components/assessment/AssessmentForm.types";
import TermSelector from "./TermSelector";
import { assessmentService } from "@/app/services/assessment.service";

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
    name: "",
    description: "",
    termId: "",
    startDate: "",
    endDate: "",
    status: "pending",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AssessmentForm, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  // Helper function to check if assessment is currently active (within date range)
  const isAssessmentCurrentlyActive = (): boolean => {
    if (!formData.startDate || !formData.endDate) return false;

    const today = new Date();
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    // Set time to midnight for accurate date comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return today >= startDate && today <= endDate;
  };

  useEffect(() => {
    if (editingAssessment) {
      setFormData({
        name: editingAssessment.name,
        description: editingAssessment.description || "",
        termId: editingAssessment.termId._id,
        startDate: editingAssessment.startDate.split("T")[0], // Convert to YYYY-MM-DD format
        endDate: editingAssessment.endDate.split("T")[0],
        status: editingAssessment.status,
      });
    } else {
      // Reset form for new assessment
      setFormData({
        name: "",
        description: "",
        termId: "",
        startDate: "",
        endDate: "",
        status: "pending",
      });
    }
    setErrors({});
  }, [editingAssessment, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AssessmentForm, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Assessment name is required";
    }

    if (!formData.termId) {
      newErrors.termId = "Term selection is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    } else if (!editingAssessment) {
      // Only validate past dates for new assessments
      const today = new Date().toISOString().split("T")[0];
      if (formData.startDate < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
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

    // Validate status - cannot be active if not within date range
    if (formData.status === "active" && !isAssessmentCurrentlyActive()) {
      newErrors.status =
        "Assessment can only be set to 'Active' during its scheduled period";
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
      console.error("Error submitting assessment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };

      // If dates are being changed and status is active, check if it should remain active
      if (
        (name === "startDate" || name === "endDate") &&
        prev.status === "active"
      ) {
        const tempFormData = { ...newFormData };

        // Check if assessment would still be active with new dates
        if (tempFormData.startDate && tempFormData.endDate) {
          const today = new Date();
          const startDate = new Date(tempFormData.startDate);
          const endDate = new Date(tempFormData.endDate);

          today.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          const isStillActive = today >= startDate && today <= endDate;

          // If assessment is no longer within active period, change status to pending
          if (!isStillActive) {
            newFormData.status = "pending";
          }
        }
      }

      return newFormData;
    });
    // Clear error when user starts typing
    if (errors[name as keyof AssessmentForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTermSelect = (termId: string) => {
    setFormData((prev) => ({ ...prev, termId }));
    if (errors.termId) {
      setErrors((prev) => ({ ...prev, termId: undefined }));
    }
  };

  if (!isOpen) return null;

  const modalFooter = (
    <div className="flex justify-end space-x-4">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300"
        disabled={submitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        form="assessment-form"
        className="px-8 py-2.5 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        disabled={submitting}
      >
        {submitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {editingAssessment ? "Updating..." : "Creating..."}
          </div>
        ) : editingAssessment ? (
          "Update Assessment"
        ) : (
          "Create Assessment"
        )}
      </button>
    </div>
  );

  return (
    <TalimModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAssessment ? "Edit Assessment" : "Create New Assessment"}
      subtitle={
        editingAssessment
          ? "Update assessment details and settings"
          : "Set up a new assessment for your students"
      }
      icon={<Target className="h-6 w-6 text-white" />}
      footer={modalFooter}
      isSubmitting={submitting}
    >
      <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Assessment Name */}
        <div>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            Assessment Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
              errors.name
                ? "border-red-300 bg-red-50"
                : "border-gray-200 focus:border-blue-300"
            }`}
            placeholder="e.g., First Term Examination 2025"
            disabled={submitting}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300 resize-none"
            placeholder="Provide additional details about this assessment..."
            disabled={submitting}
          />
        </div>

        {/* Term Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Term *
          </label>
          <div
            className={`rounded-xl border-2 ${
              errors.termId ? "border-red-300" : "border-gray-200"
            }`}
          >
            <TermSelector
              terms={terms}
              selectedTermId={formData.termId}
              onTermSelect={handleTermSelect}
              loading={loading}
              placeholder="Select assessment term"
              className="border-0 rounded-xl"
            />
          </div>
          {errors.termId && (
            <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {errors.termId}
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              min={
                !editingAssessment
                  ? new Date().toISOString().split("T")[0]
                  : undefined
              }
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                errors.startDate
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 focus:border-blue-300"
              }`}
              disabled={submitting}
            />
            {errors.startDate && (
              <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {errors.startDate}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                errors.endDate
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 focus:border-blue-300"
              }`}
              disabled={submitting}
            />
            {errors.endDate && (
              <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {errors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Status (only for editing) */}
        {editingAssessment && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
              disabled={submitting}
            >
              <option value="pending">Pending</option>
              <option value="active" disabled={!isAssessmentCurrentlyActive()}>
                Active{" "}
                {!isAssessmentCurrentlyActive()
                  ? "(Only available during assessment period)"
                  : ""}
              </option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {errors.status && (
              <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {errors.status}
              </p>
            )}
            {!isAssessmentCurrentlyActive() && formData.status === "active" && (
              <p className="mt-2 text-sm text-amber-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Assessment can only be set to "Active" during its scheduled
                period ({new Date(
                  formData.startDate
                ).toLocaleDateString()} -{" "}
                {new Date(formData.endDate).toLocaleDateString()})
              </p>
            )}
            {!isAssessmentCurrentlyActive() && (
              <p className="mt-2 text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Assessment period:{" "}
                {formData.startDate
                  ? new Date(formData.startDate).toLocaleDateString()
                  : "Not set"}{" "}
                -{" "}
                {formData.endDate
                  ? new Date(formData.endDate).toLocaleDateString()
                  : "Not set"}
              </p>
            )}
          </div>
        )}
      </form>
    </TalimModal>
  );
};

export default AssessmentCreateModal;
