"use client";

/**
 * Creates a class, in the design system's sheet.
 *
 * Owns the write: it runs the mutation, which invalidates the class caches, so
 * the grid behind it updates without the page refetching. Validation mirrors
 * `CreateClassDto` so the form refuses before the request does.
 */
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { InlineSpinner } from "@/components/ui/loading";
import {
  Sheet,
  describedByFor,
  fieldControl,
  fieldError,
  fieldLabel,
  ghostButton,
  primaryButton,
  textareaControl,
} from "@/components/tl";
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

/** Props for {@link ClassFormModal}. */
interface ClassFormModalProps {
  /** Whether the sheet is shown. */
  isOpen: boolean;
  /** Closes it (Cancel, Escape, the close button, the overlay). */
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

/** The form's id, so the footer's submit button can sit outside it. */
const FORM_ID = "create-class-form";

/**
 * The red line under a field, tied to it by id.
 *
 * @param props - The control's id and its message.
 * @param props.id - The control's id.
 * @param props.message - The error, if any.
 * @returns The message, or null.
 */
function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={fieldError}>
      {message}
    </p>
  );
}

/**
 * Renders the create-class sheet, or nothing when closed.
 *
 * @param props - See {@link ClassFormModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onCreated - Called after a successful create.
 * @returns The sheet.
 */
export function ClassFormModal({ isOpen, onClose, onCreated }: ClassFormModalProps) {
  const { create } = useClassMutations();
  const [form, setForm] = useState<ClassPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<ClassFormErrors>({});

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

  /**
   * `aria-invalid` and `aria-describedby` for one control.
   *
   * @param id - The control's id.
   * @param message - Its error, if any.
   * @returns The attributes.
   */
  const a11y = (id: string, message?: string) => ({
    "aria-invalid": message ? true : undefined,
    "aria-describedby": describedByFor(id, undefined, message),
  });

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(next) => !next && onClose()}
      dismissible={!create.isPending}
      eyebrowText="Classes"
      title="Create New Class"
      ariaLabel="Create new class"
      subtitle="Name the class and set its grade and capacity. Students, teachers and courses come afterwards."
      size="lg"
      footer={
        <>
          <button
            type="button"
            className={`${ghostButton} min-h-[48px] flex-1 sm:flex-none`}
            onClick={onClose}
            disabled={create.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className={`${primaryButton} min-h-[48px] flex-1 sm:ml-auto sm:flex-none`}
            disabled={create.isPending}
          >
            {create.isPending ? (
              <InlineSpinner label="Creating Class..." className="text-tl-on-brand" />
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Create Class
              </>
            )}
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="class-name">
              Class Name *
            </label>
            <input
              id="class-name"
              type="text"
              data-autofocus
              placeholder="Enter class name"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              className={fieldControl}
              {...a11y("class-name", errors.name)}
            />
            <FieldMessage id="class-name" message={errors.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Tooltip
              content="Optional grouping (e.g. Grade 1–12). Used for filtering and reporting."
              side="right"
            >
              <label className={`${fieldLabel} w-fit`} htmlFor="class-grade">
                Grade Level *
              </label>
            </Tooltip>
            <select
              id="class-grade"
              value={form.gradeLevel}
              onChange={(event) => setField("gradeLevel", event.target.value)}
              className={fieldControl}
              {...a11y("class-grade", errors.gradeLevel)}
            >
              <option value="">Select grade</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <FieldMessage id="class-grade" message={errors.gradeLevel} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Tooltip
              content="Maximum students that can be enrolled. Students beyond this limit will be flagged during enrolment."
              side="right"
            >
              <label className={`${fieldLabel} w-fit`} htmlFor="class-capacity">
                Class Capacity *
              </label>
            </Tooltip>
            <select
              id="class-capacity"
              value={form.classCapacity}
              onChange={(event) => setField("classCapacity", event.target.value)}
              className={fieldControl}
              {...a11y("class-capacity", errors.classCapacity)}
            >
              <option value="">Choose capacity</option>
              {CAPACITY_OPTIONS.map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity} Students
                </option>
              ))}
            </select>
            <FieldMessage id="class-capacity" message={errors.classCapacity} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="class-description">
            Class Description
          </label>
          <textarea
            id="class-description"
            placeholder="Provide additional notes about the class"
            value={form.classDescription}
            onChange={(event) => setField("classDescription", event.target.value)}
            className={`${textareaControl} resize-none`}
            rows={4}
          />
        </div>
      </form>
    </Sheet>
  );
}
