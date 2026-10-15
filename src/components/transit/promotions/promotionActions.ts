/**
 * What a promotion run does to each student (contract
 * history-records-and-transcripts §4): promote to a class, repeat, graduate
 * (top level only) or withdraw, and when the wizard offers Graduate.
 *
 * The level rules mirror talimBE-V2 `transit/service/levels.ts`, so the
 * wizard offers Graduate where the backend would allow it; the backend
 * still validates every run.
 */
import type { PromotionAction, PromotionDecision } from "@/app/services/transit.service";

/** The actions in the order the wizard lists them, with their labels. */
export const PROMOTION_ACTIONS: ReadonlyArray<{ value: PromotionAction; label: string }> = [
  { value: "promote", label: "Promote" },
  { value: "repeat", label: "Repeat" },
  { value: "graduate", label: "Graduate" },
  { value: "withdraw", label: "Withdraw" },
];

/**
 * An action's label.
 *
 * @param action - The action.
 * @returns e.g. "Graduate".
 */
export function actionLabel(action: PromotionAction): string {
  return PROMOTION_ACTIONS.find((a) => a.value === action)?.label ?? action;
}

/**
 * The action of a stored decision; runs created before `action` existed say
 * repeat with `repeatClass: true` and promote otherwise.
 *
 * @param decision - The decision.
 * @returns The action.
 */
export function decisionAction(
  decision: Pick<PromotionDecision, "action" | "repeatClass">
): PromotionAction {
  return decision.action ?? (decision.repeatClass ? "repeat" : "promote");
}

/**
 * Whether an action moves the student into a class (and so needs one).
 *
 * @param action - The action.
 * @returns True for promote (required) and repeat (optional: the same class).
 */
export function actionTakesClass(action: PromotionAction): boolean {
  return action === "promote" || action === "repeat";
}

/** Bands of a school ladder, lowest first (as the backend's `levels.ts`). */
const BANDS: ReadonlyArray<{ pattern: RegExp; base: number }> = [
  { pattern: /^(?:nursery|kg|kindergarten|reception|pre-?school)\s*(\d*)/i, base: 0 },
  { pattern: /^(?:primary|basic|pry|grade|year|class|p)\s*(\d{1,2})\b/i, base: 100 },
  { pattern: /^(?:jss|js|junior\s+secondary(?:\s+school)?)\s*(\d)\b/i, base: 200 },
  { pattern: /^(?:sss|ss|senior\s+secondary(?:\s+school)?)\s*(\d)\b/i, base: 300 },
];

/**
 * The order of a class level: higher is a later year ("JSS 1" 201, "SS 3" 303).
 *
 * @param gradeLevel - The class's level label.
 * @returns The order, or `null` when it cannot be told.
 */
export function levelOrderOf(gradeLevel: string | null | undefined): number | null {
  const label = (gradeLevel ?? "").trim();
  if (!label) return null;
  for (const band of BANDS) {
    const match = band.pattern.exec(label);
    if (match) return band.base + Number(match[1] || 0);
  }
  return null;
}

/**
 * The school's top level, or `null` when any class's level cannot be told
 * (then Graduate is offered everywhere and the backend warns).
 *
 * @param classes - The school's classes.
 * @returns The top order, or `null`.
 */
export function topLevelOf(classes: ReadonlyArray<{ gradeLevel?: string | null }>): number | null {
  if (!classes.length) return null;
  let top = -Infinity;
  for (const klass of classes) {
    const order = levelOrderOf(klass.gradeLevel);
    if (order === null) return null;
    top = Math.max(top, order);
  }
  return top;
}

/**
 * Whether Graduate is offered to a student in a class: from the top level,
 * or anywhere when the levels cannot be told.
 *
 * @param fromClassId - The student's class.
 * @param classes - The school's classes, with levels.
 * @returns True when Graduate is offered.
 */
export function canGraduateFrom(
  fromClassId: string,
  classes: ReadonlyArray<{ _id: string; gradeLevel?: string | null }>
): boolean {
  const top = topLevelOf(classes);
  if (top === null) return true;
  const klass = classes.find((c) => c._id === fromClassId);
  if (!klass) return true;
  return levelOrderOf(klass.gradeLevel) === top;
}

/**
 * The actions offered to a student in a class.
 *
 * @param fromClassId - The student's class.
 * @param classes - The school's classes.
 * @returns The actions (Graduate only from the top level).
 */
export function actionsFor(
  fromClassId: string,
  classes: ReadonlyArray<{ _id: string; gradeLevel?: string | null }>
): ReadonlyArray<{ value: PromotionAction; label: string }> {
  const graduate = canGraduateFrom(fromClassId, classes);
  return PROMOTION_ACTIONS.filter((a) => a.value !== "graduate" || graduate);
}

/**
 * How many decisions take each action, in the order the wizard lists them.
 *
 * @param decisions - The decisions.
 * @returns One count per action that has any.
 */
export function actionCounts(
  decisions: ReadonlyArray<Pick<PromotionDecision, "action" | "repeatClass">>
): Array<{ action: PromotionAction; label: string; count: number }> {
  const counts = new Map<PromotionAction, number>();
  for (const decision of decisions) {
    const action = decisionAction(decision);
    counts.set(action, (counts.get(action) ?? 0) + 1);
  }
  return PROMOTION_ACTIONS.filter((a) => counts.has(a.value)).map((a) => ({
    action: a.value,
    label: a.label,
    count: counts.get(a.value) ?? 0,
  }));
}
