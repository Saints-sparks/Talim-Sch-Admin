/**
 * The "add an existing fee to classes" wizard: its state, its per-class
 * overrides, and the payload it finally posts.
 *
 * The amounts and due dates here become what families owe, so the rules are
 * kept out of the page and next to their tests: every class needs a due date
 * (the API's `ClassAssignmentOverrideDto` requires one) and a non-negative
 * amount, and nothing is guessed on the user's behalf at submit time.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import type { AssignFeePayload, ClassAssignmentOverride, FeeItem } from "@/app/services/fees.service";
import { toDateInputValue } from "@/components/fees/formatters";

/** The steps of the wizard, in order. */
export const ASSIGN_STEPS = [
  "Select Fee",
  "Select Classes",
  "Set Amount & Due Date",
  "Review & Confirm",
] as const;

/** One class's editable amount and due date, as strings while being typed. */
export interface ClassOverrideDraft {
  classId: string;
  amount: string;
  dueDate: string;
  lateFeeAmount: string;
}

/** Every class's draft, keyed by class id. */
export type OverrideMap = Record<string, ClassOverrideDraft>;

/**
 * The draft a class starts with: the fee's own defaults.
 *
 * @param fee - The fee being assigned.
 * @param classId - The class the draft is for.
 * @returns The prefilled draft.
 */
export function defaultOverride(fee: FeeItem, classId: string): ClassOverrideDraft {
  return {
    classId,
    amount: String(fee.defaultAmount ?? 0),
    dueDate: toDateInputValue(fee.defaultDueDate),
    lateFeeAmount: String(fee.lateFeeAmount ?? 0),
  };
}

/**
 * The draft currently in effect for a class.
 *
 * @param overrides - Every draft so far.
 * @param fee - The fee being assigned.
 * @param classId - The class in question.
 * @returns The stored draft, or a fresh default.
 */
export function overrideFor(
  overrides: OverrideMap,
  fee: FeeItem,
  classId: string
): ClassOverrideDraft {
  return overrides[classId] ?? defaultOverride(fee, classId);
}

/**
 * Checks the per-class amounts and due dates before anything is posted.
 *
 * @param fee - The fee being assigned.
 * @param classIds - The selected class ids.
 * @param overrides - The drafts entered so far.
 * @returns A message naming the first problem, or null when every class is
 *   ready to assign.
 */
export function validateOverrides(
  fee: FeeItem,
  classIds: string[],
  overrides: OverrideMap
): string | null {
  if (classIds.length === 0) return "Select at least one class.";

  for (const classId of classIds) {
    const draft = overrideFor(overrides, fee, classId);
    const amount = Number(draft.amount);
    if (draft.amount.trim() === "" || !Number.isFinite(amount)) {
      return "Every class needs an amount.";
    }
    if (amount < 0) return "An amount cannot be negative.";
    if (!draft.dueDate) return "Every class needs a due date.";
    const lateFee = Number(draft.lateFeeAmount || 0);
    if (!Number.isFinite(lateFee) || lateFee < 0) return "A late fee cannot be negative.";
  }
  return null;
}

/**
 * Builds the `POST /fees/assignments` body.
 *
 * @param fee - The fee being assigned.
 * @param classIds - The selected class ids.
 * @param overrides - The per-class drafts.
 * @param period - The academic year and term to record against the
 *   assignments; either may be absent.
 * @returns The payload, matching `AssignFeeToClassesDto`.
 */
export function buildAssignPayload(
  fee: FeeItem,
  classIds: string[],
  overrides: OverrideMap,
  period: { academicYearId?: string; termId?: string } = {}
): AssignFeePayload {
  const classes: ClassAssignmentOverride[] = classIds.map((classId) => {
    const draft = overrideFor(overrides, fee, classId);
    return {
      classId,
      amount: Number(draft.amount),
      dueDate: draft.dueDate,
      lateFeeAmount: Number(draft.lateFeeAmount || 0),
      isVisibleToParents: fee.isVisibleToParents,
    };
  });

  return {
    feeItemId: fee._id,
    academicYearId: period.academicYearId || undefined,
    termId: period.termId || undefined,
    classes,
  };
}

/** What the wizard hook exposes to the page. */
export interface AssignWizardController {
  step: number;
  selectedFee: FeeItem | null;
  selectedClassIds: Set<string>;
  overrides: OverrideMap;
  setStep: (step: number) => void;
  selectFee: (fee: FeeItem) => void;
  toggleClass: (classId: string) => void;
  selectClasses: (classIds: string[]) => void;
  clearClasses: () => void;
  setOverrideField: (classId: string, field: keyof ClassOverrideDraft, value: string) => void;
  /** Copies the first selected class's amount and dates onto the rest. */
  applyFirstToAll: () => void;
  reset: () => void;
  /** Total of every selected class's amount. */
  totalAmount: number;
}

/**
 * Holds the assign wizard.
 *
 * @returns The wizard state and the actions that move it along.
 */
export function useAssignFeeWizard(): AssignWizardController {
  const [step, setStep] = useState(0);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<OverrideMap>({});

  const selectFee = useCallback((fee: FeeItem) => {
    setSelectedFee(fee);
    // The drafts were prefilled from the previous fee's defaults.
    setOverrides({});
  }, []);

  const toggleClass = useCallback((classId: string) => {
    setSelectedClassIds((current) => {
      const next = new Set(current);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }, []);

  const selectClasses = useCallback((classIds: string[]) => {
    setSelectedClassIds(new Set(classIds));
  }, []);

  const clearClasses = useCallback(() => setSelectedClassIds(new Set()), []);

  const setOverrideField = useCallback(
    (classId: string, field: keyof ClassOverrideDraft, value: string) => {
      setOverrides((current) => {
        const base = current[classId] ?? {
          classId,
          amount: "",
          dueDate: "",
          lateFeeAmount: "0",
        };
        return { ...current, [classId]: { ...base, classId, [field]: value } };
      });
    },
    []
  );

  const applyFirstToAll = useCallback(() => {
    setOverrides((current) => {
      const ids = Array.from(selectedClassIds);
      const firstId = ids[0];
      if (!firstId || !selectedFee) return current;
      const first = current[firstId] ?? defaultOverride(selectedFee, firstId);
      const next: OverrideMap = {};
      for (const classId of ids) next[classId] = { ...first, classId };
      return next;
    });
  }, [selectedClassIds, selectedFee]);

  const reset = useCallback(() => {
    setStep(0);
    setSelectedFee(null);
    setSelectedClassIds(new Set());
    setOverrides({});
  }, []);

  const totalAmount = useMemo(() => {
    if (!selectedFee) return 0;
    return Array.from(selectedClassIds).reduce((sum, classId) => {
      const draft = overrideFor(overrides, selectedFee, classId);
      const amount = Number(draft.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [overrides, selectedClassIds, selectedFee]);

  return {
    step,
    selectedFee,
    selectedClassIds,
    overrides,
    setStep,
    selectFee,
    toggleClass,
    selectClasses,
    clearClasses,
    setOverrideField,
    applyFirstToAll,
    reset,
    totalAmount,
  };
}
