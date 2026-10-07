"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CornerUpLeft, Send } from "lucide-react";
import { OutlineBtn, PrimaryBtn } from "@/components/settings/ui";
import {
  useBroadsheet,
  useTermRemarks,
  useTermResult,
  useTermResultActions,
} from "@/hooks/termResults/useTermResults";
import { gradingConflict, type TermResultSubmission } from "@/types/gradingContract";
import { BroadsheetTable } from "./BroadsheetTable";
import { PrincipalRemarksPanel } from "./PrincipalRemarksPanel";
import { PublishDialog, ReturnDialog } from "./ResultDialogs";
import { TermResultStatusBadge } from "./TermResultStatusBadge";
import {
  awaitsOffice,
  basisLabel,
  changedPrincipalRemarks,
  formatWhen,
  notPublishedMessage,
  personName,
  remarksLocked,
  remarksLockedNote,
  type RemarkEdits,
} from "./termResults.model";

interface TermResultDetailProps {
  /** The submission as the queue listed it; refreshed from the API on open. */
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
 *
 * When the API refuses because something changed under the office (409:
 * already published or returned, a subject unlocked, remarks locked), the
 * dialog closes and the view refreshes to show where things stand.
 */
export function TermResultDetail({ submission: row, canManage, onBack }: TermResultDetailProps) {
  const submission = useTermResult(row);
  const broadsheet = useBroadsheet(submission);
  const remarks = useTermRemarks(submission);
  const actions = useTermResultActions(submission);

  const [edits, setEdits] = useState<RemarkEdits>({});
  /** Set when a save was refused because the class's results for the term are published. */
  const [lockedByApi, setLockedByApi] = useState(false);
  const locked = lockedByApi || remarksLocked(submission);
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
    changes.length > 0 && !locked
      ? "Save or discard the principal's remarks before publishing."
      : notReady
        ? notPublishedMessage(broadsheet.data?.waitingOn ?? [])
        : null;

  const openDialog = (which: "publish" | "return") => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog(which);
  };

  const closeDialog = () => {
    setDialog(null);
    opener.current?.focus();
  };

  /**
   * After a refused publish or return: a 409 with `status` or `waitingOn`
   * means retrying cannot help (the submission moved on, or a subject must be
   * published again), so the dialog closes onto the refreshed view; any other
   * failure keeps the dialog for a retry.
   */
  const afterOfficeError = (err: unknown) => {
    const conflict = gradingConflict(err);
    if (!conflict?.status && !conflict?.waitingOn) return;
    setDialog(null);
    heading.current?.focus();
  };

  const publish = async () => {
    try {
      await actions.publish();
      setDialog(null);
      onBack();
    } catch (err) {
      // Toasted by the hook.
      afterOfficeError(err);
    }
  };

  const giveBack = async (reason: string) => {
    try {
      await actions.returnToTeacher(reason);
      setDialog(null);
      onBack();
    } catch (err) {
      // Toasted by the hook; unless the 409 says a retry is pointless, the dialog keeps the reason.
      afterOfficeError(err);
    }
  };

  const saveRemarks = async () => {
    try {
      await actions.saveRemarks(changes);
      setEdits({});
    } catch (err) {
      // Toasted by the hook; the edits stay, unless the remarks are now locked.
      if (gradingConflict(err)?.code === "RESULTS_PUBLISHED") {
        setLockedByApi(true);
        setEdits({});
      }
    }
  };

  return (
    <div className="space-y-5">
      <div data-print-hide>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tl-brand hover:underline"
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
              className="text-xl font-bold text-tl-ink focus:outline-none"
            >
              {submission.class.name} · {submission.term.name}
            </h2>
            <TermResultStatusBadge status={submission.status} />
          </div>
          <p className="mt-1 text-sm text-tl-muted">
            {basisLabel(submission.basis)} · submitted by {personName(submission.submittedBy)} on{" "}
            {formatWhen(submission.submittedAt)} · {submission.studentCount}{" "}
            {submission.studentCount === 1 ? "student" : "students"}
          </p>
          {submission.status === "returned" && (
            <p className="mt-2 text-sm text-tl-danger">
              Returned{" "}
              {submission.returnedAt
                ? `on ${formatWhen(submission.returnedAt)}`
                : "to the class teacher"}
              {submission.returnedBy ? ` by ${personName(submission.returnedBy)}` : ""}
              {submission.returnReason ? `: ${submission.returnReason}` : "."}
            </p>
          )}
          {submission.status === "published" && (
            <p className="mt-2 text-sm text-tl-success">
              Published{submission.publishedAt ? ` on ${formatWhen(submission.publishedAt)}` : ""}
              {submission.publishedBy ? ` by ${personName(submission.publishedBy)}` : ""}. Students
              and parents can see these results.
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
              <p id="publish-blocker" className="max-w-xs text-right text-xs text-tl-warning">
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
          editable={canManage && !locked}
          lockedNote={locked ? remarksLockedNote(submission) : undefined}
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
