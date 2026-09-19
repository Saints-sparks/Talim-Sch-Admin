/**
 * Reconciles the stored onboarding checklist with what the school actually
 * has.
 *
 * Progress is remembered locally, so a school that created its classes from
 * the Classes page (or on another device) would otherwise be asked to create
 * them again. Every phase-2 step has a cheap probe here — one row is enough to
 * answer "does this exist yet?" — and any step the data says is done is ticked
 * off. Probes never un-tick a step: a failing request must not look like an
 * empty school.
 */
"use client";

import { useCallback, useRef } from "react";
import { useOnboarding, type OnboardingStepId } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { getAcademicYears } from "@/app/services/academic.service";
import { getClasses } from "@/app/services/school.service";
import { getTimetableByClass } from "@/app/services/timetable.service";
import { getCoursesBySchool, getSubjectsBySchool } from "@/app/services/subjects.service";
import { teacherService } from "@/app/services/teacher.service";
import { studentService } from "@/app/services/student.service";
import { assessmentService } from "@/app/services/assessment.service";
import { getAnnouncementsBySender } from "@/app/services/announcement.service";

/** A page of rows as the paginated services return one. */
interface PagedRows<T> {
  data: T[];
  meta?: { total?: number };
}

/**
 * Whether a paginated response holds at least one row.
 *
 * `meta.total` is trusted when the API sends it, because the probes ask for a
 * single row and a total tells us about the rest of the collection too.
 *
 * @param page - The page the service returned.
 * @returns True when the collection is non-empty.
 */
function pageHasRows<T>(page: PagedRows<T>): boolean {
  if (typeof page.meta?.total === "number") return page.meta.total > 0;
  return page.data.length > 0;
}

/** What {@link useOnboardingSync} returns. */
export interface OnboardingSync {
  /** Probes every phase-2 step and ticks off the ones already satisfied. */
  syncProgress: () => Promise<void>;
}

/**
 * Whether any of the given classes has a timetable entry.
 *
 * The API has no school-wide timetable read — a timetable is always read for
 * one class — so the answer is derived class by class, stopping at the first
 * entry. A class with no entries reads as empty, not as a failure.
 *
 * @param classIds - The school's class ids.
 * @returns True when at least one class has an entry.
 * @throws ApiError When a class's timetable cannot be read.
 */
async function anyClassHasTimetable(classIds: string[]): Promise<boolean> {
  for (const classId of classIds) {
    const byDay = await getTimetableByClass(classId);
    if (Object.values(byDay).some((entries) => (entries?.length ?? 0) > 0)) return true;
  }
  return false;
}

/**
 * Keeps the setup checklist in step with the school's real data.
 *
 * Called on route changes by the app shell, and directly by the setup screen
 * when it opens.
 *
 * @returns The `syncProgress` function.
 */
export function useOnboardingSync(): OnboardingSync {
  const { markStepComplete, isStepComplete } = useOnboarding();
  const { user } = useAuth();
  // Read through a ref so a tick does not change `syncProgress` and re-run the
  // effects that depend on it.
  const isStepCompleteRef = useRef(isStepComplete);
  isStepCompleteRef.current = isStepComplete;

  const syncProgress = useCallback(async () => {
    // Every probe would be refused while a temporary password is still in use.
    if (!user || user.mustChangePassword) return;
    const senderId = user.userId ?? user._id ?? null;
    // The class list answers two probes; ask for it once per sync.
    let classes: ReturnType<typeof getClasses> | undefined;
    const loadClasses = () => (classes ??= getClasses());

    /** One step and the question that decides whether it is done. */
    const checks: Array<{ id: OnboardingStepId; probe: () => Promise<boolean> }> = [
      {
        id: "academic-year",
        probe: async () => (await getAcademicYears()).length > 0,
      },
      {
        id: "create-class",
        probe: async () => (await loadClasses()).length > 0,
      },
      {
        id: "add-teacher",
        probe: async () => pageHasRows(await teacherService.getTeachers(1, 1)),
      },
      {
        id: "add-student",
        probe: async () => pageHasRows(await studentService.getStudents(1, 1)),
      },
      {
        id: "create-subject",
        probe: async () => (await getSubjectsBySchool()).length > 0,
      },
      {
        id: "create-course",
        probe: async () => (await getCoursesBySchool()).length > 0,
      },
      {
        id: "create-announcement",
        probe: async () => {
          if (!senderId) return false;
          const page = await getAnnouncementsBySender(senderId, 1, 1);
          return page.data.length > 0;
        },
      },
      {
        id: "create-assessment",
        probe: async () => {
          const page = await assessmentService.getAssessmentsBySchool(1, 1);
          return page.pagination.totalItems > 0 || page.assessments.length > 0;
        },
      },
      {
        id: "timetable-entry",
        probe: async () => {
          // Checking costs a request per class, so a step already ticked is not asked again.
          if (isStepCompleteRef.current("timetable-entry")) return false;
          const classIds = (await loadClasses()).map((klass) => klass._id);
          return anyClassHasTimetable(classIds);
        },
      },
    ];

    const results = await Promise.allSettled(checks.map((check) => check.probe()));

    results.forEach((result, index) => {
      // A rejected probe leaves the step as it was — an outage is not proof
      // that the school has nothing.
      if (result.status === "fulfilled" && result.value) markStepComplete(checks[index].id);
    });
  }, [user, markStepComplete]);

  return { syncProgress };
}
