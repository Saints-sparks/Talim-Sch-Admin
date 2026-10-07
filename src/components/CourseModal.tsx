"use client";

import React from "react";
import { Sheet } from "@/components/tl";
import {
  CourseAssignmentSection,
  CourseFormFooter,
  CourseInfoSection,
} from "@/components/curriculum/course/CourseFormSections";
import { useCourseForm } from "@/components/curriculum/course/useCourseForm";
import type { CourseForModal } from "@/components/curriculum/course/courseForm";

export type { CourseForModal } from "@/components/curriculum/course/courseForm";

/** Props for {@link CourseModal}. */
interface CourseModalProps {
  /** Whether the sheet is shown. */
  isOpen: boolean;
  /** Closes it. */
  onClose: () => void;
  /** Called after a successful save, before the modal closes. */
  onSuccess: () => void;
  /** Add a course or edit one. */
  mode: "add" | "edit";
  /** The course being edited. */
  course?: CourseForModal | null;
  /** The subject a new course belongs to. */
  subjectId?: string;
  /** That subject's name, for the subtitle. */
  subjectName?: string;
  /** The class a new course starts in. */
  initialClassId?: string;
}

/**
 * Creates or edits a course inside a subject, in the design system's sheet
 * (named "Add course" or "Edit course").
 *
 * Teachers and classes come from the shared caches, so opening the modal
 * repeatedly costs no requests, and a successful save invalidates the subject,
 * course and class lists rather than asking the page to refetch.
 *
 * @param props - See {@link CourseModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onSuccess - Called after a save.
 * @param props.mode - Add or edit.
 * @param props.course - The course being edited.
 * @param props.subjectId - The new course's subject.
 * @param props.subjectName - That subject's name.
 * @param props.initialClassId - The new course's class.
 * @returns The sheet, or null while closed.
 */
const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  course,
  subjectId,
  subjectName,
  initialClassId,
}) => {
  const state = useCourseForm({
    isOpen,
    mode,
    course,
    subjectId,
    initialClassId,
    onClose,
    onSuccess,
  });
  const { form, teachersQuery, classesQuery } = state;

  if (!isOpen) return null;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(next) => !next && state.close()}
      dismissible={!state.isSubmitting}
      eyebrowText={subjectName ? `Curriculum · ${subjectName}` : "Curriculum"}
      title={mode === "add" ? "Add New Course" : "Edit Course"}
      ariaLabel={mode === "add" ? "Add course" : "Edit course"}
      subtitle={
        mode === "add" && subjectName
          ? `Create a new course for ${subjectName}`
          : mode === "add"
            ? "Create a new course"
            : "Update the course information"
      }
      size="lg"
      footer={
        <CourseFormFooter
          mode={mode}
          isSubmitting={state.isSubmitting}
          canSubmit={state.missingFields.length === 0}
          onCancel={state.close}
          onSubmit={state.submit}
        />
      }
    >
      <CourseInfoSection form={form} fieldErrors={state.fieldErrors} onChange={state.setField} />
      <CourseAssignmentSection
        mode={mode}
        form={form}
        onChange={state.setField}
        teacherOptions={state.teacherOptions}
        classOptions={state.classOptions}
        teacherCount={state.teachers.length}
        classCount={state.classes.length}
        className={state.classes.find((c) => c._id === form.classId)?.name ?? ""}
        teachersLoading={teachersQuery.isLoading}
        teachersError={teachersQuery.error}
        teachersFailed={teachersQuery.isError}
        onRetryTeachers={() => teachersQuery.refetch()}
        classesLoading={classesQuery.isLoading}
      />
    </Sheet>
  );
};

export default CourseModal;
