"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ModalShell, OutlineBtn, PrimaryBtn, settingsErrorMessage } from "@/components/settings/ui";
import { FieldError, FieldLabel, controlClasses, describedBy } from "@/components/settings/schoolDay/fields";
import { createSupportTicket } from "@/app/services/support.service";
import { logger } from "@/lib/logger";
import { SUPPORT_DESCRIPTION_MAX, type SupportTicketResponse } from "@/types/round4Contract";
import {
  SUPPORT_AREAS,
  toSupportTicketPayload,
  validateSupportTicket,
  type SupportTicketValues,
} from "./supportTicketForm";

/**
 * "Report a problem" (Round 4 §35): sends the area and a description to
 * Talim support (`POST /support/tickets`), with the page and browser it was
 * sent from, then shows the ticket's reference. It goes to Talim, not to the
 * school's complaints.
 *
 * @param props.onClose - Closes the dialog.
 * @returns The dialog.
 */
export function ReportProblemModal({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<SupportTicketValues>({ area: "", description: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<SupportTicketResponse | null>(null);

  const errors = submitted ? validateSupportTicket(values) : {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateSupportTicket(values)).length) return;
    setSending(true);
    try {
      const payload = toSupportTicketPayload(values, {
        path: window.location.pathname + window.location.search,
        userAgent: navigator.userAgent,
      });
      setTicket(await createSupportTicket(payload));
    } catch (err) {
      logger.error("settings/support", "ticket failed", err);
      toast.error(settingsErrorMessage(err, "We couldn't send your report. Try again, or email support@mytalim.com."));
    } finally {
      setSending(false);
    }
  };

  const copyReference = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.reference);
      toast.success("Reference copied");
    } catch {
      toast.error("Couldn't copy. Select the reference and copy it instead.");
    }
  };

  if (ticket) {
    return (
      <ModalShell title="Report sent" onClose={onClose}>
        <div className="space-y-4 text-center" role="status">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden />
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-200">
            Thanks. Talim support has your report and will reply by email.
          </p>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Your reference</p>
            <p className="mt-1 inline-flex items-center gap-2">
              <span className="font-mono text-lg font-semibold text-gray-900 dark:text-slate-100 select-all">
                {ticket.reference}
              </span>
              <button
                type="button"
                onClick={() => void copyReference()}
                aria-label="Copy reference"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <Copy className="w-4 h-4" aria-hidden />
              </button>
            </p>
          </div>
          <PrimaryBtn onClick={onClose} className="mx-auto">
            Done
          </PrimaryBtn>
        </div>
      </ModalShell>
    );
  }

  const length = values.description.trim().length;

  return (
    <ModalShell title="Report a problem" onClose={() => (sending ? undefined : onClose())}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          This goes to the Talim support team, not to your school. We&apos;ll include the page you&apos;re on and your
          browser.
        </p>

        <div>
          <FieldLabel htmlFor="support-area" required>
            What is it about?
          </FieldLabel>
          <select
            id="support-area"
            value={values.area}
            disabled={sending}
            onChange={(e) => setValues((v) => ({ ...v, area: e.target.value as SupportTicketValues["area"] }))}
            className={controlClasses(Boolean(errors.area))}
            {...describedBy("support-area", errors.area)}
          >
            <option value="">Choose an area</option>
            {SUPPORT_AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <FieldError controlId="support-area" message={errors.area} />
        </div>

        <div>
          <FieldLabel htmlFor="support-description" required>
            What happened?
          </FieldLabel>
          <textarea
            id="support-description"
            rows={5}
            value={values.description}
            maxLength={SUPPORT_DESCRIPTION_MAX}
            disabled={sending}
            placeholder="What you were doing, what you expected, and what happened instead."
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            className={controlClasses(Boolean(errors.description))}
            {...describedBy("support-description", errors.description, "support-description-count")}
          />
          <p id="support-description-count" className="mt-1 text-right text-xs text-gray-500 dark:text-slate-400">
            {length}/{SUPPORT_DESCRIPTION_MAX}
          </p>
          <FieldError controlId="support-description" message={errors.description} />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <OutlineBtn onClick={onClose} disabled={sending}>
            Cancel
          </OutlineBtn>
          <PrimaryBtn type="submit" loading={sending}>
            Send report
          </PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}
