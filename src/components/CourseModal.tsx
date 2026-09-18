"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/CustomToast";
import { X, AlertCircle, Loader2, BookOpen, User } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useClasses } from "@/hooks/queries/reference";
import { useCourseMutations, useTeacherOptions } from "@/hooks/curriculum/queries";
import { SearchSelect, type SearchOption } from "@/components/curriculum/SearchSelect";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { teacherUserId } from "@/app/services/teacher.service";
import type { Teacher } from "@/app/services/subjects.service";

/**
 * A course as the pages that open this modal hold it: the same fields the API
 * returns, except that `teacherId`, `subjectId` and `classId` arrive either as
 * ids or as populated objects depending on the route it came from.
 */
export interface CourseForModal {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  teacherId?: string | { _id: string; userId?: string | { _id?: string } };
  subjectId?: string | { _id: string; name?: string; code?: string };
  classId?: string | { _id?: string };
  schoolId?: string;
}

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

/** The form's own state — every field a plain string, as the inputs hold it. */
interface CourseForm {
  title: string;
  description: string;
  courseCode: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

const EMPTY_FORM: CourseForm = {
  title: "",
  description: "",
  courseCode: "",
  teacherId: "",
  classId: "",
  subjectId: "",
};

/** Reads an id out of a field the API returns either populated or as a string. */
function idOf(value: string | { _id?: string } | undefined | null): string {
  if (!value) return "";
  return typeof value === "string" ? value : (value._id ?? "");
}

/** The user id a course's teacher is addressed by, populated or not. */
function courseTeacherId(teacherId: CourseForModal["teacherId"]): string {
  if (!teacherId) return "";
  if (typeof teacherId === "string") return teacherId;
  if (typeof teacherId.userId === "string") return teacherId.userId;
  return teacherId.userId?._id || teacherId._id || "";
}

/** A teacher's display name, tolerating the accounts with no profile yet. */
function teacherName(teacher: Teacher): string {
  return `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() || (teacher.email ?? "Unnamed teacher");
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
  const teachersQuery = useTeacherOptions();
  const classesQuery = useClasses();
  const { create, update } = useCourseMutations();

  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useBodyScrollLock(isOpen);

  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const isSubmitting = create.isPending || update.isPending;

  // Reset the form whenever the modal opens, so a cancelled edit never leaks
  // into the next one.
  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});

    if (mode === "edit" && course) {
      setForm({
        title: course.title,
        description: course.description,
        courseCode: course.courseCode,
        teacherId: courseTeacherId(course.teacherId),
        classId: idOf(course.classId) || initialClassId || "",
        subjectId: idOf(course.subjectId) || subjectId || "",
      });
      return;
    }

    setForm({ ...EMPTY_FORM, classId: initialClassId || "", subjectId: subjectId || "" });
  }, [isOpen, mode, course, subjectId, initialClassId]);

  const teacherOptions: SearchOption[] = useMemo(
    () =>
      teachers.map((teacher) => ({
        id: teacherUserId(teacher),
        label: teacherName(teacher),
        hint: teacher.email ?? "",
      })),
    [teachers],
  );

  const classOptions: SearchOption[] = useMemo(
    () =>
      classes.map((cls) => ({
        id: cls._id,
        label: cls.name,
        hint: cls.gradeLevel ? `Grade level: ${cls.gradeLevel}` : "",
      })),
    [classes],
  );

  const missingFields = [
    !form.title.trim() && "Course Title",
    !form.courseCode.trim() && "Course Code",
    !form.description.trim() && "Description",
    !form.teacherId && "Assigned Teacher",
    !form.classId && "Class",
    !form.subjectId && "Subject",
  ].filter(Boolean) as string[];

  const close = () => {
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    if (missingFields.length > 0) {
      toast.error(`Please complete: ${missingFields.join(", ")}`);
      return;
    }

    setFieldErrors({});
    try {
      if (mode === "add") {
        await create.mutateAsync({
          title: form.title.trim(),
          description: form.description.trim(),
          courseCode: form.courseCode.trim(),
          subjectId: form.subjectId,
          teacherId: form.teacherId,
          classId: form.classId,
        });
      } else if (course) {
        await update.mutateAsync({
          courseId: course._id,
          payload: {
            title: form.title.trim(),
            description: form.description.trim(),
            courseCode: form.courseCode.trim(),
            teacherId: form.teacherId,
            classId: form.classId,
          },
        });
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

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "add" ? "Add course" : "Edit course"}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
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
              onClick={close}
              disabled={isSubmitting}
              aria-label="Close"
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-6 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Course Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass} htmlFor="course-title">
                    Course Title *
                  </label>
                  <input
                    id="course-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Algebra I"
                    className={inputClass}
                    required
                  />
                  {fieldErrors.title && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.title}</p>}
                </div>

                <div>
                  <Tooltip
                    content="A short unique identifier for this course (e.g. MTH101). Used on timetables and assessments."
                    side="right"
                  >
                    <label className={labelClass} htmlFor="course-code">
                      Course Code *
                    </label>
                  </Tooltip>
                  <input
                    id="course-code"
                    type="text"
                    value={form.courseCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, courseCode: e.target.value }))}
                    placeholder="e.g., MATH101"
                    className={inputClass}
                    required
                  />
                  {fieldErrors.courseCode && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.courseCode}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="course-description">
                    Description *
                  </label>
                  <textarea
                    id="course-description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter course description..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                  {fieldErrors.description && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.description}</p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-6 uppercase tracking-wide flex items-center gap-2">
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
                    onChange={(teacherId) => setForm((prev) => ({ ...prev, teacherId }))}
                    isLoading={teachersQuery.isLoading}
                    loadingLabel="Loading teachers..."
                    emptyLabel="No teachers available"
                    placeholder="Search and select a teacher..."
                  />
                  {teachersQuery.isError && (
                    <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {getErrorMessage(teachersQuery.error, "Could not load teachers.")}{" "}
                        <button type="button" onClick={() => teachersQuery.refetch()} className="underline">
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                  {!teachersQuery.isLoading && !teachersQuery.isError && teachers.length === 0 && (
                    <div className="flex items-start gap-2 mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm text-gray-600 dark:text-slate-300">
                        No teachers found. Please add teachers first.
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {mode === "edit" ? (
                    <>
                      <label className={labelClass} htmlFor="course-class">
                        Class *
                      </label>
                      <input
                        id="course-class"
                        type="text"
                        value={classes.find((c) => c._id === form.classId)?.name ?? ""}
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
                      onChange={(classId) => setForm((prev) => ({ ...prev, classId }))}
                      isLoading={classesQuery.isLoading}
                      loadingLabel="Loading classes..."
                      emptyLabel="No classes available"
                      placeholder="Search and select a class..."
                    />
                  )}
                  {!classesQuery.isLoading && classes.length === 0 && (
                    <div className="flex items-start gap-2 mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm text-gray-600 dark:text-slate-300">
                        No classes found. Please add classes first.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={close}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-100 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || missingFields.length > 0}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
