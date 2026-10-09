"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Briefcase, Clock, GraduationCap, Pencil, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Tooltip } from "@/components/ui/Tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banner, Page, Pill, ghostButton } from "@/components/tl";
import { BackButton, ProfileHeaderCard } from "@/components/users/parts";
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
import { classTeacherIdsOf } from "@/components/users/teachers/classTeacher";

/** The profile's sections: tab value, icon, and the long and short (phone) labels. */
const TABS = [
  { value: "personal-details", icon: User, long: "Personal Details", short: "Personal" },
  { value: "qualifications", icon: GraduationCap, long: "Qualifications", short: "Quals" },
  { value: "employment", icon: Briefcase, long: "Employment", short: "Work" },
  { value: "assign", icon: BookOpen, long: "Assignments", short: "Assign" },
  { value: "availability", icon: Clock, long: "Availability", short: "Times" },
] as const;

/**
 * One teacher's profile: personal details, qualifications, employment,
 * assignments (with who they are the class teacher of) and availability.
 *
 * @returns The profile, or its loading and error states.
 */
function TeacherProfile() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>("personal-details");

  const profileQuery = useTeacherProfile(teacherId);
  // A6: class-teacher access is Class.classTeacherId alone; the profile's `classTeacherOf` says which.
  const classTeacherOf = useMemo(
    () => classTeacherIdsOf(profileQuery.data?.classTeacherOf),
    [profileQuery.data?.classTeacherOf],
  );
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
  const isActive = teacher.userId.isActive;
  const fullName = `${teacher.userId.firstName ?? ""} ${teacher.userId.lastName ?? ""}`.trim();

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1">
        <BackButton label="Teachers" onClick={backToRoster} />
        <span aria-hidden className="text-tl-faint">
          /
        </span>
        <span aria-current="page" className="px-2 text-sm font-bold text-tl-muted">
          Profile
        </span>
      </nav>

      <ProfileHeaderCard
        avatar={
          <Avatar
            src={teacher.userId.userAvatar}
            firstName={teacher.userId.firstName || "T"}
            lastName={teacher.userId.lastName || ""}
            className="h-20 w-20 text-2xl"
          />
        }
        eyebrowText="Teacher"
        name={fullName || "Teacher"}
        meta={[`Staff No. ${teacher.staffNumber || "Not assigned"}`, teacher.userId.email]
          .filter(Boolean)
          .join(" · ")}
        pills={
          <>
            <Pill tone={isActive ? "success" : "muted"} dot>
              {isActive ? "Active" : "Inactive"}
            </Pill>
            {teacher.isFormTeacher ? <Pill tone="accent">Form Teacher</Pill> : null}
          </>
        }
        actions={
          <PermissionGate permission={Permission.MANAGE_TEACHERS}>
            <Tooltip content="Update this teacher's details, employment and assignments." side="top">
              <Link href={`/users/teachers/${teacherId}/edit`} className={ghostButton}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit Profile
              </Link>
            </Tooltip>
          </PermissionGate>
        }
      />

      {!teacher.hasTeacherProfile && (
        <Banner tone="warning">
          This teacher account exists, but its teacher profile has not been completed yet. You can
          still view the account details.
        </Banner>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList aria-label="Teacher profile sections">
          {TABS.map(({ value, icon: Icon, long, short }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{long}</span>
              <span className="sm:hidden">{short}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="personal-details">
          <TeacherPersonalTab teacher={teacher} />
        </TabsContent>
        <TabsContent value="qualifications">
          <TeacherQualificationsTab teacher={teacher} />
        </TabsContent>
        <TabsContent value="employment">
          <TeacherEmploymentTab teacher={teacher} />
        </TabsContent>
        <TabsContent value="assign">
          <TeacherAssignmentsTab teacher={teacher} classTeacherOf={classTeacherOf} />
        </TabsContent>
        <TabsContent value="availability">
          <TeacherAvailabilityTab teacher={teacher} />
        </TabsContent>
      </Tabs>
    </Page>
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
