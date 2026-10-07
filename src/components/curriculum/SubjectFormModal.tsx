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
import {
  describedByFor,
  eyebrow,
  fieldControl,
  fieldError,
  fieldHint,
  fieldLabel,
  ghostButton,
  primaryButton,
} from "@/components/tl";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import type { Subject } from "@/app/services/subjects.service";

/** Props for {@link SubjectFormModal}. */
interface SubjectFormModalProps {
  /** Whether the modal is shown. */
  isOpen: boolean;
  /** Create a subject or rename one. */
  mode: "add" | "edit";
  /** The subject being edited; ignored in "add" mode. */
  subject?: Subject | null;
  /** Closes it. */
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
  /** The subject's name. */
  name: string;
  /** Its short code. */
  code: string;
}

const EMPTY_FORM: SubjectForm = { name: "", code: "" };

/**
 * Renders the subject modal: name and code, Cancel and Create/Update.
 *
 * @param props - See {@link SubjectFormModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.mode - Add or edit.
 * @param props.subject - The subject being edited.
 * @param props.onClose - Closes it.
 * @param props.onSaved - Called after a save.
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

  // TalimModal locks the page itself while it is open.

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
          mode === "add" ? "Failed to create subject" : "Failed to update subject"
        )
      );
    }
  };

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
      icon={<BookOpen className="h-5 w-5" aria-hidden />}
      isSubmitting={isSubmitting}
      footer={
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className={ghostButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className={primaryButton}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
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
        <h3 className={`${eyebrow} mb-4 flex items-center gap-2`}>
          <BookOpen className="h-4 w-4" aria-hidden />
          Subject Information
        </h3>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="subject-name">
              Subject Name *
            </label>
            <input
              id="subject-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g., Mathematics"
              className={fieldControl}
              required
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={describedByFor("subject-name", undefined, fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p id="subject-name-error" className={fieldError}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Tooltip
              content="A short unique identifier for the subject (e.g. MTH, ENG). Used on reports and timetables."
              side="right"
            >
              <label className={`${fieldLabel} w-fit`} htmlFor="subject-code">
                Subject Code *
              </label>
            </Tooltip>
            <input
              id="subject-code"
              type="text"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="e.g., MATH"
              className={fieldControl}
              required
              aria-invalid={fieldErrors.code ? true : undefined}
              aria-describedby={describedByFor("subject-code", undefined, fieldErrors.code)}
            />
            {fieldErrors.code && (
              <p id="subject-code-error" className={fieldError}>
                {fieldErrors.code}
              </p>
            )}
          </div>

          <p className={`${fieldHint} md:col-span-2`}>
            A subject reaches a class through its courses — add a course to this subject to teach it
            to a class.
          </p>
        </div>
      </div>
    </TalimModal>
  );
}
