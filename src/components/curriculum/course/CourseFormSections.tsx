import React from "react";
import { AlertCircle, BookOpen, Loader2, User, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { SearchSelect, type SearchOption } from "@/components/curriculum/SearchSelect";
import { getErrorMessage } from "@/lib/apiError";
import type { CourseForm } from "./courseForm";

const INPUT_CLASS =
  "w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2";
const SECTION_HEADING =
  "text-sm font-semibold text-gray-700 dark:text-slate-200 mb-6 uppercase tracking-wide flex items-center gap-2";

type SetField = <K extends keyof CourseForm>(field: K, value: CourseForm[K]) => void;

/** The gradient title bar with the close button. */
export function CourseModalHeader({
  mode,
  subjectName,
  isSubmitting,
  onClose,
}: {
  mode: "add" | "edit";
  subjectName?: string;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white relative overflow-hidden flex-shrink-0">
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{mode === "add" ? "Add New Course" : "Edit Course"}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {mode === "add" && subjectName
                ? `Create a new course for ${subjectName}`
                : mode === "add"
                  ? "Create a new course"
                  : "Update the course information"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close"
          className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/** Title, code and description. */
export function CourseInfoSection({
  form,
  fieldErrors,
  onChange,
}: {
  form: CourseForm;
  fieldErrors: Record<string, string>;
  onChange: SetField;
}) {
  return (
    <section>
      <h3 className={SECTION_HEADING}>
        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        Course Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={LABEL_CLASS} htmlFor="course-title">
            Course Title *
          </label>
          <input
            id="course-title"
            type="text"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g., Algebra I"
            className={INPUT_CLASS}
            required
          />
          {fieldErrors.title && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.title}</p>}
        </div>

        <div>
          <Tooltip
            content="A short unique identifier for this course (e.g. MTH101). Used on timetables and assessments."
            side="right"
          >
            <label className={LABEL_CLASS} htmlFor="course-code">
              Course Code *
            </label>
          </Tooltip>
          <input
            id="course-code"
            type="text"
            value={form.courseCode}
            onChange={(e) => onChange("courseCode", e.target.value)}
            placeholder="e.g., MATH101"
            className={INPUT_CLASS}
            required
          />
          {fieldErrors.courseCode && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.courseCode}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className={LABEL_CLASS} htmlFor="course-description">
            Description *
          </label>
          <textarea
            id="course-description"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Enter course description..."
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
          />
          {fieldErrors.description && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** A grey notice under a picker. */
function EmptyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
      <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
      <div className="text-sm text-gray-600 dark:text-slate-300">{children}</div>
    </div>
  );
}

interface AssignmentSectionProps {
  mode: "add" | "edit";
  form: CourseForm;
  onChange: SetField;
  teacherOptions: SearchOption[];
  classOptions: SearchOption[];
  teacherCount: number;
  classCount: number;
  /** Name of the course's class, shown read-only when editing. */
  className: string;
  teachersLoading: boolean;
  teachersError: unknown;
  teachersFailed: boolean;
  onRetryTeachers: () => void;
  classesLoading: boolean;
}

/** Teacher and class pickers (the class is fixed once the course exists). */
export function CourseAssignmentSection({
  mode,
  form,
  onChange,
  teacherOptions,
  classOptions,
  teacherCount,
  classCount,
  className,
  teachersLoading,
  teachersError,
  teachersFailed,
  onRetryTeachers,
  classesLoading,
}: AssignmentSectionProps) {
  return (
    <section>
      <h3 className={SECTION_HEADING}>
        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        Assignment Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SearchSelect
            id="course-teacher"
            label="Assigned Teacher *"
            options={teacherOptions}
            value={form.teacherId}
            onChange={(teacherId) => onChange("teacherId", teacherId)}
            isLoading={teachersLoading}
            loadingLabel="Loading teachers..."
            emptyLabel="No teachers available"
            placeholder="Search and select a teacher..."
          />
          {teachersFailed && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                {getErrorMessage(teachersError, "Could not load teachers.")}{" "}
                <button type="button" onClick={onRetryTeachers} className="underline">
                  Retry
                </button>
              </div>
            </div>
          )}
          {!teachersLoading && !teachersFailed && teacherCount === 0 && (
            <EmptyNotice>No teachers found. Please add teachers first.</EmptyNotice>
          )}
        </div>

        <div>
          {mode === "edit" ? (
            <>
              <label className={LABEL_CLASS} htmlFor="course-class">
                Class *
              </label>
              <input
                id="course-class"
                type="text"
                value={className}
                readOnly
                disabled
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl cursor-not-allowed text-gray-500 dark:text-slate-400"
                placeholder="Class is fixed for existing courses"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Class cannot be changed for existing courses
              </p>
            </>
          ) : (
            <SearchSelect
              id="course-class"
              label="Class *"
              options={classOptions}
              value={form.classId}
              onChange={(classId) => onChange("classId", classId)}
              isLoading={classesLoading}
              loadingLabel="Loading classes..."
              emptyLabel="No classes available"
              placeholder="Search and select a class..."
            />
          )}
          {!classesLoading && classCount === 0 && (
            <EmptyNotice>No classes found. Please add classes first.</EmptyNotice>
          )}
        </div>
      </div>
    </section>
  );
}

/** Cancel and save. */
export function CourseFormFooter({
  mode,
  isSubmitting,
  canSubmit,
  onCancel,
  onSubmit,
}: {
  mode: "add" | "edit";
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-100 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !canSubmit}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === "add" ? "Creating..." : "Updating..."}
          </>
        ) : (
          <>{mode === "add" ? "Create Course" : "Update Course"}</>
        )}
      </button>
    </div>
  );
}
