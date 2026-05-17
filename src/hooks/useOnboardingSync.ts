"use client";

import { useCallback } from "react";
import { useOnboarding, OnboardingStepId } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { getAcademicYears, getTimetableEntries } from "@/app/services/academic.service";
import { getClasses } from "@/app/services/school.service";
import {
  getSubjectsBySchool,
  getCoursesBySchool,
} from "@/app/services/subjects.service";
import { teacherService } from "@/app/services/teacher.service";
import { studentService } from "@/app/services/student.service";
import { assessmentService } from "@/app/services/assessment.service";
import { getAnnouncementsBySender } from "@/app/services/announcement.service";

const getCollectionItems = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.classes)) return value.classes;
  if (Array.isArray(value?.subjects)) return value.subjects;
  if (Array.isArray(value?.courses)) return value.courses;
  if (Array.isArray(value?.teachers)) return value.teachers;
  if (Array.isArray(value?.students)) return value.students;
  if (Array.isArray(value?.announcements)) return value.announcements;
  if (Array.isArray(value?.assessments)) return value.assessments;
  return [];
};

const hasCollectionItems = (value: any): boolean => {
  const total =
    value?.meta?.total ??
    value?.pagination?.totalItems ??
    value?.count ??
    value?.total ??
    getCollectionItems(value).length;

  return Number(total) > 0;
};

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
          return hasCollectionItems(data);
        },
      },
      {
        id: "create-class",
        fn: async () => {
          const data = await getClasses();
          return hasCollectionItems(data);
        },
      },
      {
        id: "add-teacher",
        fn: async () => {
          const res = await teacherService.getTeachers(1, 1);
          return hasCollectionItems(res);
        },
      },
      {
        id: "add-student",
        fn: async () => {
          const res = await studentService.getStudents(1, 1);
          return hasCollectionItems(res);
        },
      },
      {
        id: "create-subject",
        fn: async () => {
          const data = await getSubjectsBySchool();
          return hasCollectionItems(data);
        },
      },
      {
        id: "create-course",
        fn: async () => {
          const data = await getCoursesBySchool();
          return hasCollectionItems(data);
        },
      },
      {
        id: "create-announcement",
        fn: async () => {
          const userId = user.userId || (user as any)._id;
          if (!userId) return false;
          const res = await getAnnouncementsBySender(userId, 1, 1);
          return hasCollectionItems(res);
        },
      },
      {
        id: "create-assessment",
        fn: async () => {
          const res = await assessmentService.getAssessmentsBySchool(1, 1);
          return hasCollectionItems(res);
        },
      },
      {
        id: "timetable-entry",
        fn: async () => {
          const data = await getTimetableEntries();
          // Response is a day-keyed object: { Monday: [...], Tuesday: [...], ... }
          if (data && typeof data === "object" && !Array.isArray(data)) {
            return Object.values(data).some(
              (entries) => Array.isArray(entries) && entries.length > 0
            );
          }
          return hasCollectionItems(data);
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
