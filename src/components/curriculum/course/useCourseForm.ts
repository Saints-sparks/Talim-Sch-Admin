"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/CustomToast";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useClasses } from "@/hooks/queries/reference";
import { useCourseMutations, useTeacherOptions } from "@/hooks/curriculum/queries";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  classSearchOptions,
  initialCourseForm,
  missingCourseFields,
  teacherSearchOptions,
  toCreatePayload,
  toUpdatePayload,
  type CourseForm,
  type CourseForModal,
} from "./courseForm";

interface UseCourseFormArgs {
  isOpen: boolean;
  mode: "add" | "edit";
  course?: CourseForModal | null;
  subjectId?: string;
  initialClassId?: string;
  onClose: () => void;
  /** Called after a successful save, before the modal closes. */
  onSuccess: () => void;
}

/**
 * Everything the add/edit course modal needs: the form, the pickers' data,
 * validation and the save.
 *
 * Teachers and classes come from the shared caches, so opening the modal
 * repeatedly costs no requests, and a save invalidates the subject, course and
 * class lists. The form resets whenever the modal opens, so a cancelled edit
 * never leaks into the next one. Body scroll is locked while it is open.
 *
 * @param args - Open state, mode, the course and page context, and callbacks.
 * @returns The form state, picker data and handlers.
 */
export function useCourseForm({ isOpen, mode, course, subjectId, initialClassId, onClose, onSuccess }: UseCourseFormArgs) {
  const teachersQuery = useTeacherOptions();
  const classesQuery = useClasses();
  const { create, update } = useCourseMutations();

  const [form, setForm] = useState<CourseForm>(() => initialCourseForm(mode, course, subjectId, initialClassId));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useBodyScrollLock(isOpen);

  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const isSubmitting = create.isPending || update.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setForm(initialCourseForm(mode, course, subjectId, initialClassId));
  }, [isOpen, mode, course, subjectId, initialClassId]);

  const teacherOptions = useMemo(() => teacherSearchOptions(teachers), [teachers]);
  const classOptions = useMemo(() => classSearchOptions(classes), [classes]);
  const missingFields = missingCourseFields(form);

  /** Sets one field of the form. */
  const setField = <K extends keyof CourseForm>(field: K, value: CourseForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const close = () => {
    setFieldErrors({});
    onClose();
  };

  const submit = async () => {
    if (missingFields.length > 0) {
      toast.error(`Please complete: ${missingFields.join(", ")}`);
      return;
    }

    setFieldErrors({});
    try {
      if (mode === "add") {
        await create.mutateAsync(toCreatePayload(form));
      } else if (course) {
        await update.mutateAsync({ courseId: course._id, payload: toUpdatePayload(form) });
      }

      toast.success(`Course ${mode === "add" ? "created" : "updated"} successfully!`);
      onSuccess();
      close();
    } catch (error) {
      logger.error("curriculum", `Failed to ${mode} course`, error);
      if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
        setFieldErrors(error.fieldErrors());
      }
      toast.error(getErrorMessage(error, `Failed to ${mode} course. Please check the required fields.`));
    }
  };

  return {
    form,
    setField,
    fieldErrors,
    teachers,
    classes,
    teachersQuery,
    classesQuery,
    teacherOptions,
    classOptions,
    missingFields,
    isSubmitting,
    close,
    submit,
  };
}
