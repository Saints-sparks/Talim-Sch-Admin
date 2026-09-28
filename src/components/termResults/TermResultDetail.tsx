"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CornerUpLeft, Send } from "lucide-react";
import { OutlineBtn, PrimaryBtn } from "@/components/settings/ui";
import {
  useBroadsheet,
  useTermRemarks,
  useTermResultActions,
} from "@/hooks/termResults/useTermResults";
import type { TermResultSubmission } from "@/types/gradingContract";
import { BroadsheetTable } from "./BroadsheetTable";
import { PrincipalRemarksPanel } from "./PrincipalRemarksPanel";
import { PublishDialog, ReturnDialog } from "./ResultDialogs";
import { TermResultStatusBadge } from "./TermResultStatusBadge";
import {
  awaitsOffice,
  basisLabel,
  changedPrincipalRemarks,
  formatWhen,
  principalRemarksEditable,
  submitterName,
  type RemarkEdits,
} from "./termResults.model";

interface TermResultDetailProps {
  submission: TermResultSubmission;
  /** True when the viewer may publish, return and write principal remarks (`manage:assessments`). */
  canManage: boolean;
  /** Back to the queue; also called once the submission is published or returned. */
  onBack: () => void;
}

/**
 * One submission: who sent it and when, the class broadsheet, the remarks,
 * and — while it waits on the office — Return and Publish. Publishing asks
 * first (students and parents are notified); returning needs a reason.
 * Unsaved principal remarks block publishing, so none are lost.
 */
export function TermResultDetail({ submission, canManage, onBack }: TermResultDetailProps) {
  const broadsheet = useBroadsheet(submission);
  const remarks = useTermRemarks(submission);
  const actions = useTermResultActions(submission);

  const [edits, setEdits] = useState<RemarkEdits>({});
  const [dialog, setDialog] = useState<"publish" | "return" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  /** The button that opened the dialog, which gets focus back when it closes. */
  const opener = useRef<HTMLElement | null>(null);

  // Moving from the queue to a submission is a page change for a screen reader.
  useEffect(() => heading.current?.focus(), []);

  const changes = changedPrincipalRemarks(remarks.data ?? [], edits);
  const office = canManage && awaitsOffice(submission);
  const notReady = broadsheet.data ? !broadsheet.data.ready : false;
  const publishBlocker =
    changes.length > 0
      ? "Save or discard the principal's remarks before publishing."
      : notReady
        ? "A subject is no longer published. Return the results, or wait until its teacher publishes again."
        : null;

  const openDialog = (which: "publish" | "return") => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog(which);
  };

  const closeDialog = () => {
    setDialog(null);
    opener.current?.focus();
  };

  const publish = async () => {
    try {
      await actions.publish();
      setDialog(null);
      onBack();
    } catch {
      // Toasted by the hook; the dialog stays for a retry or a cancel.
    }
  };

  const giveBack = async (reason: string) => {
    try {
      await actions.returnToTeacher(reason);
      setDialog(null);
      onBack();
    } catch {
      // Toasted by the hook; the dialog keeps the reason.
    }
  };

  const saveRemarks = async () => {
    try {
      await actions.saveRemarks(changes);
      setEdits({});
    } catch {
      // Toasted by the hook; the edits stay.
    }
  };

  return (
    <div className="space-y-5">
      <div data-print-hide>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#003366] dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to the queue
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4" data-print-hide>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-xl font-bold text-gray-900 dark:text-slate-100 focus:outline-none"
            >
              {submission.class.name} · {submission.term.name}
            </h2>
            <TermResultStatusBadge status={submission.status} />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            {basisLabel(submission.basis)} · submitted by {submitterName(submission.submittedBy)} on{" "}
            {formatWhen(submission.submittedAt)} · {submission.studentCount}{" "}
            {submission.studentCount === 1 ? "student" : "students"}
          </p>
          {submission.status === "returned" && (
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
              Returned{" "}
              {submission.returnedAt
                ? `on ${formatWhen(submission.returnedAt)}`
                : "to the class teacher"}
              {submission.returnReason ? `: ${submission.returnReason}` : "."}
            </p>
          )}
          {submission.status === "published" && (
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
              Published{submission.publishedAt ? ` on ${formatWhen(submission.publishedAt)}` : ""}.
              Students and parents can see these results.
            </p>
          )}
        </div>

        {office && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <OutlineBtn
                onClick={() => openDialog("return")}
                disabled={actions.publishing || actions.returning}
              >
                <CornerUpLeft className="w-4 h-4" aria-hidden />
                Return to class teacher
              </OutlineBtn>
              <PrimaryBtn
                onClick={() => openDialog("publish")}
                disabled={Boolean(publishBlocker) || actions.returning}
                aria-describedby={publishBlocker ? "publish-blocker" : undefined}
              >
                <Send className="w-4 h-4" aria-hidden />
                Publish results
              </PrimaryBtn>
            </div>
            {publishBlocker && (
              <p
                id="publish-blocker"
                className="max-w-xs text-right text-xs text-amber-700 dark:text-amber-300"
              >
                {publishBlocker}
              </p>
            )}
          </div>
        )}
      </div>

      <BroadsheetTable submission={submission} query={broadsheet} />

      <div data-print-hide>
        <PrincipalRemarksPanel
          query={remarks}
          edits={edits}
          changedCount={changes.length}
          editable={canManage && principalRemarksEditable(submission)}
          saving={actions.savingRemarks}
          onEdit={(studentId, text) => setEdits((prev) => ({ ...prev, [studentId]: text }))}
          onSave={() => void saveRemarks()}
          onDiscard={() => setEdits({})}
        />
      </div>

      {dialog === "publish" && (
        <PublishDialog
          submission={submission}
          pending={actions.publishing}
          onConfirm={() => void publish()}
          onCancel={closeDialog}
        />
      )}
      {dialog === "return" && (
        <ReturnDialog
          submission={submission}
          pending={actions.returning}
          onConfirm={(reason) => void giveBack(reason)}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}
