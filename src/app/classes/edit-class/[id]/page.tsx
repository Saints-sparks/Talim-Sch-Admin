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
import { ChevronLeft, Info, Loader2, Save, User, X } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import { ClassDetailsForm } from "@/components/classes/ClassDetailsForm";
import { AssignTeacherPanel } from "@/components/classes/AssignTeacherPanel";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Banner,
  Page,
  PageHeader,
  Tabs,
  ghostButton,
  pagePad,
  pageStack,
  primaryButton,
  quietButton,
  skeletonBlock,
  type TabOption,
} from "@/components/tl";
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

/** The edit screen's sections. */
type EditTab = "details" | "teacher";

/** The tabs, in order, with their icons. */
const TAB_OPTIONS: readonly TabOption<EditTab>[] = [
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
    value: "teacher",
    label: (
      <>
        <User className="h-4 w-4" aria-hidden />
        Assign Teacher
      </>
    ),
  },
];

/**
 * The edit screen's loading state: the links, heading, tabs and form card.
 *
 * @returns The skeleton.
 */
function EditClassSkeleton() {
  return (
    <div
      className={`${pagePad} ${pageStack}`}
      role="status"
      aria-busy="true"
      aria-label="Loading the class"
    >
      <span className="sr-only">Loading the class…</span>
      <div aria-hidden className={`${skeletonBlock} h-11 w-64 max-w-full rounded-[11px]`} />
      <div aria-hidden className="flex flex-wrap items-end justify-between gap-4">
        <div className={`${skeletonBlock} h-9 w-56 max-w-full rounded-lg`} />
        <div className={`${skeletonBlock} h-11 w-60 max-w-full rounded-[14px]`} />
      </div>
      <div aria-hidden className={`${skeletonBlock} h-11 w-72 max-w-full rounded-lg`} />
      <div aria-hidden className={`${skeletonBlock} h-96 rounded-[22px]`} />
    </div>
  );
}

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

  const [activeTab, setActiveTab] = useState<EditTab>("details");
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

  if (classQuery.isLoading && !classData) return <EditClassSkeleton />;

  if (classQuery.isError || !classData) {
    const notFound = classQuery.error instanceof ApiError && classQuery.error.code === "NOT_FOUND";
    return (
      <Page>
        <button
          type="button"
          onClick={() => router.push("/classes")}
          className={`${quietButton} -ml-3 w-fit`}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Back to Classes
        </button>
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

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="-ml-3 flex flex-wrap items-center gap-1">
        <button type="button" onClick={() => router.push("/classes")} className={quietButton}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Back to Classes
        </button>
        <span aria-hidden className="text-tl-faint">
          ·
        </span>
        <button
          type="button"
          onClick={() => router.push(`/classes/${classId}`)}
          className={quietButton}
        >
          <User className="h-4 w-4" aria-hidden />
          Class Profile
        </button>
      </nav>

      <PageHeader
        eyebrowText="Edit class"
        title={classData.name}
        subtitle="Change the class's details, or assign its class teacher."
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push(`/classes/${classId}`)}
              className={ghostButton}
            >
              <X className="h-4 w-4" aria-hidden /> Cancel
            </button>
            <PermissionGate permission={Permission.MANAGE_CLASSES}>
              <button
                type="button"
                onClick={handleSave}
                disabled={update.isPending}
                className={primaryButton}
              >
                {update.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden /> Save Changes
                  </>
                )}
              </button>
            </PermissionGate>
          </>
        }
      />

      {saved && (
        <Banner tone="success" role="status" title="Class updated successfully!">
          Redirecting you to the class profile...
        </Banner>
      )}

      <Tabs
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
        label="Edit sections"
        idPrefix="edit-class"
      />

      <div role="tabpanel" id="edit-class-panel" aria-labelledby={`edit-class-tab-${activeTab}`}>
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
    </Page>
  );
}
