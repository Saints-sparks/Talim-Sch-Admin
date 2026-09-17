"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  canCommit,
  getValidationSummary,
  promotionErrors,
  promotionWarnings,
  refLabel,
  type PromotionRun,
} from "@/app/services/transit.service";
import { PrimaryButton, SecondaryButton, surface, text, TransitModal } from "@/components/transit/ui";
import { IssueList, SummaryTile } from "@/components/transit/promotions/promotionUi";

/** What the API found when it validated a run, and the way on to the commit. */
export function ValidationResultModal({
  run,
  pending,
  onClose,
  onCommit,
}: {
  run: PromotionRun;
  pending: boolean;
  onClose: () => void;
  onCommit: (run: PromotionRun) => void;
}) {
  const summary = getValidationSummary(run);

  return (
    <TransitModal
      title="Validation Result"
      onClose={onClose}
      footer={
        <>
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          <PrimaryButton tone="green" onClick={() => onCommit(run)} disabled={pending || !canCommit(run)}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue to Commit
          </PrimaryButton>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="Eligible" value={summary.eligibleCount} tone="green" />
        <SummaryTile label="Errors" value={summary.errorsCount} tone="red" />
        <SummaryTile label="Warnings" value={summary.warningsCount} tone="amber" />
      </div>
      <IssueList
        title="Validation errors"
        issues={promotionErrors(run)}
        tone="red"
        empty="No blocking validation errors."
      />
      <IssueList
        title="Validation warnings"
        issues={promotionWarnings(run)}
        tone="amber"
        empty="No warnings reported."
      />
    </TransitModal>
  );
}

/** The last check before a run rewrites classes and enrollments. */
export function CommitConfirmModal({
  run,
  pending,
  onClose,
  onConfirm,
}: {
  run: PromotionRun;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const warnings = promotionWarnings(run);

  return (
    <TransitModal
      title="Commit Promotion Run"
      onClose={onClose}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={pending}>
            Back
          </SecondaryButton>
          <PrimaryButton tone="green" onClick={onConfirm} disabled={pending || !canCommit(run)}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Commit
          </PrimaryButton>
        </>
      }
    >
      <div className={cn("space-y-3 rounded-xl p-4 text-sm", surface.inset)}>
        <p className={text.body}>
          <span className={cn("font-semibold", text.strong)}>{run.decisions.length}</span> students
        </p>
        <p className={text.body}>
          {refLabel(run.fromAcademicYearId, "source year")} to{" "}
          {refLabel(run.toAcademicYearId, "target year")}
        </p>
        <p className={text.body}>{warnings.length} warning(s)</p>
      </div>
      <p className={cn("mt-4 text-sm", text.muted)}>
        Committing moves every student into their target class and opens a new enrollment for each.
        Their current enrollments are kept as history. This cannot be undone.
      </p>
    </TransitModal>
  );
}

/** Confirms cancelling a draft or validated run. */
export function CancelRunModal({
  run,
  pending,
  onClose,
  onConfirm,
}: {
  run: PromotionRun;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <TransitModal
      title="Cancel Promotion Run"
      onClose={onClose}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={pending}>
            Keep Run
          </SecondaryButton>
          <PrimaryButton
            tone="rose"
            onClick={onConfirm}
            disabled={pending || run.status === "committed"}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Cancel Run
          </PrimaryButton>
        </>
      }
    >
      <p className={cn("text-sm", text.body)}>
        This cancels the run covering{" "}
        <span className={cn("font-semibold", text.strong)}>{run.decisions.length}</span> students.
        Nothing has moved yet, and committed runs cannot be cancelled.
      </p>
    </TransitModal>
  );
}
