"use client";

import React from "react";
import { FileText, Lock } from "lucide-react";
import { Avatar } from "@/components/tl/bits";
import { EmptyNote } from "@/components/tl/states";
import { focusRing } from "@/components/tl/styles";
import type { TicketAttachment, TicketMessage } from "@/types/tickets";
import {
  fileSizeLabel,
  formatTicketDate,
  isSafeAttachmentUrl,
  roleLabel,
  visibleMessages,
  type TicketViewer,
} from "./ticket.presentation";

/**
 * A message's attachments as links (https only; anything else is listed
 * without a link).
 *
 * @param props - The attachments.
 * @param props.attachments - The files.
 * @returns The list, or null when there are none.
 */
function Attachments({ attachments }: { attachments: readonly TicketAttachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Attachments">
      {attachments.map((file, index) => {
        const size = fileSizeLabel(file.size);
        const label = (
          <>
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="max-w-[220px] truncate">{file.name || "Attachment"}</span>
            {size ? <span className="text-tl-muted">{size}</span> : null}
          </>
        );
        return (
          <li key={`${file.url}-${index}`}>
            {isSafeAttachmentUrl(file) ? (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-tl-line bg-tl-surface px-3 text-[13px] font-bold text-tl-link hover:bg-tl-bg ${focusRing}`}
              >
                {label}
              </a>
            ) : (
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-tl-line px-3 text-[13px] font-bold text-tl-muted">
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Props for {@link TicketThread}. */
export interface TicketThreadProps {
  /** The ticket's messages, oldest first. */
  messages: readonly TicketMessage[];
  /** The requester's user id, to tell their messages from staff ones. */
  requesterId: string;
  /** Desk staff see internal notes (marked); the requester never does. */
  viewer: TicketViewer;
}

/**
 * A ticket's conversation, oldest first. The requester's messages sit on
 * white, staff replies on pale blue, and internal notes (desk staff only) on
 * an amber, dashed card labelled "Internal note" with a lock, so they can
 * never be mistaken for a reply. For the requester, internal notes are
 * dropped even if the payload had one.
 *
 * @param props - See {@link TicketThreadProps}.
 * @param props.messages - The messages.
 * @param props.requesterId - The requester's id.
 * @param props.viewer - Who is reading.
 * @returns The thread.
 */
export function TicketThread({ messages, requesterId, viewer }: TicketThreadProps) {
  const shown = visibleMessages(messages, viewer);
  if (shown.length === 0) {
    return <EmptyNote title="No messages yet" compact />;
  }
  return (
    <ol aria-label="Conversation" className="flex flex-col gap-3.5">
      {shown.map((message) => {
        const fromRequester = message.author.id === requesterId;
        const frame = message.internal
          ? "border-dashed border-tl-warning/50 bg-tl-warning-bg"
          : fromRequester
            ? "border-tl-line bg-tl-surface"
            : "border-tl-control bg-tl-select";
        return (
          <li
            key={message.id}
            data-internal={message.internal ? "true" : undefined}
            className={`rounded-[18px] border px-4 py-3.5 ${frame}`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <Avatar id={message.author.id} name={message.author.name || "?"} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-extrabold text-tl-ink">
                    {message.author.name || "Someone"}
                  </span>
                  <span className="text-xs font-semibold text-tl-muted">
                    {roleLabel(message.author.role)}
                  </span>
                  {message.internal ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-tl-surface px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.05em] text-tl-warning">
                      <Lock className="h-3 w-3" aria-hidden />
                      Internal note
                    </span>
                  ) : null}
                </div>
                <time dateTime={message.createdAt} className="text-xs text-tl-muted">
                  {formatTicketDate(message.createdAt)}
                </time>
              </div>
            </div>
            {message.internal ? (
              <p className="sr-only">Only support desk staff can see this note.</p>
            ) : null}
            <p className="mt-2.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-tl-body">
              {message.body}
            </p>
            <Attachments attachments={message.attachments ?? []} />
          </li>
        );
      })}
    </ol>
  );
}
