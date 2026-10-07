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
import { BookOpen, ChevronLeft, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import CourseModal from "@/components/CourseModal";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { StructureToolbar } from "@/components/curriculum/StructureToolbar";
import { SubjectAccordion } from "@/components/curriculum/SubjectAccordion";
import { SubjectFormModal } from "@/components/curriculum/SubjectFormModal";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  EmptyNote,
  Page,
  PageHeader,
  PageSkeleton,
  ScreenError,
  card,
  primaryButton,
  quietButton,
} from "@/components/tl";
import { useClasses, useSubjects } from "@/hooks/queries/reference";
import {
  useCourseMutations,
  useSubjectMutations,
  useTeacherOptions,
} from "@/hooks/curriculum/queries";
import {
  useStructureUrlAction,
  type StructureAction,
} from "@/hooks/curriculum/useStructureUrlAction";
import { usePermissions } from "@/hooks/usePermissions";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import type { Course, Subject } from "@/app/services/subjects.service";

/**
 * Shown while the subject list loads, and as the Suspense fallback: the
 * heading, the three stat tiles, the filter card and a few subject cards.
 *
 * @returns The skeleton.
 */
function StructureLoading() {
  return (
    <PageSkeleton label="Loading curriculum structure" tiles={3} blocks={[76, 72, 72, 72, 72]} />
  );
}

/**
 * The structure screen; separate so `useSearchParams` sits inside
 * `<Suspense>`. The heading with Add Subject, the stat tiles and filters, the
 * subject cards, and the subject, course and delete sheets.
 *
 * @returns The screen.
 */
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
    [subjects]
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
    <Page>
      <button
        type="button"
        onClick={() => router.push("/curriculum")}
        className={`${quietButton} -ml-3 w-fit`}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        Back to Curriculum
      </button>

      <PageHeader
        guide="curriculum-structure-header"
        title="Curriculum Structure"
        subtitle="Manage subjects and their associated courses"
        actions={
          <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
            <Tooltip
              content="Create a new subject area. You can add courses to it afterwards."
              side="top"
            >
              <button
                type="button"
                onClick={() => setSubjectModal({ isOpen: true, mode: "add", subject: null })}
                className={primaryButton}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Subject
              </button>
            </Tooltip>
          </PermissionGate>
        }
      />

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
          <ScreenError
            title="Could not load subjects"
            message={getErrorMessage(subjectsQuery.error, "Could not load subjects.")}
            onRetry={() => subjectsQuery.refetch()}
            retrying={subjectsQuery.isFetching}
          />
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
          <div className={card}>
            <EmptyNote
              icon={<BookOpen />}
              title={isFiltered ? "No subjects found" : "No subjects yet"}
              action={
                !isFiltered ? (
                  <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
                    <button
                      type="button"
                      onClick={() => setSubjectModal({ isOpen: true, mode: "add", subject: null })}
                      className={primaryButton}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Add First Subject
                    </button>
                  </PermissionGate>
                ) : undefined
              }
            >
              {isFiltered
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by creating your first subject to begin building your curriculum structure."}
            </EmptyNote>
          </div>
        )}
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
    </Page>
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
