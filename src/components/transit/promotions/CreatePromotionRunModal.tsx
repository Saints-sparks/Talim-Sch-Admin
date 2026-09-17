"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/apiError";
import { toast } from "@/components/CustomToast";
import {
  buildBulkDecisions,
  refId,
  studentLabel,
  type StudentEnrollment,
} from "@/app/services/transit.service";
import {
  getAcademicYearLabel,
  type AcademicYearResponse,
  type TermResponse,
} from "@/app/services/academic.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { useEnrollments } from "@/hooks/transit/useEnrollments";
import { useCreatePromotionRun } from "@/hooks/transit/usePromotionRuns";
import {
  PrimaryButton,
  SecondaryButton,
  SelectField,
  SkeletonRows,
  surface,
  text,
  TransitModal,
} from "@/components/transit/ui";
import { classNameById } from "@/components/transit/promotions/promotionUi";
import { DecisionEditor, type DecisionDraft } from "@/components/transit/promotions/DecisionEditor";

/** Whether the admin is choosing students one by one or promoting a whole class. */
type Mode = "individual" | "bulk";

/** Which pane of the wizard is showing. */
type Step = 1 | 2 | 3 | 4;

/** Names a student from the enrollment the API populated. */
function nameOf(enrollment: StudentEnrollment): string {
  return studentLabel(enrollment.studentId, refId(enrollment.studentId));
}

/**
 * The four-step wizard that builds a promotion run.
 *
 * The API validates the run as it creates it, so this only has to produce
 * decisions the DTO accepts: a student, the class they are in, and the class
 * they are moving to.
 */
