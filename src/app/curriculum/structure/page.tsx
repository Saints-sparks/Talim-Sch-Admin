"use client";

/**
 * Curriculum structure — the school's subjects and the courses inside them.
 *
 * Subjects, classes and teachers all come from the shared caches, so the
 * screen opens with whatever the dashboard already loaded, and every write
 * invalidates those caches rather than refetching by hand. Writes are rendered
 * only for an administrator holding `manage:curriculum`.
 */
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronLeft, Loader2, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import CourseModal from "@/components/CourseModal";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { StructureToolbar } from "@/components/curriculum/StructureToolbar";
import { SubjectAccordion } from "@/components/curriculum/SubjectAccordion";
import { SubjectFormModal } from "@/components/curriculum/SubjectFormModal";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useClasses, useSubjects } from "@/hooks/queries/reference";
import { useCourseMutations, useSubjectMutations, useTeacherOptions } from "@/hooks/curriculum/queries";
import { useStructureUrlAction, type StructureAction } from "@/hooks/curriculum/useStructureUrlAction";
import { usePermissions } from "@/hooks/usePermissions";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import type { Course, Subject } from "@/app/services/subjects.service";

/** Shown while the subject list loads, and as the Suspense fallback. */
function StructureLoading() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#003366] dark:text-blue-400" />
        <p className="text-sm text-gray-500 dark:text-slate-400">Loading curriculum structure...</p>
      </div>
    </div>
  );
}

