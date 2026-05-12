"use client";

import { useCallback } from "react";
import { useOnboarding, OnboardingStepId } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { getAcademicYears } from "@/app/services/academic.service";
import { getClasses } from "@/app/services/school.service";
import {
  getSubjectsBySchool,
  getCoursesBySchool,
} from "@/app/services/subjects.service";
import { teacherService } from "@/app/services/teacher.service";
import { studentService } from "@/app/services/student.service";
import { assessmentService } from "@/app/services/assessment.service";
import { getAnnouncementsBySender } from "@/app/services/announcement.service";

/**
 * Returns syncProgress() — checks all 8 phase-2 steps against real API data
 * (using limit=1 for paginated endpoints to keep it cheap) and marks any
 * completed steps in the onboarding context / localStorage.
 *
 * Called automatically on every route change (throttled) by AppShell.
 * Can also be called imperatively after a mutation for instant feedback.
 */
export function useOnboardingSync() {
  const { markStepComplete } = useOnboarding();
  const { user } = useAuth();

  const syncProgress = useCallback(async () => {
    if (!user) return;

    type Check = { id: OnboardingStepId; fn: () => Promise<boolean> };

    const checks: Check[] = [
      {
        id: "academic-year",
        fn: async () => {
          const data = await getAcademicYears();
          return Array.isArray(data) && data.length > 0;
        },
      },
      {
        id: "create-class",
        fn: async () => {
          const data = await getClasses();
          return Array.isArray(data) && data.length > 0;
        },
      },
      {
        id: "add-teacher",
        fn: async () => {
          const res = await teacherService.getTeachers(1, 1);
          return (res?.meta?.total ?? res?.data?.length ?? 0) > 0;
        },
      },
      {
        id: "add-student",
        fn: async () => {
          const res = await studentService.getStudents(1, 1);
          return (res?.meta?.total ?? res?.data?.length ?? 0) > 0;
        },
      },
      {
        id: "create-subject",
        fn: async () => {
          const data = await getSubjectsBySchool();
          return Array.isArray(data) && data.length > 0;
        },
      },
      {
        id: "create-course",
        fn: async () => {
          const data = await getCoursesBySchool();
          return Array.isArray(data) && data.length > 0;
        },
      },
      {
        id: "create-announcement",
        fn: async () => {
          const userId = user.userId || (user as any)._id;
          if (!userId) return false;
          const res = await getAnnouncementsBySender(userId, 1, 1);
          return (res?.meta?.total ?? res?.data?.length ?? 0) > 0;
        },
      },
      {
        id: "create-assessment",
        fn: async () => {
          const res = await assessmentService.getAssessmentsBySchool(1, 1);
          return (
            (res?.pagination?.totalItems ?? res?.assessments?.length ?? 0) > 0
          );
        },
      },
    ];

    const results = await Promise.allSettled(checks.map((c) => c.fn()));

    checks.forEach((check, i) => {
      const result = results[i];
      if (result.status === "fulfilled" && result.value === true) {
        markStepComplete(check.id);
      }
    });
  }, [user, markStepComplete]);

  return { syncProgress };
}
