"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LifeBuoy, Mail, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { Page, PageHeader, CardHeader } from "@/components/tl/Page";
import { Segmented, type TabOption } from "@/components/tl/Tabs";
import { EmptyNote, ScreenError, ScreenLoading } from "@/components/tl/states";
import {
  card,
  cardFrame,
  focusRing,
  primaryButton,
  rowButton,
  textLink,
} from "@/components/tl/styles";
import { useCreateTicket, useMyTickets } from "@/hooks/support/useTickets";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/apiError";
import { versionLabel } from "@/lib/appVersion";
import { NewTicketSheet, type NewTicketValues } from "./NewTicketSheet";
import { TicketStatusPill } from "./TicketPills";
import {
  SUPPORT_DESK_HREF,
  areaLabel,
  statusesForMineTab,
  ticketErrorMessage,
  ticketHref,
  timeAgo,
  type MineTab,
} from "./ticket.presentation";

/** The requester's filter tabs. */
const MINE_TABS: TabOption<MineTab>[] = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

/** Rows per page. */
const PAGE_SIZE = 15;

/**
 * Help & support (v1.5 §1 and §3): "Contact Talim support" for the admin's
 * own tickets to Talim (raise one, follow the list, open a thread to reply,
 * reopen or close), the support email, and this build's version. Open to
 * every signed-in admin; desk staff also get a link to the school's support
 * desk.
 *
 * @returns The screen.
 */
export function HelpScreen() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [tab, setTab] = useState<MineTab>("active");
  const [page, setPage] = useState(1);
  const [composing, setComposing] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const tickets = useMyTickets({ status: statusesForMineTab(tab), page, limit: PAGE_SIZE });
  const create = useCreateTicket();
  const rows = tickets.data?.data ?? [];
  const meta = tickets.data?.meta;

  useEffect(() => setPage(1), [tab]);

  /**
   * Raises the ticket to Talim and opens it.
   *
   * @param values - Area, subject, message and attachments.
   * @returns The new ticket, or null when it failed.
   */
  const raise = async (values: NewTicketValues) => {
    setCreateError(null);
    try {
      const ticket = await create.mutateAsync({
        desk: "talim",
        ...values,
        attachments: values.attachments.length ? values.attachments : undefined,
      });
      toast.success(`Ticket ${ticket.reference} sent to Talim support`);
      setComposing(false);
      router.push(ticketHref(ticket.id, "requester"));
      return ticket;
    } catch (error) {
      setCreateError(
        ticketErrorMessage(
          error,
          "We couldn't send your ticket. Try again, or email support@mytalim.com."
        )
      );
      return null;
    }
  };

  return (
    <Page guide="help">
      <PageHeader
        title="Help & support"
        subtitle="Ask the Talim team for help with School Admin. Replies arrive here and as notifications."
        actions={
          <button type="button" className={primaryButton} onClick={() => setComposing(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New ticket
          </button>
        }
      />

      <section className={cardFrame} aria-labelledby="my-tickets-title">
        <div className="flex flex-col gap-4 p-[clamp(18px,2.4vw,24px)] pb-4">
          <CardHeader
            title={<span id="my-tickets-title">Contact Talim support</span>}
            subtitle="Your tickets to the Talim team, newest activity first."
          />
          <Segmented
            options={MINE_TABS}
            value={tab}
            onChange={setTab}
            label="Show tickets that are"
          />
        </div>
        {tickets.isPending ? (
          <div className="px-[clamp(18px,2.4vw,24px)] pb-6">
            <ScreenLoading label="Loading your tickets" blocks={2} height={72} />
          </div>
        ) : tickets.isError && !tickets.data ? (
          <div className="px-[clamp(18px,2.4vw,24px)] pb-6">
            <ScreenError
              title="We couldn't load your tickets"
              message={getErrorMessage(tickets.error, "Check your connection and try again.")}
              onRetry={() => void tickets.refetch()}
              retrying={tickets.isFetching}
            />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNote
            icon={<LifeBuoy />}
            title={tab === "active" ? "No open tickets" : "No tickets here"}
            action={
              <button type="button" className={primaryButton} onClick={() => setComposing(true)}>
                New ticket
              </button>
            }
          >
            Something not working, or a question about School Admin? Raise a ticket and the Talim
            team will reply.
          </EmptyNote>
        ) : (
          <>
            <ul className="border-t border-tl-line-soft" aria-label="Your tickets">
              {rows.map((ticket) => (
                <li key={ticket.id} className="border-b border-tl-line-soft last:border-b-0">
                  <Link
                    href={ticketHref(ticket.id, "requester")}
                    className={`flex min-h-[64px] flex-wrap items-center gap-x-4 gap-y-1.5 px-[clamp(18px,2.4vw,24px)] py-3.5 hover:bg-tl-subtle ${focusRing}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-extrabold text-tl-ink">
                        {ticket.subject}
                      </div>
                      <div className="mt-0.5 text-xs text-tl-muted">
                        <span className="font-mono">{ticket.reference}</span> ·{" "}
                        {areaLabel(ticket.area)} · {ticket.messageCount}{" "}
                        {ticket.messageCount === 1 ? "message" : "messages"}
                      </div>
                    </div>
                    <TicketStatusPill status={ticket.status} viewer="requester" />
                    <time
                      dateTime={ticket.lastActivityAt}
                      className="w-[92px] text-right text-xs text-tl-muted"
                    >
                      {timeAgo(ticket.lastActivityAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
            {meta && meta.lastPage > 1 ? (
              <nav
                aria-label="Pages"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-tl-line-soft px-4 py-3"
              >
                <span className="text-sm text-tl-muted">
                  Page {meta.page} of {meta.lastPage}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={rowButton}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </button>
                  <button
                    type="button"
                    className={rowButton}
                    disabled={page >= meta.lastPage}
                    onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </section>

      <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        <section className={card} aria-labelledby="help-email-title">
          <CardHeader
            title={<span id="help-email-title">Email</span>}
            subtitle="Prefer email? Write to the Talim team directly."
          />
          <a href="mailto:support@mytalim.com" className={`${textLink} mt-2`}>
            <Mail className="h-4 w-4" aria-hidden />
            support@mytalim.com
          </a>
        </section>
        {hasPermission(Permission.MANAGE_SUPPORT) ? (
          <section className={card} aria-labelledby="help-desk-title">
            <CardHeader
              title={<span id="help-desk-title">Your school&apos;s desk</span>}
              subtitle="Tickets parents, students and staff raise with the school are handled on the support desk."
            />
            <Link href={SUPPORT_DESK_HREF} className={`${textLink} mt-2`}>
              Open the support desk →
            </Link>
          </section>
        ) : null}
        <section className={card} aria-labelledby="help-about-title">
          <CardHeader
            title={<span id="help-about-title">About</span>}
            subtitle="Talim School Administration"
          />
          <p className="mt-2 text-[15px] font-bold text-tl-ink" data-testid="help-version">
            {versionLabel()}
          </p>
        </section>
      </div>

      <NewTicketSheet
        open={composing}
        onClose={() => {
          setComposing(false);
          setCreateError(null);
        }}
        onCreate={raise}
        busy={create.isPending}
        error={createError}
      />
    </Page>
  );
}
