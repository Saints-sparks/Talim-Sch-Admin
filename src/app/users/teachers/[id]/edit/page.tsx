"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/CustomToast";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { useCourses } from "@/hooks/queries/reference";
import { useRosterClasses } from "@/hooks/users/useRosterClasses";
import {
  useSaveTeacherSection,
  useTeacherProfile,
  useUpdateTeacherStatus,
  type SaveTeacherSectionInput,
} from "@/hooks/users/useTeachers";
import {
  assignmentsPayload,
  availabilityPayload,
  employmentPayload,
  personalPayload,
  qualificationsPayload,
  useTeacherEditor,
} from "@/hooks/users/useTeacherEditor";
import {
  TeacherProfileError,
  TeacherProfileSkeleton,
} from "@/components/users/teachers/TeacherProfileStates";
import {
  TeacherEditAssignmentsTab,
  TeacherEditAvailabilityTab,
  TeacherEditEmploymentTab,
  TeacherEditPersonalTab,
  TeacherEditQualificationsTab,
} from "@/components/users/teachers/TeacherEditTabs";

const TABS = [
  { value: "personal-details", label: "Personal Details" },
  { value: "qualifications", label: "Qualifications & Experience" },
  { value: "employment", label: "Employment Details" },
  { value: "assign", label: "Classes & Courses" },
  { value: "availability", label: "Teacher Availability" },
] as const;

const triggerClass =
  "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 h-[45px] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-md text-xs sm:text-sm";

function TeacherEditor() {
  const router = useRouter();
  const params = useParams();
  const teacherId = Array.isArray(params.id) ? params.id[0] : params.id || "";
  const [activeTab, setActiveTab] = useState<string>("personal-details");

  const profileQuery = useTeacherProfile(teacherId);
  const { classes } = useRosterClasses();
  const coursesQuery = useCourses();
  const { draft, setField, toggleInList } = useTeacherEditor(profileQuery.data);
  const saveSection = useSaveTeacherSection();
  const updateStatus = useUpdateTeacherStatus();

  const teacher = profileQuery.data;
  const userId = teacher?.userId?._id || teacherId;
  const savingSection = saveSection.isPending
    ? (saveSection.variables as SaveTeacherSectionInput | undefined)?.section
    : undefined;

  const save = async (input: SaveTeacherSectionInput, successMessage: string) => {
    try {
      await saveSection.mutateAsync(input);
      toast.success(successMessage);
    } catch (error) {
      logger.error("teachers", `Failed to update ${input.section}`, error);
      if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
        const fields = Object.entries(error.fieldErrors());
        toast.error(
          fields.length > 0
            ? fields.map(([field, reason]) => `${field}: ${reason}`).join("; ")
            : error.message,
        );
        return;
      }
      toast.error(getErrorMessage(error, "We couldn't save those changes."));
    }
  };

  const submit =
    (build: () => SaveTeacherSectionInput, successMessage: string) => (event: React.FormEvent) => {
      event.preventDefault();
      if (!draft) return;
      void save(build(), successMessage);
    };

  const deactivate = async () => {
    if (!window.confirm("Are you sure you want to deactivate this teacher?")) return;
    try {
      await updateStatus.mutateAsync({ userId, isActive: false });
      toast.success("Teacher deactivated successfully");
      router.push("/users/teachers");
    } catch (error) {
      logger.error("teachers", "Failed to deactivate teacher", error);
      toast.error(getErrorMessage(error, "We couldn't deactivate this teacher."));
    }
  };

  if (profileQuery.isPending) return <TeacherProfileSkeleton />;

  if (profileQuery.isError || !teacher || !draft) {
    const error = profileQuery.error;
    const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
    return (
      <TeacherProfileError
        title={notFound ? "Teacher Not Found" : "Error Loading Teacher"}
        message={
          notFound
            ? "The teacher you're looking for doesn't exist or has been removed."
            : getErrorMessage(error, "We couldn't load this teacher.")
        }
        notFound={notFound}
        onBack={() => router.push("/users/teachers")}
        onRetry={notFound ? undefined : () => profileQuery.refetch()}
      />
    );
  }

  const isDeactivated = teacher.userId?.isActive === false;
  const shared = {
    draft,
    setField,
    onDeactivate: deactivate,
    isDeactivated,
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-slate-900">
      <div className="p-6">
        <button
          onClick={() => router.push(`/users/teachers/${teacherId}`)}
          className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to Profile</span>
        </button>
      </div>

      <div className="px-6 pb-6">
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-gray-100 dark:bg-slate-700 rounded-lg">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className={triggerClass}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <CardContent className="p-4 sm:p-8">
              {teacher.hasTeacherProfile === false && (
                <div className="mb-6 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  This teacher account does not have a full teacher profile yet. Personal details and
                  deactivation are available; the other sections need the profile to be set up first.
                </div>
              )}

              <TabsContent value="personal-details" className="mt-0">
                <TeacherEditPersonalTab
                  {...shared}
                  isSaving={savingSection === "personal"}
                  onSubmit={submit(
                    () => ({ userId, section: "personal", payload: personalPayload(draft) }),
                    "Personal details updated successfully",
                  )}
                />
              </TabsContent>

              <TabsContent value="qualifications" className="mt-0">
                <TeacherEditQualificationsTab
                  {...shared}
                  isSaving={savingSection === "qualifications"}
                  onSubmit={submit(
                    () => ({ userId, section: "qualifications", payload: qualificationsPayload(draft) }),
                    "Qualifications updated successfully",
                  )}
                />
              </TabsContent>

              <TabsContent value="employment" className="mt-0">
                <TeacherEditEmploymentTab
                  {...shared}
                  isSaving={savingSection === "employment"}
                  onSubmit={submit(
                    () => ({ userId, section: "employment", payload: employmentPayload(draft) }),
                    "Employment details updated successfully",
                  )}
                />
              </TabsContent>

              <TabsContent value="assign" className="mt-0">
                <TeacherEditAssignmentsTab
                  {...shared}
                  toggleInList={toggleInList}
                  classes={classes}
                  courses={coursesQuery.data ?? []}
                  isSaving={savingSection === "assignments"}
                  onSubmit={submit(
                    () => ({ userId, section: "assignments", payload: assignmentsPayload(draft) }),
                    "Class and course assignments updated successfully",
                  )}
                />
              </TabsContent>

              <TabsContent value="availability" className="mt-0">
                <TeacherEditAvailabilityTab
                  {...shared}
                  toggleInList={toggleInList}
                  isSaving={savingSection === "availability"}
                  onSubmit={submit(
                    () => ({ userId, section: "availability", payload: availabilityPayload(draft) }),
                    "Availability updated successfully",
                  )}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

/** `/users/teachers/[id]/edit` — the teacher editor, behind `manage:teachers`. */
export default function TeacherEditPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_TEACHERS}>
      <TeacherEditor />
    </RequirePermission>
  );
}