/** The structure screen; separate so `useSearchParams` sits inside `<Suspense>`. */
function CurriculumStructureMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_CURRICULUM);

  const subjectsQuery = useSubjects();
  const classesQuery = useClasses();
  const teachersQuery = useTeacherOptions();
  const { remove: removeSubject } = useSubjectMutations();
  const { remove: removeCourse } = useCourseMutations();

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  // `?subject=` deep links from the dashboard's subject grid: that subject
  // opens with its courses already showing.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const subjectId = searchParams?.get("subject");
    return new Set(subjectId ? [subjectId] : []);
  });

  const [subjectModal, setSubjectModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    subject: Subject | null;
  }>({ isOpen: false, mode: "add", subject: null });

  const [courseModal, setCourseModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    course: Course | null;
    subject: Subject | null;
  }>({ isOpen: false, mode: "add", course: null, subject: null });

  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  /** Clears the `?action=` query once its modal has been dealt with. */
  const clearUrlAction = useCallback(() => {
    if (searchParams?.get("action")) router.replace("/curriculum/structure");
  }, [router, searchParams]);

  const handleUrlAction = useCallback((action: StructureAction) => {
    if (action.type === "add-subject") {
      setSubjectModal({ isOpen: true, mode: "add", subject: null });
    } else if (action.type === "add-course") {
      setCourseModal({ isOpen: true, mode: "add", course: null, subject: action.subject });
    } else if (action.type === "edit-course") {
      setCourseModal({ isOpen: true, mode: "edit", course: action.course, subject: null });
    } else {
      toast.error(action.reason);
    }
  }, []);

  useStructureUrlAction({
    action: searchParams?.get("action") ?? null,
    courseId: searchParams?.get("courseId") ?? null,
    subjects,
    isLoading: subjectsQuery.isLoading,
    onAction: handleUrlAction,
  });

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query);
      // A subject has no class of its own — it reaches a class through its
      // courses, so that is what the filter matches on.
      const matchesClass =
        selectedClass === "all" ||
        (subject.courses ?? []).some((course) => course.classId === selectedClass);
      return matchesSearch && matchesClass;
    });
  }, [subjects, searchTerm, selectedClass]);

  const totalCourses = useMemo(
    () => subjects.reduce((total, subject) => total + (subject.courses?.length ?? 0), 0),
    [subjects],
  );

  const toggleSubject = (subjectId: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      await removeSubject.mutateAsync(subjectToDelete._id);
      toast.success(`"${subjectToDelete.name}" deleted successfully!`);
      setSubjectToDelete(null);
    } catch (error) {
      logger.error("curriculum", "Failed to delete subject", error);
      toast.error(getErrorMessage(error, "Failed to delete subject"));
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await removeCourse.mutateAsync(courseToDelete._id);
      toast.success("Course deleted successfully!");
      setCourseToDelete(null);
    } catch (error) {
      logger.error("curriculum", "Failed to delete course", error);
      toast.error(getErrorMessage(error, "Failed to delete course"));
    }
  };

  const closeCourseModal = () => {
    setCourseModal({ isOpen: false, mode: "add", course: null, subject: null });
    clearUrlAction();
  };

  const closeSubjectModal = () => {
    setSubjectModal({ isOpen: false, mode: "add", subject: null });
    clearUrlAction();
  };

  if (subjectsQuery.isLoading && subjects.length === 0) return <StructureLoading />;

  const isFiltered = searchTerm.trim().length > 0 || selectedClass !== "all";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div
        className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-5"
        data-guide="curriculum-structure-header"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/curriculum")}
              className="flex items-center justify-center w-9 h-9 text-gray-500 dark:text-slate-400 hover:text-[#003366] dark:hover:text-blue-300 hover:bg-[#003366]/5 dark:hover:bg-slate-800 rounded-lg transition-all"
              aria-label="Back to Curriculum"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#003366]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Curriculum Structure
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Manage subjects and their associated courses
              </p>
            </div>
          </div>
          <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
            <Tooltip
              content="Create a new subject area. You can add courses to it afterwards."
              side="top"
            >
              <button
                onClick={() => setSubjectModal({ isOpen: true, mode: "add", subject: null })}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </Tooltip>
          </PermissionGate>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        <StructureToolbar
          totalSubjects={subjects.length}
          totalCourses={totalCourses}
          totalClasses={classes.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          classes={classes}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />

        <div data-guide="curriculum-structure-list">
          {subjectsQuery.isError ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 py-12 text-center">
              <p className="text-sm text-red-700 dark:text-red-300">
                {getErrorMessage(subjectsQuery.error, "Could not load subjects.")}
              </p>
              <button
                onClick={() => subjectsQuery.refetch()}
                className="mt-4 px-5 py-2 rounded-lg bg-[#003366] text-white text-sm font-medium hover:bg-[#002244]"
              >
                Try again
              </button>
            </div>
          ) : filteredSubjects.length > 0 ? (
            <SubjectAccordion
              subjects={filteredSubjects}
              classes={classes}
              teachers={teachers}
              expanded={expanded}
              onToggle={toggleSubject}
              canManage={canManage}
              deletingCourseId={removeCourse.isPending ? (courseToDelete?._id ?? null) : null}
              onAddCourse={(subject) =>
                setCourseModal({ isOpen: true, mode: "add", course: null, subject })
              }
              onEditSubject={(subject) => setSubjectModal({ isOpen: true, mode: "edit", subject })}
              onDeleteSubject={setSubjectToDelete}
              onEditCourse={(course) =>
                setCourseModal({ isOpen: true, mode: "edit", course, subject: null })
              }
              onDeleteCourse={setCourseToDelete}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#003366]/10 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-[#003366] dark:text-blue-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {isFiltered ? "No subjects found" : "No subjects yet"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {isFiltered
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Get started by creating your first subject to begin building your curriculum structure."}
                  </p>
                </div>
                {!isFiltered && (
                  <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
                    <button
                      onClick={() => setSubjectModal({ isOpen: true, mode: "add", subject: null })}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors font-medium text-sm shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Subject
                    </button>
                  </PermissionGate>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <SubjectFormModal
        isOpen={subjectModal.isOpen}
        mode={subjectModal.mode}
        subject={subjectModal.subject}
        onClose={closeSubjectModal}
      />

      <ConfirmDialog
        isOpen={Boolean(subjectToDelete)}
        title="Delete subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? This will also delete all associated courses.`}
        isPending={removeSubject.isPending}
        onConfirm={confirmDeleteSubject}
        onCancel={() => setSubjectToDelete(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(courseToDelete)}
        title="Delete course"
        message={`Are you sure you want to delete "${courseToDelete?.title}"? This cannot be undone.`}
        isPending={removeCourse.isPending}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setCourseToDelete(null)}
      />

      <CourseModal
        isOpen={courseModal.isOpen}
        onClose={closeCourseModal}
        onSuccess={closeCourseModal}
        mode={courseModal.mode}
        course={courseModal.course}
        subjectId={courseModal.subject?._id ?? undefined}
        subjectName={courseModal.subject?.name}
        initialClassId=""
      />
    </div>
  );
}

/**
 * The curriculum structure route.
 *
 * @returns The page, suspended until the search params are available.
 */
export default function CurriculumStructurePage() {
  return (
    <Suspense fallback={<StructureLoading />}>
      <CurriculumStructureMain />
    </Suspense>
  );
}
