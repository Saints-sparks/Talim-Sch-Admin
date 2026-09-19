import {
  buildBulkDecisions,
  refId,
  studentLabel,
  type PromotionDecision,
  type StudentEnrollment,
} from "@/app/services/transit.service";
import type { DecisionDraft } from "@/components/transit/promotions/DecisionEditor";

/** Whether the admin is choosing students one by one or promoting a whole class. */
export type Mode = "individual" | "bulk";

/** Which pane of the wizard is showing. */
export type Step = 1 | 2 | 3 | 4;

/**
 * Names a student from the enrollment the API populated.
 *
 * @param enrollment - The enrollment.
 * @returns The student's display name, or their id when unnamed.
 */
export function enrollmentName(enrollment: StudentEnrollment): string {
  return studentLabel(enrollment.studentId, refId(enrollment.studentId));
}

/**
 * The labels of the wizard's step pills.
 *
 * @param mode - The chosen mode; it names the second step.
 * @returns Four labels, one per step.
 */
export function stepLabels(mode: Mode): string[] {
  return ["Setup", mode === "individual" ? "Students" : "Bulk Class", "Review", "Submit"];
}

/**
 * Whether the setup step can move on: two different years chosen.
 *
 * @param fromAcademicYearId - The source year.
 * @param toAcademicYearId - The target year.
 * @returns True when both are set and they differ.
 */
export function canContinueSetup(fromAcademicYearId: string, toAcademicYearId: string): boolean {
  return Boolean(fromAcademicYearId && toAcademicYearId && fromAcademicYearId !== toAcademicYearId);
}

/**
 * Ticks or unticks a student: adds a blank decision (no target class yet) or
 * removes theirs. Ticking a student who already has one changes nothing.
 *
 * @param current - The decisions so far.
 * @param enrollment - The student's active enrollment.
 * @param checked - Whether the box is now ticked.
 * @returns The next decisions.
 */
export function toggleDecision(
  current: DecisionDraft[],
  enrollment: StudentEnrollment,
  checked: boolean,
): DecisionDraft[] {
  const studentId = refId(enrollment.studentId);
  if (!checked) return current.filter((decision) => decision.studentId !== studentId);
  if (current.some((decision) => decision.studentId === studentId)) return current;
  return [
    ...current,
    {
      studentId,
      studentName: enrollmentName(enrollment),
      fromClassId: refId(enrollment.classId),
      toClassId: "",
      repeatClass: false,
    },
  ];
}

/**
 * Applies an edit to one student's decision.
 *
 * @param current - The decisions so far.
 * @param studentId - Whose decision changes.
 * @param patch - The fields to change.
 * @returns The next decisions.
 */
export function patchDecision(
  current: DecisionDraft[],
  studentId: string,
  patch: Partial<DecisionDraft>,
): DecisionDraft[] {
  return current.map((decision) => (decision.studentId === studentId ? { ...decision, ...patch } : decision));
}

/**
 * The decisions of a whole-class promotion: every enrolled student moves from
 * the source class to the target class.
 *
 * @param enrollments - The source class's active enrollments.
 * @param sourceClassId - The class they leave.
 * @param targetClassId - The class they enter.
 * @returns One named draft per student.
 */
export function bulkDecisionDrafts(
  enrollments: StudentEnrollment[],
  sourceClassId: string,
  targetClassId: string,
): DecisionDraft[] {
  return buildBulkDecisions(enrollments, sourceClassId, targetClassId).map((decision) => {
    const enrollment = enrollments.find((item) => refId(item.studentId) === decision.studentId) ?? enrollments[0];
    return { ...decision, studentName: enrollmentName(enrollment) || decision.studentId };
  });
}

/**
 * The decisions that are complete enough to send: a student, where they are,
 * and where they are going.
 *
 * @param decisions - The drafts.
 * @returns Those with all three ids.
 */
export function readyDecisions(decisions: DecisionDraft[]): DecisionDraft[] {
  return decisions.filter((decision) => decision.studentId && decision.fromClassId && decision.toClassId);
}

/**
 * Drops the display-only student name so the rest matches the DTO.
 *
 * @param decisions - The drafts.
 * @returns The decisions as the API takes them.
 */
export function toRequestDecisions(decisions: DecisionDraft[]): PromotionDecision[] {
  return decisions.map(({ studentName: _name, ...decision }) => decision);
}
