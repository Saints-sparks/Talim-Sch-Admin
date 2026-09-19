"use client";

import { useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/apiError";
import { toast } from "@/components/CustomToast";
import { refId, type StudentEnrollment } from "@/app/services/transit.service";
import { useEnrollments } from "@/hooks/transit/useEnrollments";
import { useCreatePromotionRun } from "@/hooks/transit/usePromotionRuns";
import type { DecisionDraft } from "@/components/transit/promotions/DecisionEditor";
import {
  bulkDecisionDrafts,
  canContinueSetup,
  patchDecision,
  readyDecisions,
  stepLabels,
  toggleDecision,
  toRequestDecisions,
  type Mode,
  type Step,
} from "./promotionWizard";

/**
 * The state and actions of the create-promotion-run wizard.
 *
 * The roster is the source year's active enrollments (one class in bulk mode),
 * held back until a source year is chosen. In bulk mode the decisions are the
 * whole class, regenerated whenever the roster or either class changes.
 *
 * @param onCreated - Called after the run was created and validated.
 * @returns Everything the wizard's steps render and call.
 */
export function usePromotionWizard(onCreated: () => void) {
  const [step, setStep] = useState<Step>(1);
  const [fromAcademicYearId, setFromAcademicYearId] = useState("");
  const [toAcademicYearId, setToAcademicYearId] = useState("");
  const [targetTermId, setTargetTermId] = useState("");
  const [mode, setModeState] = useState<Mode>("individual");
  const [sourceClassId, setSourceClassId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<DecisionDraft[]>([]);

  const createRun = useCreatePromotionRun();

  const roster = useEnrollments(
    {
      academicYearId: fromAcademicYearId,
      status: "active",
      classId: mode === "bulk" ? sourceClassId : undefined,
    },
    Boolean(fromAcademicYearId) && (mode === "individual" || Boolean(sourceClassId)),
  );
  const enrollments = useMemo(() => roster.data ?? [], [roster.data]);

  useEffect(() => {
    if (mode !== "bulk" || !sourceClassId || !targetClassId) return;
    setDecisions(bulkDecisionDrafts(enrollments, sourceClassId, targetClassId));
  }, [enrollments, mode, sourceClassId, targetClassId]);

  /** Switches mode, clearing what the other mode had built. */
  function setMode(next: Mode) {
    setModeState(next);
    setDecisions([]);
    setSelectedIds(new Set());
  }

  /** Picks the bulk source class, clearing the preview until its roster loads. */
  function chooseSourceClass(classId: string) {
    setSourceClassId(classId);
    setDecisions([]);
  }

  function toggleStudent(enrollment: StudentEnrollment, checked: boolean) {
    const studentId = refId(enrollment.studentId);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
    setDecisions((current) => toggleDecision(current, enrollment, checked));
  }

  function updateDecision(studentId: string, patch: Partial<DecisionDraft>) {
    setDecisions((current) => patchDecision(current, studentId, patch));
  }

  /** Leaves the picking step for review, keeping only complete decisions. */
  function goToReview() {
    const ready = readyDecisions(decisions);
    if (!ready.length) {
      toast.error("Give at least one student a target class");
      return;
    }
    setDecisions(ready);
    setStep(3);
  }

  async function submit() {
    try {
      await createRun.mutateAsync({
        fromAcademicYearId,
        toAcademicYearId,
        targetTermId: targetTermId || undefined,
        decisions: toRequestDecisions(decisions),
      });
      toast.success("Promotion run created and validated");
      onCreated();
    } catch (err) {
      logger.error("transit", "promotion run create failed", err);
      toast.error(getErrorMessage(err, "Couldn't create the promotion run"));
    }
  }

  return {
    step,
    setStep,
    fromAcademicYearId,
    setFromAcademicYearId,
    toAcademicYearId,
    setToAcademicYearId,
    targetTermId,
    setTargetTermId,
    mode,
    setMode,
    sourceClassId,
    chooseSourceClass,
    targetClassId,
    setTargetClassId,
    selectedIds,
    decisions,
    roster,
    enrollments,
    isSubmitting: createRun.isPending,
    canContinueSetup: canContinueSetup(fromAcademicYearId, toAcademicYearId),
    stepLabels: stepLabels(mode),
    toggleStudent,
    updateDecision,
    goToReview,
    submit,
  };
}
