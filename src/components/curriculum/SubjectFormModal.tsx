"use client";

/**
 * Creates or renames a subject.
 *
 * Owns the whole write: it runs the mutation itself, so the page only has to
 * say which subject is being edited. The mutations invalidate the subject,
 * course and KPI caches, so nothing here asks a caller to refetch.
 */
import React, { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import TalimModal from "@/components/ui/TalimModal";
import { Tooltip } from "@/components/ui/Tooltip";
import { toast } from "@/components/CustomToast";
import { useSubjectMutations } from "@/hooks/curriculum/queries";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import type { Subject } from "@/app/services/subjects.service";

interface SubjectFormModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  /** The subject being edited; ignored in "add" mode. */
  subject?: Subject | null;
  onClose: () => void;
  /** Called after the subject has been saved. */
  onSaved?: () => void;
}

/**
 * The form's own state.
 *
 * Exactly the two fields the backend `Subject` carries — it has no class of
 * its own, a course is what binds a subject to a class.
 */
interface SubjectForm {
  name: string;
  code: string;
}

const EMPTY_FORM: SubjectForm = { name: "", code: "" };

/**
 * Renders the subject modal.
 *
 * @param props - See {@link SubjectFormModalProps}.
 * @returns The modal.
 */
export function SubjectFormModal({
  isOpen,
  mode,
  subject,
  onClose,
  onSaved,
}: SubjectFormModalProps) {
  const { create, update } = useSubjectMutations();
  const [form, setForm] = useState<SubjectForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSubmitting = create.isPending || update.isPending;

  // Reload the form every time the modal opens, so a cancelled edit never
  // leaks into the next one.
  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setForm(mode === "edit" && subject ? { name: subject.name, code: subject.code } : EMPTY_FORM);
  }, [isOpen, mode, subject]);

  const canSubmit = form.name.trim().length > 0 && form.code.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setFieldErrors({});
    const payload = { name: form.name.trim(), code: form.code.trim() };

    try {
      if (mode === "add") await create.mutateAsync(payload);
      else if (subject) await update.mutateAsync({ subjectId: subject._id, payload });

      toast.success(`Subject ${mode === "add" ? "created" : "updated"} successfully!`);
      onSaved?.();
      onClose();
    } catch (error) {
      logger.error("curriculum", `Failed to ${mode} subject`, error);
      if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
        setFieldErrors(error.fieldErrors());
      }
      toast.error(
        getErrorMessage(
          error,
          mode === "add" ? "Failed to create subject" : "Failed to update subject",
        ),
      );
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2";

  return (
    <TalimModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add" ? "Add New Subject" : "Edit Subject"}
      subtitle={
        mode === "add"
          ? "Create a new subject to organize your courses"
          : "Update the subject information"
      }
      icon={<BookOpen className="w-5 h-5 text-white" />}
      isSubmitting={isSubmitting}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-100 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className="px-6 py-3 bg-[#003366] text-white rounded-xl hover:bg-[#002244] transition-all duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "add" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "add" ? "Create Subject" : "Update Subject"}</>
            )}
          </button>
        </div>
      }
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-6 uppercase tracking-wide flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#003366] dark:text-blue-400" />
          Subject Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass} htmlFor="subject-name">
              Subject Name *
            </label>
            <input
              id="subject-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g., Mathematics"
              className={inputClass}
              required
            />
            {fieldErrors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Tooltip
              content="A short unique identifier for the subject (e.g. MTH, ENG). Used on reports and timetables."
              side="right"
            >
              <label className={labelClass} htmlFor="subject-code">
                Subject Code *
              </label>
            </Tooltip>
            <input
              id="subject-code"
              type="text"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="e.g., MATH"
              className={inputClass}
              required
            />
            {fieldErrors.code && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.code}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              A subject reaches a class through its courses — add a course to this subject to teach
              it to a class.
            </p>
          </div>
        </div>
      </div>
    </TalimModal>
  );
}
