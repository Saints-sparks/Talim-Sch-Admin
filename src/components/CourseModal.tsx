"use client";

import React from "react";
import {
  CourseAssignmentSection,
  CourseFormFooter,
  CourseInfoSection,
  CourseModalHeader,
} from "@/components/curriculum/course/CourseFormSections";
import { useCourseForm } from "@/components/curriculum/course/useCourseForm";
import type { CourseForModal } from "@/components/curriculum/course/courseForm";

export type { CourseForModal } from "@/components/curriculum/course/courseForm";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save, before the modal closes. */
  onSuccess: () => void;
  mode: "add" | "edit";
  course?: CourseForModal | null;
  subjectId?: string;
  subjectName?: string;
  initialClassId?: string;
}

/**
 * Creates or edits a course inside a subject.
 *
 * Teachers and classes come from the shared caches, so opening the modal
 * repeatedly costs no requests, and a successful save invalidates the subject,
 * course and class lists rather than asking the page to refetch.
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
  const state = useCourseForm({ isOpen, mode, course, subjectId, initialClassId, onClose, onSuccess });
  const { form, teachersQuery, classesQuery } = state;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "add" ? "Add course" : "Edit course"}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <CourseModalHeader
          mode={mode}
          subjectName={subjectName}
          isSubmitting={state.isSubmitting}
          onClose={state.close}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
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
            <CourseFormFooter
              mode={mode}
              isSubmitting={state.isSubmitting}
              canSubmit={state.missingFields.length === 0}
              onCancel={state.close}
              onSubmit={state.submit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
