"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Page } from "@/components/tl/Page";
import { Avatar } from "@/components/tl/bits";
import { Banner, PageSkeleton, ScreenError } from "@/components/tl/states";
import {
  card,
  cardTitle,
  eyebrow,
  fieldLabel,
  ghostButton,
  pageTitle,
  selectControl,
  textLink,
} from "@/components/tl/styles";
import { useTicket, useTicketActions } from "@/hooks/support/useTickets";
import { useDeskAssignees } from "@/hooks/support/useDeskAssignees";
import { getErrorMessage } from "@/lib/apiError";
import type { Ticket, TicketPriority, TicketStatus, UpdateTicketBody } from "@/types/tickets";
import { EscalateSheet } from "./EscalateSheet";
import { TicketComposer, type ComposerMessage } from "./TicketComposer";
import { TicketPriorityPill, TicketStatusPill } from "./TicketPills";
import { TicketThread } from "./TicketThread";
import {
  SUPPORT_DESK_HREF,
  TICKET_PRIORITIES,
  areaLabel,
  formatTicketDate,
  roleLabel,
  staffTransitions,
  statusLabel,
  ticketErrorMessage,
  ticketHref,
} from "./ticket.presentation";

/**
 * Why the desk can't act on a ticket, or null when it can.
 *
 * @param ticket - The ticket.
 * @returns The reason.
 */
export function deskReadOnlyReason(
  ticket: Pick<Ticket, "access" | "status" | "desk">
): string | null {
  if (ticket.access !== "desk") {
    return "This ticket was escalated to Talim support. Your desk can read it, but Talim now replies and changes it.";
  }
  if (ticket.status === "closed")
    return "This ticket is closed. The requester can raise a new one if they still need help.";
  return null;
}

/**
 * One line of the ticket's history ("Raised", "First reply", …).
 *
 * @param props - The label and the date.
 * @param props.label - What happened.
 * @param props.at - When, or null when it hasn't.
 * @returns The row, or null.
 */
function HistoryRow({ label, at }: { label: string; at: string | null }) {
  if (!at) return null;
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full tl-dot-info" />
      <div>
        <div className="text-sm font-bold text-tl-ink">{label}</div>
        <time dateTime={at} className="text-xs text-tl-muted">
          {formatTicketDate(at)}
        </time>
      </div>
    </li>
  );
}

/** Props for {@link DeskTicketScreen}. */
export interface DeskTicketScreenProps {
  /** The ticket id from the route. */
  ticketId: string;
}

/**
 * One ticket at the school desk: who raised it (and for which child), its
 * area, status, priority and assignee, the conversation with internal notes
 * marked, the reply / internal-note composer, the status, priority and
 * assignee controls, "Escalate to Talim", and the history.
 *
 * A 409 (closed, escalated, capped, or changed by someone else meanwhile)
 * shows why in a banner and reloads the ticket; a reply's draft is kept.
 * Once escalated the ticket is read-only here.
 *
 * @param props - See {@link DeskTicketScreenProps}.
 * @param props.ticketId - The ticket id.
 * @returns The screen.
 */