export function CreatePromotionRunModal({
  academicYears,
  terms,
  classes,
  onClose,
  onCreated,
}: {
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  classes: ClassOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [fromAcademicYearId, setFromAcademicYearId] = useState("");
  const [toAcademicYearId, setToAcademicYearId] = useState("");
  const [targetTermId, setTargetTermId] = useState("");
  const [mode, setMode] = useState<Mode>("individual");
  const [sourceClassId, setSourceClassId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<DecisionDraft[]>([]);

  const createRun = useCreatePromotionRun();

  // The roster to promote: the source year's active enrollments, narrowed to
  // one class in bulk mode. Held back until a source year is chosen.
  const roster = useEnrollments(
    {
      academicYearId: fromAcademicYearId,
      status: "active",
      classId: mode === "bulk" ? sourceClassId : undefined,
    },
    Boolean(fromAcademicYearId) && (mode === "individual" || Boolean(sourceClassId))
  );
  const enrollments = useMemo(() => roster.data ?? [], [roster.data]);

  // In bulk mode the decisions are the whole class, regenerated whenever the
  // roster or either class changes.
  useEffect(() => {
    if (mode !== "bulk" || !sourceClassId || !targetClassId) return;
    setDecisions(
      buildBulkDecisions(enrollments, sourceClassId, targetClassId).map((decision) => ({
        ...decision,
        studentName:
          nameOf(
            enrollments.find((item) => refId(item.studentId) === decision.studentId) ??
              enrollments[0]
          ) || decision.studentId,
      }))
    );
  }, [enrollments, mode, sourceClassId, targetClassId]);

  function toggleStudent(enrollment: StudentEnrollment, checked: boolean) {
    const studentId = refId(enrollment.studentId);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
    setDecisions((current) => {
      if (!checked) return current.filter((decision) => decision.studentId !== studentId);
      if (current.some((decision) => decision.studentId === studentId)) return current;
      return [
        ...current,
        {
          studentId,
          studentName: nameOf(enrollment),
          fromClassId: refId(enrollment.classId),
          toClassId: "",
          repeatClass: false,
        },
      ];
    });
  }

  function updateDecision(studentId: string, patch: Partial<DecisionDraft>) {
    setDecisions((current) =>
      current.map((decision) =>
        decision.studentId === studentId ? { ...decision, ...patch } : decision
      )
    );
  }

  function goToReview() {
    const ready = decisions.filter(
      (decision) => decision.studentId && decision.fromClassId && decision.toClassId
    );
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
        decisions: decisions.map(({ studentName: _name, ...decision }) => decision),
      });
      toast.success("Promotion run created and validated");
      onCreated();
    } catch (err) {
      logger.error("transit", "promotion run create failed", err);
      toast.error(getErrorMessage(err, "Couldn't create the promotion run"));
    }
  }

  const canContinueSetup = Boolean(
    fromAcademicYearId && toAcademicYearId && fromAcademicYearId !== toAcademicYearId
  );
  const stepLabels = ["Setup", mode === "individual" ? "Students" : "Bulk Class", "Review", "Submit"];

  const footer = (
    <div className="flex w-full justify-between">
      <SecondaryButton
        onClick={() => (step === 1 ? onClose() : setStep((step - 1) as Step))}
        disabled={createRun.isPending}
      >
        {step === 1 ? "Cancel" : "Back"}
      </SecondaryButton>
      {step < 4 ? (
        <PrimaryButton
          onClick={() => (step === 2 ? goToReview() : setStep((step + 1) as Step))}
          disabled={(step === 1 && !canContinueSetup) || (step === 2 && !decisions.length)}
        >
          {step === 3 ? "Continue to Submit" : "Next"}
        </PrimaryButton>
      ) : (
        <PrimaryButton onClick={submit} disabled={createRun.isPending || !decisions.length}>
          {createRun.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Run
        </PrimaryButton>
      )}
    </div>
  );

  return (
    <TransitModal title="Create Promotion Run" onClose={onClose} footer={footer} width="max-w-5xl">
      <div className="mb-5 flex flex-wrap gap-2">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              step === index + 1
                ? "border-[#003366] bg-[#003366] text-white dark:border-sky-600 dark:bg-sky-600"
                : cn("border-gray-200 dark:border-slate-700", text.muted)
            )}
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="From Academic Year"
            required
            value={fromAcademicYearId}
            onChange={setFromAcademicYearId}
          >
            <option value="">Select source year</option>
            {academicYears.map((year) => (
              <option key={year._id} value={year._id}>
                {getAcademicYearLabel(year)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="To Academic Year"
            required
            value={toAcademicYearId}
            onChange={setToAcademicYearId}
          >
            <option value="">Select target year</option>
            {academicYears
              .filter((year) => year._id !== fromAcademicYearId)
              .map((year) => (
                <option key={year._id} value={year._id}>
                  {getAcademicYearLabel(year)}
                </option>
              ))}
          </SelectField>
          <SelectField
            label="Target Term (optional)"
            value={targetTermId}
            onChange={setTargetTermId}
            disabled={!toAcademicYearId}
          >
            <option value="">
              {toAcademicYearId ? "No specific term" : "Pick a target year first"}
            </option>
            {terms
              .filter((term) => term.academicYearId === toAcademicYearId)
              .map((term) => (
                <option key={term._id} value={term._id}>
                  {term.name}
                </option>
              ))}
          </SelectField>
          <div>
            <span className={cn("mb-1.5 block text-xs font-semibold uppercase", text.muted)}>
              Mode
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { label: "Individual Students", value: "individual" },
                  { label: "Bulk Class Promotion", value: "bulk" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setMode(item.value);
                    setDecisions([]);
                    setSelectedIds(new Set());
                  }}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                    mode === item.value
                      ? "border-[#003366] dark:border-sky-500 bg-[#003366]/5 dark:bg-sky-500/10 text-[#003366] dark:text-sky-300"
                      : cn(
                          "border-gray-200 dark:border-slate-700 hover:border-[#003366]/40 dark:hover:border-sky-500/40",
                          text.strong
                        )
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && mode === "individual" && (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-gray-100 dark:border-slate-800">
            <div
              className={cn(
                "border-b border-gray-100 dark:border-slate-800 px-4 py-3 text-sm font-semibold",
                text.strong
              )}
            >
              Active enrollments
            </div>
            <div className={cn("max-h-[430px] overflow-y-auto divide-y", surface.divide)}>
              {roster.isLoading ? (
                <div className="p-4">
                  <SkeletonRows count={3} height="h-10" />
                </div>
              ) : roster.isError ? (
                <p className="p-4 text-sm text-rose-600 dark:text-rose-400">
                  {getErrorMessage(roster.error, "Couldn't load enrollments.")}
                </p>
              ) : enrollments.length === 0 ? (
                <p className={cn("p-4 text-sm", text.muted)}>
                  No active enrollments in the source academic year.
                </p>
              ) : (
                enrollments.map((enrollment) => {
                  const studentId = refId(enrollment.studentId);
                  return (
                    <label
                      key={enrollment._id}
                      className="flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(studentId)}
                        onChange={(event) => toggleStudent(enrollment, event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className={cn("block text-sm font-medium", text.strong)}>
                          {nameOf(enrollment)}
                        </span>
                        <span className={cn("text-xs", text.muted)}>
                          {classNameById(classes, refId(enrollment.classId))}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <DecisionEditor decisions={decisions} classes={classes} onChange={updateDecision} />
        </div>
      )}

      {step === 2 && mode === "bulk" && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Source Class"
              required
              value={sourceClassId}
              onChange={(value) => {
                setSourceClassId(value);
                setDecisions([]);
              }}
            >
              <option value="">Select source class</option>
              {classes.map((option) => (
                <option key={option._id} value={option._id}>
                  {classNameById(classes, option._id)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Target Class"
              required
              value={targetClassId}
              onChange={setTargetClassId}
            >
              <option value="">Select target class</option>
              {classes.map((option) => (
                <option key={option._id} value={option._id}>
                  {classNameById(classes, option._id)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-4 py-3">
              <p className={cn("text-sm font-semibold", text.strong)}>Preview decisions</p>
              <p className={cn("text-xs", text.muted)}>
                {roster.isLoading ? "Loading students…" : `${decisions.length} students loaded`}
              </p>
            </div>
            <DecisionEditor
              decisions={decisions}
              classes={classes}
              onChange={updateDecision}
              compact
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className={cn("rounded-xl px-4 py-3", surface.inset)}>
            <p className={cn("text-sm font-semibold", text.strong)}>Review Decisions</p>
            <p className={cn("text-sm", text.muted)}>
              {decisions.length} total student decisions
            </p>
          </div>
          <DecisionEditor decisions={decisions} classes={classes} onChange={updateDecision} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className={cn("rounded-xl p-5", surface.inset)}>
            <p className={cn("text-lg font-semibold", text.strong)}>Submit promotion run</p>
            <p className={cn("mt-1 text-sm", text.muted)}>
              {decisions.length} decisions, from{" "}
              {getAcademicYearLabel(
                academicYears.find((year) => year._id === fromAcademicYearId) ?? {
                  _id: fromAcademicYearId,
                }
              )}{" "}
              to{" "}
              {getAcademicYearLabel(
                academicYears.find((year) => year._id === toAcademicYearId) ?? {
                  _id: toAcademicYearId,
                }
              )}
            </p>
          </div>
          <p className={cn("text-sm", text.body)}>
            The run is validated as it is created, and nothing moves until you commit it. Existing
            enrollment records are kept as history.
          </p>
        </div>
      )}
    </TransitModal>
  );
}
