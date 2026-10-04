"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ConfirmDialog } from "@/components/finance/ModalShell";
import { copyText } from "@/components/chat-kit/clipboard";
import { useIssueParentLinkCode } from "@/hooks/users/useStudents";
import type { ParentLinkCode } from "@/app/services/student.service";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { linkCodeExpiry } from "./parentLink";

/** Props of {@link ParentLinkCodeCard}. */
export interface ParentLinkCodeCardProps {
  /** The student record id (`POST /students/:id/link-code`). */
  studentId: string;
  /** The student's name, for the copy. */
  studentName: string;
}

/**
 * Turns a failed code request into something the admin can act on.
 *
 * @param error - Whatever the request threw.
 * @returns The message for the toast.
 */
function linkCodeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "FORBIDDEN")
      return "You need the Manage Students permission to issue link codes.";
    if (error.code === "NOT_FOUND") return "This student is not in your school any more.";
  }
  return getErrorMessage(error, "Couldn't generate a link code. Please try again.");
}

/**
 * "Generate parent link code" on the student profile (A11). A parent enters
 * the code in their Talim app to add this child to their account, even when
 * their other children are at another school. The code lasts 14 days and
 * works once; only its hash is stored, so it is shown here once, with copy and
 * regenerate. Regenerating cancels the previous unused code, so it asks first.
 *
 * The profile renders this behind `manage:students`, like its other actions.
 *
 * @param props - See {@link ParentLinkCodeCardProps}.
 * @returns The card.
 */
export function ParentLinkCodeCard({ studentId, studentName }: ParentLinkCodeCardProps) {
  const issue = useIssueParentLinkCode();
  const [current, setCurrent] = useState<ParentLinkCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingNew, setConfirmingNew] = useState(false);

  const generate = async () => {
    try {
      const next = await issue.mutateAsync(studentId);
      setCurrent(next);
      setCopied(false);
      toast.success(
        current
          ? "New code generated. The previous code no longer works."
          : "Parent link code generated."
      );
    } catch (error) {
      logger.error("students/link-code", "issue failed", error);
      toast.error(linkCodeErrorMessage(error));
    } finally {
      setConfirmingNew(false);
    }
  };

  const copy = async () => {
    if (!current) return;
    const ok = await copyText(current.code);
    if (ok) {
      setCopied(true);
      toast.success("Code copied.");
    } else {
      toast.error("Couldn't copy. Select the code and copy it by hand.");
    }
  };

  return (
    <section
      aria-labelledby="parent-link-code-heading"
      className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <KeyRound className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3
            id="parent-link-code-heading"
            className="text-base font-semibold text-gray-900 dark:text-slate-100"
          >
            Parent link code
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
            A parent enters this code in the Talim parent app to add {studentName || "this student"}{" "}
            to their account, even if their other children are at another school. It works once and
            lasts 14 days.
          </p>
        </div>
      </div>

      {current ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <output
              aria-live="polite"
              aria-label="Parent link code"
              className="font-mono text-2xl font-bold tracking-widest text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 select-all"
            >
              {current.code}
            </output>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              {copied ? (
                <Check className="w-4 h-4" aria-hidden />
              ) : (
                <Copy className="w-4 h-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy code"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingNew(true)}
              disabled={issue.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              Generate a new code
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400">
            {linkCodeExpiry(current.expiresAt)}
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-400">
            The code is shown only now. If it is lost, generate a new one.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          disabled={issue.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" aria-hidden />
          {issue.isPending ? "Generating…" : "Generate parent link code"}
        </button>
      )}

      {confirmingNew && (
        <ConfirmDialog
          title="Generate a new code?"
          message="The current code stops working as soon as the new one is made. Give the parent the new code."
          confirmLabel="Generate new code"
          busy={issue.isPending}
          onConfirm={() => void generate()}
          onCancel={() => setConfirmingNew(false)}
        />
      )}
    </section>
  );
}
