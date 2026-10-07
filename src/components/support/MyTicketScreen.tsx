"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, XCircle } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Page } from "@/components/tl/Page";
import { ConfirmSheet } from "@/components/tl/ConfirmSheet";
import { Banner, PageSkeleton, ScreenError } from "@/components/tl/states";
import { card, cardTitle, eyebrow, ghostButton, pageTitle, textLink } from "@/components/tl/styles";
import { useTicket, useTicketActions } from "@/hooks/support/useTickets";
import { getErrorMessage } from "@/lib/apiError";
import type { Ticket } from "@/types/tickets";
import { TicketComposer, type ComposerMessage } from "./TicketComposer";
import { TicketStatusPill } from "./TicketPills";
import { TicketThread } from "./TicketThread";
import {
  HELP_HREF,
  areaLabel,
  canReopen,
  formatTicketDate,
  ticketErrorMessage,
} from "./ticket.presentation";

/**
 * Why the requester can't reply, or null when they can. A resolved ticket
 * can still take a reply (which reopens it within 7 days).
 *
 * @param ticket - The ticket.
 * @returns The reason.
 */
export function requesterReplyBlocked(ticket: Pick<Ticket, "status">): string | null {
  return ticket.status === "closed"
    ? "This ticket is closed. Raise a new ticket if you still need help."
    : null;
}

/** Props for {@link MyTicketScreen}. */
export interface MyTicketScreenProps {
  /** The ticket id from the route. */
  ticketId: string;
}

/**
 * One of the admin's own tickets to Talim: the conversation (internal notes
 * never shown), a reply composer with files, "Reopen" while a resolved ticket
 * is inside its 7 days, and "Close ticket". A 409 says why in a banner and
 * reloads the ticket.
 *
 * @param props - See {@link MyTicketScreenProps}.
 * @param props.ticketId - The ticket id.
 * @returns The screen.
 */
export function MyTicketScreen({ ticketId }: MyTicketScreenProps) {
  const ticket = useTicket(ticketId);
  const actions = useTicketActions(ticketId);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  if (ticket.isPending) return <PageSkeleton label="Loading your ticket" blocks={[140, 360]} />;
  if (ticket.isError && !ticket.data) {
    return (
      <Page>
        <Link href={HELP_HREF} className={textLink}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Help & support
        </Link>
        <ScreenError
          title="We couldn't open this ticket"
          message={getErrorMessage(ticket.error, "Check your connection and try again.")}
          onRetry={() => void ticket.refetch()}
          retrying={ticket.isFetching}
        />
      </Page>
    );
  }

  const t = ticket.data;

  /**
   * Runs a write and reports a failure in the banner.
   *
   * @param run - The write.
   * @param done - What to say when it worked.
   * @returns True when it worked.
   */
  const attempt = async (run: () => Promise<unknown>, done: string): Promise<boolean> => {
    setProblem(null);
    try {
      await run();
      toast.success(done);
      return true;
    } catch (error) {
      setProblem(ticketErrorMessage(error));
      return false;
    }
  };

  /**
   * Sends a reply.
   *
   * @param message - The composer's message.
   * @returns True when it was sent.
   */
  const send = (message: ComposerMessage) =>
    attempt(
      () => actions.reply.mutateAsync({ body: message.body, attachments: message.attachments }),
      "Reply sent"
    );

  return (
    <Page guide="help-ticket">
      <Link href={HELP_HREF} className={textLink}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Help & support
      </Link>

      <header className={card}>
        <p className={eyebrow}>
          <span className="font-mono">{t.reference}</span> · {areaLabel(t.area)} · Talim support
        </p>
        <h1 className={`${pageTitle} mt-1.5 break-words`}>{t.subject}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <TicketStatusPill status={t.status} viewer="requester" />
          <span className="text-sm text-tl-muted">Raised {formatTicketDate(t.createdAt)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {canReopen(t) ? (
            <button
              type="button"
              className={ghostButton}
              disabled={actions.reopen.isPending}
              onClick={() => void attempt(() => actions.reopen.mutateAsync(), "Ticket reopened")}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {actions.reopen.isPending ? "Reopening…" : "Reopen ticket"}
            </button>
          ) : null}
          {t.status !== "closed" ? (
            <button type="button" className={ghostButton} onClick={() => setConfirmClose(true)}>
              <XCircle className="h-4 w-4" aria-hidden />
              Close ticket
            </button>
          ) : null}
        </div>
        {t.status === "resolved" && t.reopenableUntil ? (
          <p className="mt-3 text-[13px] text-tl-muted">
            {canReopen(t)
              ? `Not fixed? Reply or reopen it until ${formatTicketDate(t.reopenableUntil)}.`
              : "The 7 days to reopen it have passed. Raise a new ticket if you still need help."}
          </p>
        ) : null}
      </header>

      {problem ? (
        <Banner tone="danger" title="That didn't go through" role="alert">
          {problem}
        </Banner>
      ) : null}

      <section className={`${card} flex flex-col gap-[18px]`} aria-labelledby="my-ticket-thread">
        <h2 id="my-ticket-thread" className={cardTitle}>
          Conversation
        </h2>
        <TicketThread messages={t.messages} requesterId={t.requester.id} viewer="requester" />
        <TicketComposer
          viewer="requester"
          onSend={send}
          busy={actions.reply.isPending}
          disabledReason={requesterReplyBlocked(t)}
        />
      </section>

      <ConfirmSheet
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={async () => {
          await attempt(() => actions.close.mutateAsync(), "Ticket closed");
          setConfirmClose(false);
        }}
        title="Close this ticket?"
        body="Close it if your problem is solved. A closed ticket can't take replies; raise a new one if you need help again."
        confirmLabel="Close ticket"
        busyLabel="Closing…"
        busy={actions.close.isPending}
      />
    </Page>
  );
}
