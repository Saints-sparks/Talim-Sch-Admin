"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import {
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  User,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { PermissionGate, RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { useTeacherProfile } from "@/hooks/users/useTeachers";
import {
  TeacherProfileError,
  TeacherProfileSkeleton,
} from "@/components/users/teachers/TeacherProfileStates";
import {
  TeacherEmploymentTab,
  TeacherPersonalTab,
  TeacherQualificationsTab,
} from "@/components/users/teachers/TeacherProfileTabs";
import {
  TeacherAssignmentsTab,
  TeacherAvailabilityTab,
} from "@/components/users/teachers/TeacherAssignmentsTab";

const TABS = [
  { value: "personal-details", icon: User, long: "Personal Details", short: "Personal", wide: false },
  { value: "qualifications", icon: GraduationCap, long: "Qualifications", short: "Quals", wide: false },
  { value: "employment", icon: Briefcase, long: "Employment", short: "Work", wide: true },
  { value: "assign", icon: BookOpen, long: "Assignments", short: "Assign", wide: false },
  { value: "availability", icon: Clock, long: "Availability", short: "Times", wide: false },
] as const;

const triggerClass =
  "flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50 dark:hover:bg-slate-700/50";

function TeacherProfile() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>("personal-details");

  const profileQuery = useTeacherProfile(teacherId);
  const backToRoster = () => router.push("/users/teachers");

  if (profileQuery.isPending) return <TeacherProfileSkeleton />;

  if (profileQuery.isError || !profileQuery.data) {
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
        onBack={backToRoster}
        onRetry={notFound ? undefined : () => profileQuery.refetch()}
      />
    );
  }

  const teacher = profileQuery.data;

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 px-4 sm:px-6 py-6 border-b border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={backToRoster}
                className="flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="text-sm font-medium">Teachers</span>
              </button>

              <div className="flex items-center space-x-2 text-gray-400 dark:text-slate-500">
                <ChevronRight className="w-3 h-3" />
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </div>
              </div>
            </div>

            <PermissionGate permission={Permission.MANAGE_TEACHERS}>
              <div className="flex items-center space-x-3">
                <Tooltip content="Update this teacher's details, employment and assignments." side="top">
                  <button
                    onClick={() => router.push(`/users/teachers/${teacherId}/edit`)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 border border-gray-200 dark:border-slate-600 hover:border-blue-200 text-sm font-medium"
                  >
                    <FiEdit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </button>
                </Tooltip>
              </div>
            </PermissionGate>
          </div>

          {!teacher.hasTeacherProfile && (
            <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              This teacher account exists, but its teacher profile has not been completed yet. You can
              still view the account details.
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-gray-50/50 dark:bg-slate-700/40 border-b border-gray-100 dark:border-slate-700 rounded-none h-auto p-0">
                {TABS.map(({ value, icon: Icon, long, short, wide }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={`${triggerClass} ${wide ? "col-span-2 sm:col-span-1" : ""}`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{long}</span>
                    <span className="sm:hidden">{short}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <CardContent className="p-4 sm:p-6 lg:p-8">
                <TabsContent value="personal-details" className="mt-0">
                  <TeacherPersonalTab teacher={teacher} />
                </TabsContent>
                <TabsContent value="qualifications" className="mt-0">
                  <TeacherQualificationsTab teacher={teacher} />
                </TabsContent>
                <TabsContent value="employment" className="mt-0">
                  <TeacherEmploymentTab teacher={teacher} />
                </TabsContent>
                <TabsContent value="assign" className="mt-0">
                  <TeacherAssignmentsTab teacher={teacher} />
                </TabsContent>
                <TabsContent value="availability" className="mt-0">
                  <TeacherAvailabilityTab teacher={teacher} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

/** `/users/teachers/[id]` — one teacher's profile, behind `manage:teachers`. */
export default function TeacherProfilePage() {
  return (
    <RequirePermission permission={Permission.MANAGE_TEACHERS}>
      <TeacherProfile />
    </RequirePermission>
  );
}
