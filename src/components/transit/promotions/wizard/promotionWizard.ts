import {
  buildBulkDecisions,
  refId,
  studentLabel,
  type PromotionAction,
  type PromotionDecision,
  type StudentEnrollment,
} from "@/app/services/transit.service";
import type { DecisionDraft } from "@/components/transit/promotions/DecisionEditor";
import { actionTakesClass } from "@/components/transit/promotions/promotionActions";

/** What a whole-class run does: move the class up, or graduate it (top level). */
export type BulkAction = Extract<PromotionAction, "promote" | "graduate">;

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
  checked: boolean
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
      action: "promote",
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
  patch: Partial<DecisionDraft>
): DecisionDraft[] {
  return current.map((decision) =>
    decision.studentId === studentId ? { ...decision, ...patch } : decision
  );
}

/**
 * The decisions of a whole-class run: every enrolled student moves from the
 * source class to the target class, or (top level) graduates.
 *
 * @param enrollments - The source class's active enrollments.
 * @param sourceClassId - The class they leave.
 * @param targetClassId - The class they enter (unused to graduate).
 * @param action - `promote` (default) or `graduate`.
 * @returns One named draft per student.
 */
export function bulkDecisionDrafts(
  enrollments: StudentEnrollment[],
  sourceClassId: string,
  targetClassId: string,
  action: BulkAction = "promote"
): DecisionDraft[] {
  return buildBulkDecisions(enrollments, sourceClassId, targetClassId, action).map((decision) => {
    const enrollment =
      enrollments.find((item) => refId(item.studentId) === decision.studentId) ?? enrollments[0];
    return {
      ...decision,
      toClassId: decision.toClassId ?? "",
      action,
      studentName: enrollmentName(enrollment) || decision.studentId,
    };
  });
}

/**
 * Whether a decision is complete enough to send: a student and their class,
 * and a target class when the student is promoted. Repeat stays in the source
 * class unless a class is chosen; graduate and withdraw take none.
 *
 * @param decision - The draft.
 * @returns True when it can be sent.
 */
export function isDecisionReady(decision: DecisionDraft): boolean {
  if (!decision.studentId || !decision.fromClassId) return false;
  return decision.action !== "promote" || Boolean(decision.toClassId);
}

/**
 * The decisions that are complete enough to send.
 *
 * @param decisions - The drafts.
 * @returns Those {@link isDecisionReady} accepts.
 */
export function readyDecisions(decisions: DecisionDraft[]): DecisionDraft[] {
  return decisions.filter(isDecisionReady);
}

/**
 * The decisions as the API takes them: the display name dropped, `action`
 * sent, the target class only when the action moves the student into one,
 * and `repeatClass` kept in step with the action (older servers read it).
 *
 * @param decisions - The drafts.
 * @returns The request's decisions.
 */
export function toRequestDecisions(decisions: DecisionDraft[]): PromotionDecision[] {
  return decisions.map(({ studentId, fromClassId, toClassId, action, targetGradeLevel }) => {
    const movesIntoClass = actionTakesClass(action);
    return {
      studentId,
      fromClassId,
      ...(movesIntoClass && toClassId ? { toClassId } : {}),
      action,
      ...(movesIntoClass && targetGradeLevel ? { targetGradeLevel } : {}),
      repeatClass: action === "repeat",
    };
  });
}
