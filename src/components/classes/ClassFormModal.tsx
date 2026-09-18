"use client";

/**
 * Creates a class.
 *
 * Owns the write: it runs the mutation, which invalidates the class caches, so
 * the grid behind it updates without the page refetching. Validation mirrors
 * `CreateClassDto` so the form refuses before the request does.
 */
import React, { useEffect, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { InlineSpinner } from "@/components/ui/loading";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useClassMutations } from "@/hooks/classes/queries";
import {
  CAPACITY_OPTIONS,
  GRADE_OPTIONS,
  validateClassForm,
  type ClassFormErrors,
  type ClassPayload,
} from "@/components/classes/class.model";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the class has been created. */
  onCreated?: () => void;
}

const EMPTY_FORM: ClassPayload = {
  name: "",
  gradeLevel: "",
  classDescription: "",
  classCapacity: "",
};

/**
 * Renders the create-class modal, or nothing when closed.
 *
 * @param props - See {@link ClassFormModalProps}.
 * @returns The modal.
 */
export function ClassFormModal({ isOpen, onClose, onCreated }: ClassFormModalProps) {
  const { create } = useClassMutations();
  const [form, setForm] = useState<ClassPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<ClassFormErrors>({});

  useBodyScrollLock(isOpen);

  // Start from a blank form each time, so a cancelled draft never reappears.
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
  }, [isOpen]);

  const setField = (field: keyof ClassPayload, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const found = validateClassForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await create.mutateAsync({
        name: form.name.trim(),
        gradeLevel: form.gradeLevel,
        classDescription: form.classDescription.trim(),
        classCapacity: form.classCapacity,
      });
      toast.success("Class created successfully!");
      onCreated?.();
      onClose();
    } catch (error) {
      logger.error("classes", "Failed to create class", error);
      if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
        setErrors(error.fieldErrors() as ClassFormErrors);
      }
      toast.error(getErrorMessage(error, "Could not create the class. Please try again."));
    }
  };

  if (!isOpen) return null;

  const fieldClass =
    "w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelClass = "block text-gray-700 dark:text-slate-200 font-semibold mb-2";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create new class"
      onClick={create.isPending ? undefined : onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sticky top-0 px-6 py-5 rounded-t-2xl z-10"
          style={{ background: "linear-gradient(to right, #003366, #004488)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <FiPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Create New Class</h3>
            </div>
            <button
              type="button"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={create.isPending}
              aria-label="Close"
            >
              <FiX className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6" noValidate>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass} htmlFor="class-name">
                  Class Name *
                </label>
                <input
                  id="class-name"
                  type="text"
                  placeholder="Enter class name"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className={fieldClass}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Tooltip
                  content="Optional grouping (e.g. Grade 1–12). Used for filtering and reporting."
                  side="right"
                >
                  <label className={labelClass} htmlFor="class-grade">
                    Grade Level *
                  </label>
                </Tooltip>
                <select
                  id="class-grade"
                  value={form.gradeLevel}
                  onChange={(event) => setField("gradeLevel", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select grade</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                {errors.gradeLevel && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.gradeLevel}</p>
                )}
              </div>

              <div>
                <Tooltip
                  content="Maximum students that can be enrolled. Students beyond this limit will be flagged during enrolment."
                  side="right"
                >
                  <label className={labelClass} htmlFor="class-capacity">
                    Class Capacity *
                  </label>
                </Tooltip>
                <select
                  id="class-capacity"
                  value={form.classCapacity}
                  onChange={(event) => setField("classCapacity", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Choose capacity</option>
                  {CAPACITY_OPTIONS.map((capacity) => (
                    <option key={capacity} value={capacity}>
                      {capacity} Students
                    </option>
                  ))}
                </select>
                {errors.classCapacity && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.classCapacity}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="class-description">
                Class Description
              </label>
              <textarea
                id="class-description"
                placeholder="Provide additional notes about the class"
                value={form.classDescription}
                onChange={(event) => setField("classDescription", event.target.value)}
                className={`${fieldClass} resize-none`}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300 disabled:opacity-50"
              onClick={onClose}
              disabled={create.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:opacity-90"
              style={{ background: "linear-gradient(to right, #003366, #004488)" }}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <InlineSpinner label="Creating Class..." className="text-white" />
              ) : (
                <>
                  <FiPlus className="mr-2 h-5 w-5" />
                  Create Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
