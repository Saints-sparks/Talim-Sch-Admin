"use client";

import React, { useState } from "react";
import Link from "next/link";
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
import { ParentLinkCodeCard } from "@/components/users/students/ParentLinkCodeCard";
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
  "flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-tl-surface data-[state=active]:border-b-2 data-[state=active]:border-tl-brand data-[state=active]:text-tl-brand rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50";

/**
 * One student's profile: personal details, parent/guardian (with the parent
 * link code), academic info and attendance.
 *
 * @returns The profile, or its loading and error states.
 */
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
    <div className="mx-auto w-full max-w-[1460px] pb-16">
      <div className="px-[clamp(14px,3vw,26px)] pt-[clamp(18px,3vw,28px)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={backToRoster}
                className="flex items-center space-x-2 text-tl-muted hover:text-tl-link transition-all duration-200 group p-2 rounded-lg hover:bg-tl-select"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="text-sm font-medium">Students</span>
              </button>

              <div className="flex items-center space-x-2 text-tl-faint">
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
                  <Link
                    href={`/users/students/${studentId}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-tl-muted hover:text-tl-link hover:bg-tl-select rounded-lg transition-all duration-200 border border-tl-line hover:border-tl-control text-sm font-medium"
                  >
                    <FiEdit className="w-4 h-4" aria-hidden />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                </Tooltip>
              </div>
            </PermissionGate>
          </div>
        </div>
      </div>

      <div className="px-[clamp(14px,3vw,26px)] pt-[18px]">
        <div className="mx-auto">
          <div className="overflow-hidden rounded-[22px] border border-tl-line bg-tl-surface shadow-[0_1px_2px_rgba(15,27,46,0.04),0_14px_30px_-22px_rgba(15,27,46,0.18)] dark:shadow-none">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-tl-subtle border-b border-tl-line-soft rounded-none h-auto p-0">
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
                      {/* A11: gated like the profile's other student actions. */}
                      <PermissionGate permission={Permission.MANAGE_STUDENTS}>
                        <div className="mt-6">
                          <ParentLinkCodeCard
                            studentId={student._id}
                            studentName={`${student.userId?.firstName ?? ""} ${student.userId?.lastName ?? ""}`.trim()}
                          />
                        </div>
                      </PermissionGate>
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
