"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, User, UserCheck, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { PermissionGate, RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { useStudent, useStudentAttendance } from "@/hooks/users/useStudents";
import {
  StudentProfileError,
  StudentProfileSkeleton,
} from "@/components/users/students/StudentProfileSkeleton";
import StudentAttendanceTab from "@/components/users/students/StudentAttendanceTab";
import {
  StudentAcademicTab,
  StudentGuardianTab,
  StudentPersonalTab,
} from "@/components/users/students/StudentProfileTabs";

const TABS = [
  { value: "personal-details", icon: User, long: "Personal Details", short: "Personal" },
  { value: "parent-guardian", icon: Users, long: "Parent/Guardian", short: "Parent" },
  { value: "academic-info", icon: BookOpen, long: "Academic Info", short: "Academic" },
  { value: "attendance", icon: UserCheck, long: "Attendance", short: "Attend" },
] as const;

const triggerClass =
  "flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50 dark:hover:bg-slate-700/50";

function StudentProfile() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>("personal-details");

  const studentQuery = useStudent(studentId);
  // Attendance is only fetched once its tab is opened.
  const attendanceQuery = useStudentAttendance(studentId, activeTab === "attendance");

  const backToRoster = () => router.push("/users/students");

  if (studentQuery.isPending) return <StudentProfileSkeleton />;

  if (studentQuery.isError) {
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
        onBack={backToRoster}
        onRetry={notFound ? undefined : () => studentQuery.refetch()}
      />
    );
  }

  const student = studentQuery.data;
  if (!student) {
    return (
      <StudentProfileError
        title="Student Not Found"
        message="The student you're looking for doesn't exist."
        onBack={backToRoster}
      />
    );
  }

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
                <span className="text-sm font-medium">Students</span>
              </button>

              <div className="flex items-center space-x-2 text-gray-400 dark:text-slate-500">
                <ChevronRight className="w-3 h-3" />
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </div>
              </div>
            </div>

            <PermissionGate permission={Permission.MANAGE_STUDENTS}>
              <div className="flex items-center space-x-3">
                <Tooltip
                  content="Update student personal details, guardian info, or class assignment."
                  side="top"
                >
                  <button
                    onClick={() => router.push(`/users/students/${studentId}/edit`)}
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
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-gray-50/50 dark:bg-slate-700/40 border-b border-gray-100 dark:border-slate-700 rounded-none h-auto p-0">
                {TABS.map(({ value, icon: Icon, long, short }) => (
                  <TabsTrigger key={value} value={value} className={triggerClass}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{long}</span>
                    <span className="sm:hidden">{short}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <CardContent className="p-4 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <TabsContent value="personal-details" className="mt-0">
                      <StudentPersonalTab student={student} />
                    </TabsContent>
                    <TabsContent value="parent-guardian" className="mt-0">
                      <StudentGuardianTab student={student} />
                    </TabsContent>
                    <TabsContent value="academic-info" className="mt-0">
                      <StudentAcademicTab student={student} />
                    </TabsContent>
                    <TabsContent value="attendance" className="mt-0">
                      <StudentAttendanceTab
                        student={student}
                        attendance={attendanceQuery.data}
                        isLoading={attendanceQuery.isLoading}
                        error={attendanceQuery.isError ? attendanceQuery.error : null}
                        onRetry={() => attendanceQuery.refetch()}
                      />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

/** `/users/students/[id]/view` — one student's profile, behind `manage:students`. */
export default function StudentProfilePage() {
  return (
    <RequirePermission permission={Permission.MANAGE_STUDENTS}>
      <StudentProfile />
    </RequirePermission>
  );
}
