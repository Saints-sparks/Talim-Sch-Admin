/**
 * Which permission each setup step needs, mirroring the backend decorators.
 *
 * The setup checklist is not behind a single route permission — every step
 * writes to a different module, and a sub-admin only holds some of them. The
 * map lets the checklist show a step it cannot perform as blocked rather than
 * handing the user a form the API would refuse:
 *
 * - academic year & term → `@Permissions(MANAGE_SETTINGS)` on `academic-year-term`
 * - classes              → `@Permissions(MANAGE_CLASSES)` on `classes`
 * - teachers / students  → `@Permissions(MANAGE_TEACHERS | MANAGE_STUDENTS)` on `user`
 * - subjects & courses   → `@Permissions(MANAGE_CURRICULUM)` on `subjects-courses`
 * - announcements        → `@Permissions(MANAGE_ANNOUNCEMENTS)` on `notification`
 * - timetable            → `@Permissions(MANAGE_TIMETABLE)` on `timetable`
 * - assessments          → `@Permissions(MANAGE_ASSESSMENTS)` on `assessments`
 *
 * Phase-1 steps are the administrator's own profile and the school record, so
 * they carry no extra permission beyond being signed in.
 */
import { Permission, type PermissionValue } from "@/lib/permissions";
import type { OnboardingStepId } from "@/context/OnboardingContext";

/** Step id → the permission the API requires for it, or `null` when none. */
export const STEP_PERMISSIONS: Record<OnboardingStepId, PermissionValue | null> = {
  "school-profile": Permission.MANAGE_SETTINGS,
  "personal-profile": null,
  "academic-year": Permission.MANAGE_SETTINGS,
  "create-class": Permission.MANAGE_CLASSES,
  "add-teacher": Permission.MANAGE_TEACHERS,
  "add-student": Permission.MANAGE_STUDENTS,
  "create-subject": Permission.MANAGE_CURRICULUM,
  "create-course": Permission.MANAGE_CURRICULUM,
  "create-announcement": Permission.MANAGE_ANNOUNCEMENTS,
  "timetable-entry": Permission.MANAGE_TIMETABLE,
  "create-assessment": Permission.MANAGE_ASSESSMENTS,
};

/**
 * The permission a step needs.
 *
 * @param stepId - The step being opened.
 * @returns The permission value, or `null` when the step needs none.
 */
export function permissionForStep(stepId: OnboardingStepId): PermissionValue | null {
  return STEP_PERMISSIONS[stepId];
}
