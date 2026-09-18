"use client";

/**
 * Creates or edits an assessment.
 *
 * Presentational apart from its own validation: the page owns the mutation and
 * throws back a message, which the modal shows above the form so the draft
 * survives a failed save.
 */
import React, { useEffect, useState } from "react";
import { AlertCircle, Calendar, Clock, FileText, Target } from "lucide-react";
import TalimModal from "@/components/ui/TalimModal";
import TermSelector from "@/components/assessment/TermSelector";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  isWithinAssessmentPeriod,
  validateAssessmentForm,
  type AssessmentFormErrors,
} from "@/components/assessment/assessment.form";
import { assessmentService, ASSESSMENT_STATUSES } from "@/app/services/assessment.service";
import type { Assessment, AssessmentForm, Term } from "@/components/assessment/AssessmentForm.types";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface AssessmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Saves the assessment; rejects with a message the modal displays. */
  onSubmit: (assessmentData: AssessmentForm) => Promise<void>;
  terms: Term[];
  editingAssessment?: Assessment | null;
  loading?: boolean;
}

const EMPTY_FORM: AssessmentForm = {
  name: "",
  description: "",
  termId: "",
  startDate: "",
  endDate: "",
  status: "pending",
};

const labelClass = "flex items-center text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3";

/** Input classes, tinted when the field is in error. */
function inputClass(hasError: boolean): string {
  const base =
    "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100";
  return hasError
    ? `${base} border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30`
    : `${base} border-gray-200 dark:border-slate-700 focus:border-blue-300`;
}

/** The message under a field, or nothing. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      {message}
    </p>
  );
}

/** A date as the assessment period is described to the administrator. */
function readableDate(value: string): string {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

/**
 * Renders the create/edit modal.
 *
 * @param props - See {@link AssessmentCreateModalProps}.
 * @returns The modal.
 */
const AssessmentCreateModal: React.FC<AssessmentCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  terms,
  editingAssessment,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AssessmentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<AssessmentFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  /** The failure from the last save, shown above the form. */
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(editingAssessment);
  const isRunning = isWithinAssessmentPeriod(formData.startDate, formData.endDate);

  // TalimModal does not lock the page itself; the lock is counted, so doing it
  // here is safe even with another modal already open.
  useBodyScrollLock(isOpen);

  // Reload the form every time the modal opens or switches assessment.
  useEffect(() => {
    setFormData(
      editingAssessment
        ? {
            name: editingAssessment.name,
            description: editingAssessment.description || "",
            termId: editingAssessment.termId._id,
            // The inputs are `type="date"`, which only understands YYYY-MM-DD.
            startDate: editingAssessment.startDate.split("T")[0],
            endDate: editingAssessment.endDate.split("T")[0],
            status: editingAssessment.status,
          }
        : EMPTY_FORM,
    );
    setErrors({});
    setSubmitError(null);
  }, [editingAssessment, isOpen]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const next = { ...previous, [name]: value } as AssessmentForm;
      // Moving the dates out from around today makes "active" illegal; drop
      // back to pending rather than letting the server reject the save.
      if (
        (name === "startDate" || name === "endDate") &&
        previous.status === "active" &&
        !isWithinAssessmentPeriod(next.startDate, next.endDate)
      ) {
        next.status = "pending";
      }
      return next;
    });

    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleTermSelect = (termId: string) => {
    setFormData((previous) => ({ ...previous, termId }));
    setErrors((previous) => ({ ...previous, termId: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const found = validateAssessmentForm(formData, { isEditing });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        ...formData,
        startDate: assessmentService.formatDateForAPI(formData.startDate),
        endDate: assessmentService.formatDateForAPI(formData.endDate),
      });
      onClose();
    } catch (error) {
      // The draft stays on screen: the administrator can correct it and
      // resubmit rather than retyping the whole form.
      logger.error("assessments", "Assessment form submission failed", error);
      setSubmitError(getErrorMessage(error, "Could not save the assessment. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const footer = (
    <div className="flex justify-end space-x-4">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="px-6 py-2.5 text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-all duration-300 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="assessment-form"
        disabled={submitting}
        className="px-8 py-2.5 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {submitting ? (
          <span className="flex items-center">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            {isEditing ? "Updating..." : "Creating..."}
          </span>
        ) : isEditing ? (
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
      title={isEditing ? "Edit Assessment" : "Create New Assessment"}
      subtitle={
        isEditing
          ? "Update assessment details and settings"
          : "Set up a new assessment for your students"
      }
      icon={<Target className="h-6 w-6 text-white" />}
      footer={footer}
      isSubmitting={submitting}
    >
      <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
          >
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="assessment-name">
            <span className="w-8 h-8 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center mr-3">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </span>
            Assessment Name *
          </label>
          <input
            id="assessment-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={inputClass(Boolean(errors.name))}
            placeholder="e.g., First Term Examination 2025"
            disabled={submitting}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3"
            htmlFor="assessment-description"
          >
            Description (Optional)
          </label>
          <textarea
            id="assessment-description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className={`${inputClass(false)} resize-none`}
            placeholder="Provide additional details about this assessment..."
            disabled={submitting}
          />
        </div>

        <div>
          <Tooltip
            content="Filter assessments by academic term. Set the current term in Settings."
            side="right"
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
              Term *
            </label>
          </Tooltip>
          <div
            className={`rounded-xl border-2 ${
              errors.termId ? "border-red-300 dark:border-red-800" : "border-gray-200 dark:border-slate-700"
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
          <FieldError message={errors.termId} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass} htmlFor="assessment-start">
              <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </span>
              Start Date *
            </label>
            <input
              id="assessment-start"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              // An assessment already under way keeps its start date; only a
              // new one is held to today.
              min={isEditing ? undefined : new Date().toISOString().split("T")[0]}
              className={inputClass(Boolean(errors.startDate))}
              disabled={submitting}
            />
            <FieldError message={errors.startDate} />
          </div>

          <div>
            <label className={labelClass} htmlFor="assessment-end">
              <span className="w-8 h-8 bg-amber-100 dark:bg-amber-950/50 rounded-lg flex items-center justify-center mr-3">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </span>
              End Date *
            </label>
            <input
              id="assessment-end"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              min={formData.startDate || undefined}
              className={inputClass(Boolean(errors.endDate))}
              disabled={submitting}
            />
            <FieldError message={errors.endDate} />
          </div>
        </div>

        {isEditing && (
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3"
              htmlFor="assessment-status"
            >
              Status
            </label>
            <select
              id="assessment-status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={inputClass(Boolean(errors.status))}
              disabled={submitting}
            >
              {ASSESSMENT_STATUSES.map((status) => (
                <option
                  key={status}
                  value={status}
                  disabled={status === "active" && !isRunning}
                  className="capitalize"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === "active" && !isRunning
                    ? " (only during the assessment period)"
                    : ""}
                </option>
              ))}
            </select>
            <FieldError message={errors.status} />
            {!isRunning && (
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 flex items-center">
                <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                Assessment period: {readableDate(formData.startDate)} –{" "}
                {readableDate(formData.endDate)}
              </p>
            )}
          </div>
        )}
      </form>
    </TalimModal>
  );
};

export default AssessmentCreateModal;
