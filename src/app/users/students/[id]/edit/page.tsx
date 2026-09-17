"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, User, UserCheck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/CustomToast";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { uploadImage } from "@/app/services/files.service";
import { useRosterClasses } from "@/hooks/users/useRosterClasses";
import { useStudent, useUpdateStudent } from "@/hooks/users/useStudents";
import { draftProblems, toUpdatePayload, useStudentEditor } from "@/hooks/users/useStudentEditor";
import {
  StudentProfileError,
  StudentProfileSkeleton,
} from "@/components/users/students/StudentProfileSkeleton";
import {
  StudentEditGuardianTab,
  StudentEditPersonalTab,
  StudentEditSettingsTab,
} from "@/components/users/students/StudentEditTabs";

const TABS = [
  { value: "personal-details", icon: User, label: "Personal Details" },
  { value: "parent-guardian", icon: Users, label: "Parent/Guardian" },
  { value: "settings", icon: UserCheck, label: "Settings" },
] as const;

const triggerClass =
  "flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-none font-medium transition-all";

function EditStudentProfile() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>("personal-details");
  const [isUploading, setIsUploading] = useState(false);

  const studentQuery = useStudent(studentId);
  const { classes } = useRosterClasses();
  const { draft, setField, isDirty } = useStudentEditor(studentQuery.data);
  const updateStudent = useUpdateStudent();

  const backToProfile = () => router.push(`/users/students/${studentId}/view`);

  const handlePhoto = async (file: File) => {
    setIsUploading(true);
    try {
      // The photo is uploaded and the record stores its URL. It used to be
      // inlined as a base64 data URL in the update body, which made a routine
      // save large enough for the API to reject.
      const url = await uploadImage(file);
      setField("userAvatar", url);
      toast.success("Photo uploaded");
    } catch (error) {
      logger.error("students", "Avatar upload failed", error);
      toast.error(getErrorMessage(error, "We couldn't upload that photo."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;

    const problems = draftProblems(draft);
    if (problems.length > 0) {
      toast.error(`Please complete: ${problems.join(", ")}`);
      return;
    }

    try {
      await updateStudent.mutateAsync({ studentId, payload: toUpdatePayload(draft) });
      toast.success("Student profile updated successfully");
      backToProfile();
    } catch (error) {
      logger.error("students", "Failed to update student", error);
      if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
        const fields = Object.entries(error.fieldErrors());
        toast.error(
          fields.length > 0
            ? fields.map(([field, reason]) => `${field}: ${reason}`).join("; ")
            : error.message,
        );
        return;
      }
      toast.error(getErrorMessage(error, "We couldn't save this student."));
    }
  };

  if (studentQuery.isPending) return <StudentProfileSkeleton />;

  if (studentQuery.isError || !draft) {
    const error = studentQuery.error;
    const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
    return (
      <StudentProfileError
        title={notFound ? "Student Not Found" : "Error Loading Student"}
        message={
          notFound
            ? "The student you're looking for doesn't exist, or isn't in your school."
            : getErrorMessage(error, "We couldn't load this student.")
        }
        onBack={() => router.push("/users/students")}
        onRetry={notFound ? undefined : () => studentQuery.refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={backToProfile}
              className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Profile</span>
            </button>
            <div className="text-gray-300 dark:text-slate-600">|</div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-slate-400">Edit Student Profile</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={updateStudent.isPending || isUploading || !isDirty}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="w-4 h-4" />
            {updateStudent.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 dark:bg-slate-700/40 border-b border-gray-200 dark:border-slate-700 rounded-none h-auto p-0">
              {TABS.map(({ value, icon: Icon, label }) => (
                <TabsTrigger key={value} value={value} className={triggerClass}>
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <TabsContent value="personal-details" className="space-y-8 mt-0">
                    <StudentEditPersonalTab
                      draft={draft}
                      setField={setField}
                      onPhotoSelected={handlePhoto}
                      isUploading={isUploading}
                    />
                  </TabsContent>
                  <TabsContent value="parent-guardian" className="space-y-8 mt-0">
                    <StudentEditGuardianTab draft={draft} setField={setField} />
                  </TabsContent>
                  <TabsContent value="settings" className="space-y-8 mt-0">
                    <StudentEditSettingsTab draft={draft} setField={setField} classes={classes} />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/** `/users/students/[id]/edit` — the student editor, behind `manage:students`. */
export default function EditStudentPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_STUDENTS}>
      <EditStudentProfile />
    </RequirePermission>
  );
}
