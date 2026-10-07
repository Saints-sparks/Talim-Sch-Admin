"use client";

/**
 * Class detail — one class's fields, its courses and its class teacher, as
 * three tabs under the class's heading.
 *
 * The class is a cached query keyed on the school and the class id, so coming
 * back from the edit screen shows the saved values without a refetch, and
 * deleting a course invalidates the class rather than re-reading it by hand.
 */
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, Info, Pencil, User } from "lucide-react";
import { toast } from "@/components/CustomToast";
import CourseModal, { type CourseForModal } from "@/components/CourseModal";
import { ErrorState } from "@/components/StateComponents";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { ClassCoursesTab } from "@/components/classes/ClassCoursesTab";
import { ClassDetailsTab } from "@/components/classes/ClassDetailsTab";
import { ClassTeacherTab } from "@/components/classes/ClassTeacherTab";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Page,
  PageHeader,
  Tabs,
  pagePad,
  pageStack,
  primaryButton,
  quietButton,
  skeletonBlock,
  type TabOption,
} from "@/components/tl";
import { useClassDetail } from "@/hooks/classes/queries";
import { useCourseMutations } from "@/hooks/curriculum/queries";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import type { ClassCourse } from "@/components/classes/class.model";

/** The detail screen's sections. */
type ClassTab = "details" | "courses" | "teacher";

/** The tabs, in order, with their icons. */
const TAB_OPTIONS: readonly TabOption<ClassTab>[] = [
  {
    value: "details",
    label: (
      <>
        <Info className="h-4 w-4" aria-hidden />
        Class Details
      </>
    ),
  },
  {
    value: "courses",
    label: (
      <>
        <BookOpen className="h-4 w-4" aria-hidden />
        Courses
      </>
    ),
    tip: "Courses currently assigned to this class. Manage courses in Curriculum.",
  },
  {
    value: "teacher",
    label: (
      <>
        <User className="h-4 w-4" aria-hidden />
        Class Teacher
      </>
    ),
  },
];

/**
 * The class detail screen's loading state, shaped like the real screen: the
 * back link, the heading, the tabs and the first tab's tiles.
 *
 * @returns The skeleton.
 */
function ClassDetailSkeleton() {
  return (
    <div
      className={`${pagePad} ${pageStack}`}
      role="status"
      aria-busy="true"
      aria-label="Loading the class"
    >
      <span className="sr-only">Loading the class…</span>
      <div aria-hidden className={`${skeletonBlock} h-11 w-40 rounded-[11px]`} />
      <div aria-hidden className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className={`${skeletonBlock} h-4 w-24 rounded`} />
          <div className={`${skeletonBlock} h-9 w-56 max-w-full rounded-lg`} />
          <div className={`${skeletonBlock} h-5 w-72 max-w-full rounded`} />
        </div>
        <div className={`${skeletonBlock} h-11 w-32 rounded-[14px]`} />
      </div>
      <div aria-hidden className="flex gap-3">
        {[0, 1, 2].map((tab) => (
          <div key={tab} className={`${skeletonBlock} h-11 w-32 rounded-lg`} />
        ))}
      </div>
      <div
        aria-hidden
        className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]"
      >
        {[0, 1, 2].map((tile) => (
          <div key={tile} className={`${skeletonBlock} h-[96px] rounded-[18px]`} />
        ))}
      </div>
      <div aria-hidden className={`${skeletonBlock} h-[320px] rounded-[22px]`} />
    </div>
  );
}

/**
 * The class detail route.
 *
 * @returns The page.
 */
