"use client";

import React, { useRef, useState } from "react";
import { BellRing } from "lucide-react";
import { ModalShell, OutlineBtn, PrimaryBtn } from "@/components/settings/ui";
import {
  FieldError,
  FieldLabel,
  controlClasses,
  describedBy,
} from "@/components/settings/schoolDay/fields";
import { RETURN_REASON_MAX_LENGTH, type TermResultSubmission } from "@/types/gradingContract";
import { basisLabel, validateReturnReason } from "./termResults.model";

/** Does nothing: a dialog cannot be dismissed while its action runs. */
const stay = () => undefined;

interface PublishDialogProps {
  submission: TermResultSubmission;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before publishing: publishing notifies every student and parent of
 * the class, and there is no unpublish. Cancel has focus, so Enter does not
 * publish by accident.
 */
export function PublishDialog({ submission, pending, onConfirm, onCancel }: PublishDialogProps) {
  return (
    <ModalShell title="Publish results?" onClose={pending ? stay : onCancel}>
      <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
        <p>
          Publish the results for{" "}
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            {submission.class.name}
          </span>
          , {submission.term.name} ({basisLabel(submission.basis)})?
        </p>
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-200">
          <BellRing className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            {submission.studentCount} {submission.studentCount === 1 ? "student" : "students"} and
            their parents will be notified and can see the results straight away. Published results
            can&apos;t be taken back from here.
          </span>
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <OutlineBtn onClick={onCancel} disabled={pending} autoFocus>
          Cancel
        </OutlineBtn>
        <PrimaryBtn onClick={onConfirm} loading={pending}>
          Publish and notify
        </PrimaryBtn>
      </div>
    </ModalShell>
  );
}

interface ReturnDialogProps {
  submission: TermResultSubmission;
  pending: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/**
 * Sends results back to the class teacher. A reason is required: it is what
 * the teacher is notified with.
 */
export function ReturnDialog({ submission, pending, onConfirm, onCancel }: ReturnDialogProps) {
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const error = tried ? validateReturnReason(reason) : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (validateReturnReason(reason)) {
      field.current?.focus();
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <ModalShell title="Return to class teacher" onClose={pending ? stay : onCancel}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          Send the {submission.class.name} results back so the class teacher can correct them and
          submit again.
        </p>
        <div>
          <FieldLabel htmlFor="return-reason" required>
            Reason
          </FieldLabel>
          <textarea
            ref={field}
            id="return-reason"
            rows={4}
            value={reason}
            maxLength={RETURN_REASON_MAX_LENGTH}
            autoFocus
            aria-required
            disabled={pending}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Ada's Mathematics remark is missing"
            className={`${controlClasses(Boolean(error))} resize-y`}
            {...describedBy("return-reason", error, "return-reason-hint")}
          />
          <p id="return-reason-hint" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            The class teacher is notified with this reason.
          </p>
          <FieldError controlId="return-reason" message={error} />
        </div>
        <div className="flex justify-end gap-3">
          <OutlineBtn onClick={onCancel} disabled={pending}>
            Cancel
          </OutlineBtn>
          <PrimaryBtn type="submit" loading={pending}>
            Return results
          </PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}
