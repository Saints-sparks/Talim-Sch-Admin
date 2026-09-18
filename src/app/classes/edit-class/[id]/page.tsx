"use client";

/**
 * Class edit — the class's own fields on one tab, its class teacher on the
 * other.
 *
 * The two are separate writes on purpose: "Save Changes" sends the class DTO,
 * while assigning a teacher is an authorization change the server applies on
 * its own route. Both invalidate the class caches, so the detail screen and
 * every class dropdown follow without a refetch here.
 */
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiSave, FiX } from "react-icons/fi";
import { ChevronLeft, Info, User } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import { ClassDetailsForm } from "@/components/classes/ClassDetailsForm";
import { AssignTeacherPanel } from "@/components/classes/AssignTeacherPanel";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useClassDetail, useClassMutations } from "@/hooks/classes/queries";
import { useTeacherOptions } from "@/hooks/curriculum/queries";
import { usePermissions } from "@/hooks/usePermissions";
import {
  classTeacherName,
  validateClassForm,
  type ClassFormErrors,
  type ClassPayload,
} from "@/components/classes/class.model";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";

/** How long the success banner stays before the class profile opens. */
const REDIRECT_DELAY_MS = 1500;

const EMPTY_FORM: ClassPayload = {
  name: "",
  gradeLevel: "",
  classDescription: "",
  classCapacity: "",
};

/**
 * The class edit route.
 *
 * @returns The page.
 */
export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_CLASSES);

  const classQuery = useClassDetail(classId);
  const teachersQuery = useTeacherOptions();
  const { update } = useClassMutations(classId);

  const [activeTab, setActiveTab] = useState<"details" | "teacher">("details");
  const [form, setForm] = useState<ClassPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<ClassFormErrors>({});
  const [saved, setSaved] = useState(false);

  const classData = classQuery.data;

  // Seed the form once the class lands. Keyed on the class id rather than the
  // object, so a cache update mid-edit never overwrites what is being typed.
  useEffect(() => {
    if (!classData) return;
    setForm({
      name: classData.name ?? "",
      gradeLevel: classData.gradeLevel ?? "",
      classDescription: classData.classDescription ?? "",
      classCapacity:
        classData.classCapacity !== undefined && classData.classCapacity !== null
          ? String(classData.classCapacity)
          : "",
    });
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData?._id]);

  const setField = (field: keyof ClassPayload, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSave = async () => {
    const found = validateClassForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setActiveTab("details");
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      await update.mutateAsync({
        name: form.name.trim(),
        gradeLevel: form.gradeLevel,
        classDescription: form.classDescription.trim(),
        classCapacity: form.classCapacity,
      });

      setSaved(true);
      toast.success("Class updated successfully!");
      setTimeout(() => router.push(`/classes/${classId}`), REDIRECT_DELAY_MS);
    } catch (error) {
      logger.error("classes", "Failed to update class", error);

      // Branch on the server's code, and map field-level problems onto the
      // inputs that caused them.
      const code = error instanceof ApiError ? error.code : null;
      if (error instanceof ApiError && code === "VALIDATION_FAILED") {
        setErrors(error.fieldErrors() as ClassFormErrors);
        setActiveTab("details");
      }

      const message =
        code === "FORBIDDEN"
          ? "You don't have permission to update this class."
          : code === "NOT_FOUND"
            ? "Class not found. It may have been deleted."
            : getErrorMessage(error, "Failed to update class.");
      toast.error(message);
    }
  };

  if (classQuery.isLoading && !classData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-6 space-y-6">
        <div className="h-16 bg-white dark:bg-slate-900 rounded-lg animate-pulse" />
        <div className="h-12 bg-white dark:bg-slate-900 rounded-lg animate-pulse" />
        <div className="h-96 bg-white dark:bg-slate-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (classQuery.isError || !classData) {
    const notFound = classQuery.error instanceof ApiError && classQuery.error.code === "NOT_FOUND";
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-6">
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
              className="inline-flex items-center px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              <ChevronLeft className="mr-2 w-4 h-4" /> Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "details", label: "Class Details", icon: <Info className="w-4 h-4 mr-2" /> },
    { id: "teacher", label: "Assign Teacher", icon: <User className="w-4 h-4 mr-2" /> },
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-950">
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-slate-400 min-w-0">
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Classes
            </button>
            <span className="mx-2">|</span>
            <button
              onClick={() => router.push(`/classes/${classId}`)}
              className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <User className="w-4 h-4 mr-1" />
              Class Profile
            </button>
            <span className="mx-2">|</span>
            <span className="text-gray-900 dark:text-slate-100 font-semibold truncate">
              {classData.name}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push(`/classes/${classId}`)}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center text-sm font-medium"
            >
              <FiX className="mr-2 w-4 h-4" /> Cancel
            </button>
            <PermissionGate permission={Permission.MANAGE_CLASSES}>
              <button
                onClick={handleSave}
                disabled={update.isPending}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm font-medium"
              >
                {update.isPending ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <nav className="px-6 grid grid-cols-2 gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {saved && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Class updated successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Redirecting you to the class profile...
                </p>
              </div>
            )}

            {activeTab === "details" ? (
              <ClassDetailsForm
                form={form}
                errors={errors}
                onChange={setField}
                courseCount={classData.courses?.length ?? 0}
                teacherName={classTeacherName(classData)}
                canManage={canManage}
              />
            ) : (
              <AssignTeacherPanel
                classData={classData}
                classId={classId ?? ""}
                teachers={teachersQuery.data ?? []}
                isLoadingTeachers={teachersQuery.isLoading}
                teachersError={teachersQuery.error}
                onRetryTeachers={() => teachersQuery.refetch()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