export default function ViewClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { hasPermission } = usePermissions();
  const canManageCurriculum = hasPermission(Permission.MANAGE_CURRICULUM);

  const classQuery = useClassDetail(classId);
  const { remove: removeCourse } = useCourseMutations();

  const [activeTab, setActiveTab] = useState<ClassTab>("details");
  const [courseToEdit, setCourseToEdit] = useState<ClassCourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<ClassCourse | null>(null);

  const classData = classQuery.data;

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    const title = courseToDelete.title || "This course";

    try {
      await removeCourse.mutateAsync(courseToDelete._id);
      toast.success(`${title} has been deleted successfully!`);
      setCourseToDelete(null);
    } catch (error) {
      logger.error("classes", "Failed to delete course", error);
      setCourseToDelete(null);

      // Branch on the server's error code rather than matching on prose.
      const code = error instanceof ApiError ? error.code : null;
      if (code === "NOT_FOUND") {
        toast.error(`${title} was not found. It may have already been deleted.`);
      } else if (code === "FORBIDDEN") {
        toast.error("You don't have permission to delete this course.");
      } else if (code === "CONFLICT") {
        toast.error(getErrorMessage(error, `${title} is still in use and cannot be deleted.`));
      } else {
        toast.error(getErrorMessage(error, `Failed to delete ${title}.`));
      }
    }
  };

  const backToClasses = (
    <button
      type="button"
      onClick={() => router.push("/classes")}
      className={`${quietButton} -ml-3 w-fit`}
    >
      <ChevronLeft className="h-5 w-5" aria-hidden />
      Back to Classes
    </button>
  );

  if (classQuery.isLoading && !classData) return <ClassDetailSkeleton />;

  if (classQuery.isError || !classData) {
    const notFound = classQuery.error instanceof ApiError && classQuery.error.code === "NOT_FOUND";
    return (
      <Page>
        {backToClasses}
        <ErrorState
          title={notFound ? "Class Not Found" : "Error Loading Class"}
          message={
            notFound
              ? "The class you're looking for doesn't exist or has been removed."
              : getErrorMessage(classQuery.error, "Failed to load class details.")
          }
          onRetry={notFound ? undefined : () => classQuery.refetch()}
        />
      </Page>
    );
  }

  const courses = classData.courses ?? [];

  return (
    <Page>
      {backToClasses}

      <PageHeader
        eyebrowText="Class Details"
        title={classData.name}
        subtitle={[
          classData.gradeLevel || "Grade not set",
          `${courses.length} ${courses.length === 1 ? "course" : "courses"}`,
          classData.classCapacity ? `capacity ${classData.classCapacity}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <PermissionGate permission={Permission.MANAGE_CLASSES}>
            <button
              type="button"
              onClick={() => router.push(`/classes/edit-class/${classId}`)}
              className={primaryButton}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Class
            </button>
          </PermissionGate>
        }
      />

      <Tabs
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
        label="Class sections"
        idPrefix="class"
      />

      <div role="tabpanel" id="class-panel" aria-labelledby={`class-tab-${activeTab}`}>
        {activeTab === "details" && <ClassDetailsTab classData={classData} />}
        {activeTab === "courses" && (
          <ClassCoursesTab
            courses={courses}
            canManageCurriculum={canManageCurriculum}
            deletingCourseId={removeCourse.isPending ? (courseToDelete?._id ?? null) : null}
            onEditCourse={setCourseToEdit}
            onDeleteCourse={setCourseToDelete}
          />
        )}
        {activeTab === "teacher" && (
          <ClassTeacherTab
            classData={classData}
            onAssignTeacher={() => router.push(`/classes/edit-class/${classId}`)}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(courseToDelete)}
        title="Delete course"
        message={`Are you sure you want to delete "${courseToDelete?.title ?? "this course"}"? This action cannot be undone.`}
        isPending={removeCourse.isPending}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setCourseToDelete(null)}
      />

      <CourseModal
        isOpen={Boolean(courseToEdit)}
        onClose={() => setCourseToEdit(null)}
        onSuccess={() => setCourseToEdit(null)}
        mode="edit"
        course={courseToEdit as CourseForModal | null}
        subjectId={
          typeof courseToEdit?.subjectId === "object" ? courseToEdit.subjectId._id : undefined
        }
        subjectName={
          typeof courseToEdit?.subjectId === "object" ? courseToEdit.subjectId.name : undefined
        }
        initialClassId={classId || ""}
      />
    </Page>
  );
}
