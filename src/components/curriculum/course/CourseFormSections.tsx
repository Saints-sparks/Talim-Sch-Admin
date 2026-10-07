import React from "react";
import { AlertCircle, BookOpen, Loader2, User } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { SearchSelect, type SearchOption } from "@/components/curriculum/SearchSelect";
import {
  Banner,
  describedByFor,
  eyebrow,
  fieldControl,
  fieldError,
  fieldHint,
  fieldLabel,
  ghostButton,
  primaryButton,
  textareaControl,
} from "@/components/tl";
import { getErrorMessage } from "@/lib/apiError";
import type { CourseForm } from "./courseForm";

/** The small uppercase heading over each group of fields. */
const SECTION_HEADING = `${eyebrow} mb-4 flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4`;

/** Sets one field of the course form. */
type SetField = <K extends keyof CourseForm>(field: K, value: CourseForm[K]) => void;

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
 * `aria-invalid` and `aria-describedby` for one control.
 *
 * @param id - The control's id.
 * @param message - Its error, if any.
 * @returns The attributes.
 */
function a11y(id: string, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": describedByFor(id, undefined, message),
  } as const;
}

/**
 * Title, code and description.
 *
 * @param props - The form, its server-side field errors and the setter.
 * @param props.form - The values.
 * @param props.fieldErrors - Errors keyed by field.
 * @param props.onChange - Sets a field.
 * @returns The section.
 */
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
        <BookOpen aria-hidden />
        Course Information
      </h3>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="course-title">
            Course Title *
          </label>
          <input
            id="course-title"
            type="text"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g., Algebra I"
            className={fieldControl}
            required
            {...a11y("course-title", fieldErrors.title)}
          />
          <FieldMessage id="course-title" message={fieldErrors.title} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Tooltip
            content="A short unique identifier for this course (e.g. MTH101). Used on timetables and assessments."
            side="right"
          >
            <label className={`${fieldLabel} w-fit`} htmlFor="course-code">
              Course Code *
            </label>
          </Tooltip>
          <input
            id="course-code"
            type="text"
            value={form.courseCode}
            onChange={(e) => onChange("courseCode", e.target.value)}
            placeholder="e.g., MATH101"
            className={fieldControl}
            required
            {...a11y("course-code", fieldErrors.courseCode)}
          />
          <FieldMessage id="course-code" message={fieldErrors.courseCode} />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className={fieldLabel} htmlFor="course-description">
            Description *
          </label>
          <textarea
            id="course-description"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Enter course description..."
            rows={3}
            className={`${textareaControl} resize-none`}
            {...a11y("course-description", fieldErrors.description)}
          />
          <FieldMessage id="course-description" message={fieldErrors.description} />
        </div>
      </div>
    </section>
  );
}

/**
 * A grey notice under a picker.
 *
 * @param props - The words.
 * @param props.children - The words.
 * @returns The notice.
 */
function EmptyNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-tl-line-soft bg-tl-subtle px-3 py-2.5 text-sm text-tl-muted">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Props for {@link CourseAssignmentSection}. */
interface AssignmentSectionProps {
  /** Add or edit. */
  mode: "add" | "edit";
  /** The values. */
  form: CourseForm;
  /** Sets a field. */
  onChange: SetField;
  /** The teacher picker's rows. */
  teacherOptions: SearchOption[];
  /** The class picker's rows. */
  classOptions: SearchOption[];
  /** How many teachers the school has. */
  teacherCount: number;
  /** How many classes the school has. */
  classCount: number;
  /** Name of the course's class, shown read-only when editing. */
  className: string;
  /** True while the teachers load. */
  teachersLoading: boolean;
  /** Why the teachers failed. */
  teachersError: unknown;
  /** True when the teachers failed. */
  teachersFailed: boolean;
  /** Loads the teachers again. */
  onRetryTeachers: () => void;
  /** True while the classes load. */
  classesLoading: boolean;
}

/**
 * Teacher and class pickers (the class is fixed once the course exists).
 *
 * @param props - See {@link AssignmentSectionProps}.
 * @param props.mode - Add or edit.
 * @param props.form - The values.
 * @param props.onChange - Sets a field.
 * @param props.teacherOptions - Teacher rows.
 * @param props.classOptions - Class rows.
 * @param props.teacherCount - Teachers in the school.
 * @param props.classCount - Classes in the school.
 * @param props.className - The fixed class's name.
 * @param props.teachersLoading - Whether teachers load.
 * @param props.teachersError - Why they failed.
 * @param props.teachersFailed - Whether they failed.
 * @param props.onRetryTeachers - Retries them.
 * @param props.classesLoading - Whether classes load.
 * @returns The section.
 */
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
        <User aria-hidden />
        Assignment Information
      </h3>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
        <div className="flex flex-col gap-2">
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
            <Banner
              tone="danger"
              action={
                <button
                  type="button"
                  onClick={onRetryTeachers}
                  className="min-h-[44px] text-sm font-bold text-tl-danger underline"
                >
                  Retry
                </button>
              }
            >
              {getErrorMessage(teachersError, "Could not load teachers.")}
            </Banner>
          )}
          {!teachersLoading && !teachersFailed && teacherCount === 0 && (
            <EmptyNotice>No teachers found. Please add teachers first.</EmptyNotice>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {mode === "edit" ? (
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel} htmlFor="course-class">
                Class *
              </label>
              <input
                id="course-class"
                type="text"
                value={className}
                readOnly
                disabled
                className={`${fieldControl} bg-tl-subtle`}
                placeholder="Class is fixed for existing courses"
                aria-describedby="course-class-hint"
              />
              <p id="course-class-hint" className={fieldHint}>
                Class cannot be changed for existing courses
              </p>
            </div>
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

/**
 * Cancel and save, along the bottom of the course sheet.
 *
 * @param props - The mode and the submit state.
 * @param props.mode - Add or edit.
 * @param props.isSubmitting - Whether the save runs.
 * @param props.canSubmit - Whether every required field is filled.
 * @param props.onCancel - Closes without saving.
 * @param props.onSubmit - Saves.
 * @returns The buttons.
 */
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
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className={`${ghostButton} min-h-[48px] flex-1 sm:flex-none`}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !canSubmit}
        className={`${primaryButton} min-h-[48px] flex-1 sm:ml-auto sm:flex-none`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {mode === "add" ? "Creating..." : "Updating..."}
          </>
        ) : (
          <>{mode === "add" ? "Create Course" : "Update Course"}</>
        )}
      </button>
    </>
  );
}