export function DeskTicketScreen({ ticketId }: DeskTicketScreenProps) {
  const ticket = useTicket(ticketId);
  const actions = useTicketActions(ticketId);
  const [problem, setProblem] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const { options: assignees, myId } = useDeskAssignees([ticket.data?.assignee]);
  const router = useRouter();
  const isOwnTicket = ticket.data?.access === "requester";

  // The admin's own ticket (a notification can link here) belongs in Help & support.
  useEffect(() => {
    if (isOwnTicket) router.replace(ticketHref(ticketId, "requester"));
  }, [isOwnTicket, router, ticketId]);

  if (ticket.isPending || isOwnTicket)
    return <PageSkeleton label="Loading the ticket" blocks={[160, 360]} />;
  if (ticket.isError && !ticket.data) {
    return (
      <Page>
        <Link href={SUPPORT_DESK_HREF} className={textLink}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Support desk
        </Link>
        <ScreenError
          title="We couldn't open this ticket"
          message={getErrorMessage(
            ticket.error,
            "It may have been removed, or you may not have access to it."
          )}
          onRetry={() => void ticket.refetch()}
          retrying={ticket.isFetching}
        />
      </Page>
    );
  }

  const t = ticket.data;
  const readOnly = deskReadOnlyReason(t);
  const busy = actions.update.isPending || actions.reply.isPending || actions.escalate.isPending;

  /**
   * Sets status, priority or assignee.
   *
   * @param body - The change.
   * @param done - What to say when it worked.
   */
  const change = async (body: UpdateTicketBody, done: string) => {
    setProblem(null);
    try {
      await actions.update.mutateAsync(body);
      toast.success(done);
    } catch (error) {
      setProblem(ticketErrorMessage(error));
    }
  };

  /**
   * Sends a reply or an internal note.
   *
   * @param message - The composer's message.
   * @returns True when it was sent.
   */
  const send = async (message: ComposerMessage): Promise<boolean> => {
    setProblem(null);
    try {
      await actions.reply.mutateAsync({
        body: message.body,
        attachments: message.attachments,
        internal: message.internal || undefined,
      });
      toast.success(message.internal ? "Internal note added" : "Reply sent");
      return true;
    } catch (error) {
      setProblem(ticketErrorMessage(error));
      return false;
    }
  };

  /**
   * Escalates to Talim.
   *
   * @param note - Why.
   * @returns True when it worked.
   */
  const escalate = async (note: string): Promise<boolean> => {
    setProblem(null);
    try {
      await actions.escalate.mutateAsync(note);
      toast.success("Escalated to Talim support");
      return true;
    } catch (error) {
      setProblem(ticketErrorMessage(error));
      setEscalating(false);
      return false;
    }
  };

  const assigneeValue = t.assignee?.id ?? "";
  const assigneeChoices =
    t.assignee && !assignees.some((a) => a.value === t.assignee?.id)
      ? [...assignees, { value: t.assignee.id, label: t.assignee.name }]
      : assignees;

  return (
    <Page guide="support-ticket">
      <Link href={SUPPORT_DESK_HREF} className={textLink}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Support desk
      </Link>

      <header className={card}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={eyebrow}>
              <span className="font-mono">{t.reference}</span> · {areaLabel(t.area)}
            </p>
            <h1 className={`${pageTitle} mt-1.5 break-words`}>{t.subject}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TicketStatusPill status={t.status} />
              <TicketPriorityPill priority={t.priority} />
              {t.desk === "talim" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-tl-accent-bg px-2.5 py-[5px] text-xs font-extrabold text-tl-accent">
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                  With Talim support
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className={ghostButton}
            onClick={() => void ticket.refetch()}
            disabled={ticket.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${ticket.isFetching ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>
        <dl className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <div className="flex items-center gap-2.5 rounded-2xl border border-tl-line-soft bg-tl-subtle p-3">
            <Avatar id={t.requester.id} name={t.requester.name || "?"} size={36} />
            <div className="min-w-0">
              <dt className="text-xs font-bold text-tl-muted">Raised by</dt>
              <dd className="truncate text-sm font-extrabold text-tl-ink">
                {t.requester.name}{" "}
                <span className="font-semibold text-tl-muted">· {roleLabel(t.requester.role)}</span>
              </dd>
              {t.requester.email ? (
                <dd className="truncate text-xs text-tl-muted">{t.requester.email}</dd>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-tl-line-soft bg-tl-subtle p-3">
            <dt className="text-xs font-bold text-tl-muted">Child</dt>
            <dd className="text-sm font-extrabold text-tl-ink">
              {t.child?.name ?? "Not about a child"}
            </dd>
          </div>
          <div className="rounded-2xl border border-tl-line-soft bg-tl-subtle p-3">
            <dt className="text-xs font-bold text-tl-muted">Assignee</dt>
            <dd className="text-sm font-extrabold text-tl-ink">
              {t.assignee?.name ?? "Unassigned"}
            </dd>
          </div>
          <div className="rounded-2xl border border-tl-line-soft bg-tl-subtle p-3">
            <dt className="text-xs font-bold text-tl-muted">Last activity</dt>
            <dd className="text-sm font-extrabold text-tl-ink">
              {formatTicketDate(t.lastActivityAt)}
            </dd>
          </div>
        </dl>
      </header>

      {problem ? (
        <Banner
          tone="danger"
          title="That didn't go through"
          role="alert"
          action={
            <button type="button" className={ghostButton} onClick={() => setProblem(null)}>
              Dismiss
            </button>
          }
        >
          {problem}
        </Banner>
      ) : null}

      <div className="grid items-start gap-[18px] min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <section
          className={`${card} flex flex-col gap-[18px]`}
          aria-labelledby="ticket-thread-title"
        >
          <h2 id="ticket-thread-title" className={cardTitle}>
            Conversation
          </h2>
          <TicketThread messages={t.messages} requesterId={t.requester.id} viewer="desk" />
          <TicketComposer
            viewer="desk"
            onSend={send}
            busy={actions.reply.isPending}
            disabledReason={readOnly}
          />
        </section>

        <aside className="flex flex-col gap-[18px]">
          <section className={`${card} flex flex-col gap-4`} aria-labelledby="ticket-manage-title">
            <h2 id="ticket-manage-title" className={cardTitle}>
              Manage
            </h2>
            {readOnly ? <p className="text-sm text-tl-muted">{readOnly}</p> : null}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-status" className={fieldLabel}>
                Status
              </label>
              <select
                id="ticket-status"
                value={t.status}
                disabled={Boolean(readOnly) || busy}
                onChange={(e) => {
                  const status = e.target.value as TicketStatus;
                  void change({ status }, `Status set to ${statusLabel(status)}`);
                }}
                className={`${selectControl} w-full`}
              >
                {staffTransitions(t.status).map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-priority" className={fieldLabel}>
                Priority
              </label>
              <select
                id="ticket-priority"
                value={t.priority}
                disabled={Boolean(readOnly) || busy}
                onChange={(e) => {
                  const priority = e.target.value as TicketPriority;
                  void change({ priority }, "Priority updated");
                }}
                className={`${selectControl} w-full`}
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-assignee" className={fieldLabel}>
                Assignee
              </label>
              <select
                id="ticket-assignee"
                value={assigneeValue}
                disabled={Boolean(readOnly) || busy}
                onChange={(e) => {
                  const assigneeId = e.target.value || null;
                  void change(
                    { assigneeId },
                    assigneeId
                      ? assigneeId === myId
                        ? "Assigned to you"
                        : "Assignee updated"
                      : "Unassigned"
                  );
                }}
                className={`${selectControl} w-full`}
              >
                <option value="">Unassigned</option>
                {assigneeChoices.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            {t.desk === "school" && t.access === "desk" && t.status !== "closed" ? (
              <button
                type="button"
                className={ghostButton}
                onClick={() => setEscalating(true)}
                disabled={busy}
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden />
                Escalate to Talim
              </button>
            ) : null}
          </section>

          <section className={card} aria-labelledby="ticket-history-title">
            <h2 id="ticket-history-title" className={cardTitle}>
              History
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              <HistoryRow label="Raised" at={t.createdAt} />
              <HistoryRow label="First reply" at={t.firstResponseAt} />
              <HistoryRow label="Escalated to Talim" at={t.escalatedAt} />
              <HistoryRow label="Resolved" at={t.resolvedAt} />
              <HistoryRow label="Closed" at={t.closedAt} />
            </ul>
          </section>

          {t.context && (t.context.path || t.context.appVersion || t.context.userAgent) ? (
            <section className={card} aria-labelledby="ticket-context-title">
              <h2 id="ticket-context-title" className={cardTitle}>
                Where it was raised
              </h2>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                {t.context.path ? (
                  <div>
                    <dt className="text-xs font-bold text-tl-muted">Page</dt>
                    <dd className="break-words font-mono text-tl-ink">{t.context.path}</dd>
                  </div>
                ) : null}
                {t.context.appVersion ? (
                  <div>
                    <dt className="text-xs font-bold text-tl-muted">App version</dt>
                    <dd className="text-tl-ink">{t.context.appVersion}</dd>
                  </div>
                ) : null}
                {t.context.userAgent ? (
                  <div>
                    <dt className="text-xs font-bold text-tl-muted">Browser or device</dt>
                    <dd className="break-words text-xs text-tl-ink">{t.context.userAgent}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}
        </aside>
      </div>

      <EscalateSheet
        open={escalating}
        onClose={() => setEscalating(false)}
        onEscalate={escalate}
        busy={actions.escalate.isPending}
        reference={t.reference}
      />
    </Page>
  );
}
