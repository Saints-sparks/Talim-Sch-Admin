"use client";

import React, { useId, useRef, useState } from "react";
import { Lock, Paperclip, Send, X } from "lucide-react";
import { Toggle } from "@/components/tl/bits";
import { Banner } from "@/components/tl/states";
import {
  fieldError,
  fieldHint,
  focusRing,
  ghostButton,
  primaryButton,
  textareaControl,
} from "@/components/tl/styles";
import { uploadTicketAttachments, type PendingAttachment } from "@/hooks/support/useTickets";
import { getErrorMessage } from "@/lib/apiError";
import { TICKET_LIMITS, type TicketAttachment } from "@/types/tickets";
import {
  acceptAttachments,
  fileSizeLabel,
  validateMessageBody,
  type TicketViewer,
} from "./ticket.presentation";

/** What the composer hands over when it sends. */
export interface ComposerMessage {
  body: string;
  attachments: TicketAttachment[];
  /** Desk staff only. */
  internal: boolean;
}

/** Props for {@link TicketComposer}. */
export interface TicketComposerProps {
  /** Desk staff get the internal-note switch. */
  viewer: TicketViewer;
  /** Sends; resolves true when it worked (the draft is then cleared). */
  onSend: (message: ComposerMessage) => Promise<boolean>;
  /** True while the send runs. */
  busy?: boolean;
  /** Why the composer cannot be used now (closed, read-only); hides the form. */
  disabledReason?: string | null;
  /** The upload step; the app's upload route by default (tests pass a fake). */
  upload?: (
    items: PendingAttachment[],
    onUploaded?: (index: number, attachment: TicketAttachment) => void
  ) => Promise<TicketAttachment[]>;
}

/**
 * Reply to a ticket: the message, files (uploaded with the app's upload
 * route, at most 5 of 25 MB each), and for desk staff an "Internal note"
 * switch that turns the composer amber and sends a note the requester never
 * sees. A failed send keeps the draft and the files already uploaded.
 *
 * @param props - See {@link TicketComposerProps}.
 * @param props.viewer - Desk staff or the requester.
 * @param props.onSend - Sends the message.
 * @param props.busy - Whether a send runs.
 * @param props.disabledReason - Why it cannot be used.
 * @param props.upload - The upload step.
 * @returns The composer, or a note saying why it is unavailable.
 */
export function TicketComposer({
  viewer,
  onSend,
  busy = false,
  disabledReason,
  upload = uploadTicketAttachments,
}: TicketComposerProps) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [files, setFiles] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (disabledReason) {
    return (
      <Banner tone="muted" title="Replies are closed">
        {disabledReason}
      </Banner>
    );
  }

  const working = busy || uploading;
  const isNote = viewer === "desk" && internal;

  /**
   * Adds chosen files, within the limits.
   *
   * @param list - The files from the picker.
   */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const { accepted, problem } = acceptAttachments(Array.from(list), files.length);
    setFileProblem(problem);
    setFiles((current) => [...current, ...accepted.map((file) => ({ file }))]);
    if (fileInput.current) fileInput.current.value = "";
  };

  /**
   * Checks the message, uploads the files, then sends.
   *
   * @param event - The form's submit event.
   */
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validateMessageBody(body);
    setError(problem);
    if (problem) return;
    let attachments: TicketAttachment[] = [];
    if (files.length) {
      setUploading(true);
      try {
        attachments = await upload(files, (index, attachment) =>
          setFiles((current) =>
            current.map((item, i) => (i === index ? { ...item, uploaded: attachment } : item))
          )
        );
      } catch (err) {
        setError(getErrorMessage(err, "A file couldn't be uploaded. Try again."));
        return;
      } finally {
        setUploading(false);
      }
    }
    const sent = await onSend({ body: body.trim(), attachments, internal: isNote });
    if (sent) {
      setBody("");
      setFiles([]);
      setInternal(false);
      setError(null);
      setFileProblem(null);
    }
  };

  const textId = `${id}-message`;
  const describedBy = [error ? `${id}-error` : "", `${id}-hint`].filter(Boolean).join(" ");

  return (
    <form
      onSubmit={(event) => void submit(event)}
      aria-label={isNote ? "Add an internal note" : "Reply"}
      className={`flex flex-col gap-3 rounded-[18px] border p-4 transition-colors ${
        isNote
          ? "border-dashed border-tl-warning/50 bg-tl-warning-bg"
          : "border-tl-line bg-tl-subtle"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={textId} className="text-[13px] font-bold text-tl-muted">
          {isNote ? "Internal note" : viewer === "desk" ? "Reply to the requester" : "Your reply"}
        </label>
        {viewer === "desk" ? (
          <div className="flex items-center gap-2">
            <span
              id={`${id}-internal`}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-tl-body"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Internal note
            </span>
            <Toggle
              checked={internal}
              onChange={setInternal}
              label="Internal note"
              describedBy={`${id}-internal-hint`}
              disabled={working}
            />
            <span id={`${id}-internal-hint`} className="sr-only">
              Internal notes are seen only by support desk staff, never by the requester.
            </span>
          </div>
        ) : null}
      </div>

      <textarea
        id={textId}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        maxLength={TICKET_LIMITS.bodyMax}
        disabled={working}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        placeholder={isNote ? "Only desk staff will see this…" : "Write your reply…"}
        className={textareaControl}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className={fieldError}>
          {error}
        </p>
      ) : null}
      <p id={`${id}-hint`} className={fieldHint}>
        {isNote
          ? "The requester won't see this note or be notified."
          : viewer === "desk"
            ? "The requester is notified of your reply."
            : "The team is notified of your reply."}
      </p>

      {files.length > 0 ? (
        <ul aria-label="Files to attach" className="flex flex-wrap gap-2">
          {files.map((item, index) => (
            <li
              key={`${item.file.name}-${index}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-tl-line bg-tl-surface pl-3 text-[13px] font-bold text-tl-body"
            >
              <Paperclip className="h-4 w-4 text-tl-muted" aria-hidden />
              <span className="max-w-[200px] truncate">{item.file.name}</span>
              <span className="text-tl-muted">
                {item.uploaded ? "Uploaded" : fileSizeLabel(item.file.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${item.file.name}`}
                disabled={working}
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-tl-faint hover:text-tl-danger ${focusRing}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {fileProblem ? <p className={fieldError}>{fileProblem}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <input
            ref={fileInput}
            id={`${id}-files`}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => addFiles(event.target.files)}
          />
          <button
            type="button"
            className={ghostButton}
            disabled={working || files.length >= TICKET_LIMITS.attachmentsPerMessage}
            onClick={() => fileInput.current?.click()}
          >
            <Paperclip className="h-4 w-4" aria-hidden />
            Attach files
          </button>
        </div>
        <button type="submit" className={primaryButton} disabled={working}>
          {isNote ? (
            <Lock className="h-4 w-4" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          {uploading
            ? "Uploading…"
            : busy
              ? "Sending…"
              : isNote
                ? "Add internal note"
                : "Send reply"}
        </button>
      </div>
    </form>
  );
}
