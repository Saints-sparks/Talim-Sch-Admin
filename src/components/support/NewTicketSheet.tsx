"use client";

import React, { useId, useState } from "react";
import { Sheet } from "@/components/tl/Sheet";
import { Field, describedByFor } from "@/components/tl/bits";
import { Banner } from "@/components/tl/states";
import { fieldControl, ghostButton, primaryButton, textareaControl } from "@/components/tl/styles";
import { getErrorMessage } from "@/lib/apiError";
import {
  TICKET_LIMITS,
  type Ticket,
  type TicketArea,
  type TicketAttachment,
} from "@/types/tickets";
import { uploadTicketAttachments, type PendingAttachment } from "@/hooks/support/useTickets";
import {
  TICKET_AREAS,
  acceptAttachments,
  fileSizeLabel,
  validateMessageBody,
  validateSubject,
} from "./ticket.presentation";

/** What the form sends (the desk is always Talim from School Admin). */
export interface NewTicketValues {
  area: TicketArea;
  subject: string;
  body: string;
  attachments: TicketAttachment[];
}

/** Props for {@link NewTicketSheet}. */
export interface NewTicketSheetProps {
  /** Whether it is shown. */
  open: boolean;
  /** Closes it. */
  onClose: () => void;
  /** Raises the ticket; resolves with it, or null when it failed (the message is shown by the caller's error). */
  onCreate: (values: NewTicketValues) => Promise<Ticket | null>;
  /** True while it is being raised. */
  busy: boolean;
  /** The last failure's message. */
  error?: string | null;
  /** The upload step; the app's upload route by default. */
  upload?: (items: PendingAttachment[]) => Promise<TicketAttachment[]>;
}

/** Field messages, when the form is checked. */
interface Problems {
  area?: string;
  subject?: string;
  body?: string;
}

/**
 * "New ticket to Talim support": what it's about, a subject, the message and
 * files. Checked before sending (subject 3 to 140 characters, message up to
 * 5000, at most 5 files of 25 MB).
 *
 * @param props - See {@link NewTicketSheetProps}.
 * @param props.open - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onCreate - Raises the ticket.
 * @param props.busy - Whether it runs.
 * @param props.error - The last failure.
 * @param props.upload - The upload step.
 * @returns The sheet.
 */
export function NewTicketSheet({
  open,
  onClose,
  onCreate,
  busy,
  error,
  upload = uploadTicketAttachments,
}: NewTicketSheetProps) {
  const id = useId();
  const [area, setArea] = useState<TicketArea | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<Problems>({});
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Checks the form, uploads the files and raises the ticket.
   *
   * @param event - The form's submit event.
   */
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Problems = {
      area: area ? undefined : "Choose what it's about.",
      subject: validateSubject(subject) ?? undefined,
      body: validateMessageBody(body) ?? undefined,
    };
    setProblems(next);
    if (next.area || next.subject || next.body) return;
    let attachments: TicketAttachment[] = [];
    if (files.length) {
      setUploading(true);
      try {
        attachments = await upload(files.map((file) => ({ file })));
      } catch (err) {
        setFileProblem(getErrorMessage(err, "A file couldn't be uploaded. Try again."));
        return;
      } finally {
        setUploading(false);
      }
    }
    const created = await onCreate({
      area: area as TicketArea,
      subject: subject.trim(),
      body: body.trim(),
      attachments,
    });
    if (created) {
      setArea("");
      setSubject("");
      setBody("");
      setFiles([]);
      setProblems({});
    }
  };

  const working = busy || uploading;
  const areaId = `${id}-area`;
  const subjectId = `${id}-subject`;
  const bodyId = `${id}-body`;
  const filesId = `${id}-files`;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={!working}
      size="lg"
      eyebrowText="Talim support"
      title="New ticket"
      subtitle="Tell the Talim team what's wrong. You'll get a reference, and replies arrive here and as notifications."
    >
      <form
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-[18px]"
        noValidate
      >
        {error ? (
          <Banner tone="danger" role="alert">
            {error}
          </Banner>
        ) : null}
        <Field id={areaId} label="What is it about?" error={problems.area} required>
          <select
            id={areaId}
            value={area}
            onChange={(e) => setArea(e.target.value as TicketArea | "")}
            aria-invalid={problems.area ? true : undefined}
            aria-describedby={describedByFor(areaId, undefined, problems.area)}
            className={fieldControl}
            data-autofocus
          >
            <option value="">Choose an area</option>
            {TICKET_AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id={subjectId}
          label="Subject"
          hint={`${TICKET_LIMITS.subjectMin} to ${TICKET_LIMITS.subjectMax} characters`}
          error={problems.subject}
          required
        >
          <input
            id={subjectId}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={TICKET_LIMITS.subjectMax}
            aria-invalid={problems.subject ? true : undefined}
            aria-describedby={describedByFor(subjectId, "hint", problems.subject)}
            className={fieldControl}
          />
        </Field>
        <Field
          id={bodyId}
          label="Message"
          hint="What happened, where, and what you expected."
          error={problems.body}
          required
        >
          <textarea
            id={bodyId}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={TICKET_LIMITS.bodyMax}
            aria-invalid={problems.body ? true : undefined}
            aria-describedby={describedByFor(bodyId, "hint", problems.body)}
            className={textareaControl}
          />
        </Field>
        <Field
          id={filesId}
          label="Files (optional)"
          hint="Up to 5 files, 25 MB each. Screenshots help."
          error={fileProblem}
        >
          <input
            id={filesId}
            type="file"
            multiple
            onChange={(e) => {
              const { accepted, problem } = acceptAttachments(Array.from(e.target.files ?? []), 0);
              setFiles(accepted);
              setFileProblem(problem);
            }}
            aria-describedby={describedByFor(filesId, "hint", fileProblem)}
            className="min-h-[44px] text-sm text-tl-body file:mr-3 file:min-h-[40px] file:rounded-xl file:border file:border-tl-control file:bg-tl-surface file:px-3 file:font-bold file:text-tl-brand"
          />
        </Field>
        {files.length ? (
          <ul aria-label="Files to attach" className="flex flex-col gap-1 text-sm text-tl-body">
            {files.map((file) => (
              <li key={file.name}>
                {file.name} <span className="text-tl-muted">{fileSizeLabel(file.size)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={`${ghostButton} min-h-[48px] flex-1`}
            onClick={onClose}
            disabled={working}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${primaryButton} min-h-[48px] flex-1`}
            disabled={working}
          >
            {uploading ? "Uploading…" : busy ? "Sending…" : "Send to Talim support"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
