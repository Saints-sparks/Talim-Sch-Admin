"use client";

/**
 * Class detail — one class's fields, its courses and its class teacher.
 *
 * The class is a cached query keyed on the school and the class id, so coming
 * back from the edit screen shows the saved values without a refetch, and
 * deleting a course invalidates the class rather than re-reading it by hand.
 */
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import { BookOpen, ChevronLeft, GraduationCap, Info, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/components/CustomToast";
import CourseModal, { type CourseForModal } from "@/components/CourseModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { ErrorState } from "@/components/StateComponents";
import { ConfirmDialog } from "@/components/curriculum/ConfirmDialog";
import { ClassCoursesTab } from "@/components/classes/ClassCoursesTab";
import { ClassDetailsTab } from "@/components/classes/ClassDetailsTab";
import { ClassTeacherTab } from "@/components/classes/ClassTeacherTab";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useClassDetail } from "@/hooks/classes/queries";
import { useCourseMutations } from "@/hooks/curriculum/queries";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import type { ClassCourse } from "@/components/classes/class.model";

/** The class detail screen's loading state, shaped like the real screen. */
function ClassDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="p-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-slate-800 px-6 py-4 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex space-x-8">
              {[0, 1, 2].map((tab) => (
                <div
                  key={tab}
                  className="h-6 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((field) => (
                <div
                  key={field}
                  className="h-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
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

  const [activeTab, setActiveTab] = useState("details");
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

  if (classQuery.isLoading && !classData) return <ClassDetailSkeleton />;

  if (classQuery.isError || !classData) {
    const notFound = classQuery.error instanceof ApiError && classQuery.error.code === "NOT_FOUND";
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-md mx-auto mt-24">
          <ErrorState
            title={notFound ? "Class Not Found" : "Error Loading Class"}
            message={
              notFound
                ? "The class you're looking for doesn't exist or has been removed."
                : getErrorMessage(classQuery.error, "Failed to load class details.")
            }
            onRetry={notFound ? undefined : () => classQuery.refetch()}
          />
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/classes")}
              className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const courses = classData.courses ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Classes</span>
            </button>
            <div className="text-gray-300 dark:text-slate-600">|</div>
            <div className="flex items-center space-x-2 min-w-0">
              <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-slate-400 truncate">
                Class Details
              </span>
            </div>
          </div>
          <PermissionGate permission={Permission.MANAGE_CLASSES}>
            <button
              onClick={() => router.push(`/classes/edit-class/${classId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors shadow-sm font-medium flex-shrink-0"
            >
              <FiEdit className="w-4 h-4" />
              Edit Class
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 rounded-none h-auto p-0">
              <TabsTrigger
                value="details"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-[#003366] data-[state=active]:text-[#003366] dark:data-[state=active]:text-blue-300 rounded-none font-medium transition-all"
              >
                <Info className="w-4 h-4" />
                Class Details
              </TabsTrigger>
              <Tooltip
                content="Courses currently assigned to this class. Manage courses in Curriculum."
                side="top"
              >
                <TabsTrigger
                  value="courses"
                  className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-[#003366] data-[state=active]:text-[#003366] dark:data-[state=active]:text-blue-300 rounded-none font-medium transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Courses
                </TabsTrigger>
              </Tooltip>
              <TabsTrigger
                value="teacher"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-[#003366] data-[state=active]:text-[#003366] dark:data-[state=active]:text-blue-300 rounded-none font-medium transition-all"
              >
                <User className="w-4 h-4" />
                Class Teacher
              </TabsTrigger>
            </TabsList>

            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="details" className="mt-0">
                    <ClassDetailsTab classData={classData} />
                  </TabsContent>

                  <TabsContent value="courses" className="mt-0">
                    <ClassCoursesTab
                      courses={courses}
                      canManageCurriculum={canManageCurriculum}
                      deletingCourseId={
                        removeCourse.isPending ? (courseToDelete?._id ?? null) : null
                      }
                      onEditCourse={setCourseToEdit}
                      onDeleteCourse={setCourseToDelete}
                    />
                  </TabsContent>

                  <TabsContent value="teacher" className="mt-0">
                    <ClassTeacherTab
                      classData={classData}
                      onAssignTeacher={() => router.push(`/classes/edit-class/${classId}`)}
                    />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
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
    </div>
  );
}
