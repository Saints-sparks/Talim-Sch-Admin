"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LifeBuoy, RefreshCw } from "lucide-react";
import { Page, PageHeader } from "@/components/tl/Page";
import { Avatar, SearchField } from "@/components/tl/bits";
import { Tabs, type TabOption } from "@/components/tl/Tabs";
import { EmptyNote, ScreenError, ScreenLoading } from "@/components/tl/states";
import {
  cardFrame,
  fieldLabel,
  focusRing,
  ghostButton,
  quietButton,
  rowButton,
  selectControl,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tr,
} from "@/components/tl/styles";
import { useDeskCounts, useDeskQueue } from "@/hooks/support/useTickets";
import { useDeskAssignees } from "@/hooks/support/useDeskAssignees";
import { getErrorMessage } from "@/lib/apiError";
import {
  TICKET_LIMITS,
  type DeskTicketQuery,
  type TicketArea,
  type TicketDeskCounts,
  type TicketPriority,
} from "@/types/tickets";
import { TicketPriorityPill, TicketStatusPill } from "./TicketPills";
import {
  TICKET_AREAS,
  TICKET_PRIORITIES,
  areaLabel,
  roleLabel,
  statusesForTab,
  ticketHref,
  timeAgo,
  type DeskTab,
} from "./ticket.presentation";

/** Rows per page. */
const PAGE_SIZE = 20;

/**
 * The status tabs with their counts. Closed and All have no count of their
 * own (the counts route reports the working statuses).
 *
 * @param counts - The desk's counts, once loaded.
 * @returns The tabs.
 */
export function deskTabs(counts: TicketDeskCounts | undefined): TabOption<DeskTab>[] {
  const active = counts ? counts.open + counts.in_progress + counts.waiting_on_user : undefined;
  return [
    {
      value: "active",
      label: "Active",
      count: active,
      tip: "Open, in progress and waiting on the requester",
    },
    { value: "open", label: "Open", count: counts?.open },
    { value: "in_progress", label: "In progress", count: counts?.in_progress },
    { value: "waiting_on_user", label: "Waiting on requester", count: counts?.waiting_on_user },
    { value: "resolved", label: "Resolved", count: counts?.resolved },
    { value: "closed", label: "Closed" },
    { value: "all", label: "All" },
  ];
}

/**
 * Waits `delay` ms after the last change before passing a value on (the
 * search box), so typing does not send a request per key.
 *
 * @param value - The live value.
 * @param delay - Milliseconds.
 * @returns The settled value.
 */
function useDebounced<T>(value: T, delay = 350): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

/**
 * The school's support desk (v1.5 §1): status tabs with counts, the
 * Unassigned and Mine shortcuts, filters for area, priority and assignee, a
 * search over references and subjects, and the queue (requester, child,
 * area, priority, status, assignee, last activity). A row opens the ticket.
 *
 * The route is gated by `manage:support` (school admin, or a sub-admin
 * holding it); this screen does not re-check.
 *
 * @returns The desk.
 */
export function DeskQueue() {
  const [tab, setTab] = useState<DeskTab>("active");
  const [area, setArea] = useState<TicketArea | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [assignee, setAssignee] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.slice(0, TICKET_LIMITS.searchMax));

  const query: DeskTicketQuery = useMemo(
    () => ({
      status: statusesForTab(tab),
      area: area || undefined,
      priority: priority || undefined,
      assigneeId: assignee || undefined,
      q: q || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [tab, area, priority, assignee, q, page]
  );

  // Any filter change starts again at the first page.
  useEffect(() => setPage(1), [tab, area, priority, assignee, q]);

  const queue = useDeskQueue(query);
  const counts = useDeskCounts();
  const rows = queue.data?.data ?? [];
  const meta = queue.data?.meta;
  const { options: assignees } = useDeskAssignees(rows.map((r) => r.assignee));
  const filtered = Boolean(area || priority || assignee || q);

  /**
   * Clears every filter except the tab.
   */
  const clearFilters = () => {
    setArea("");
    setPriority("");
    setAssignee("");
    setSearch("");
  };

  return (
    <Page guide="support-desk">
      <PageHeader
        eyebrowText="Communication"
        title="Support desk"
        subtitle="Questions and problems parents, students and staff raise with your school. Reply, assign, and escalate to Talim when you need help."
        actions={
          <>
            <Link href="/help" className={ghostButton}>
              <LifeBuoy className="h-4 w-4" aria-hidden />
              Contact Talim support
            </Link>
            <button
              type="button"
              className={ghostButton}
              onClick={() => {
                void queue.refetch();
                void counts.refetch();
              }}
              disabled={queue.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${queue.isFetching ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      <Tabs
        options={deskTabs(counts.data)}
        value={tab}
        onChange={setTab}
        label="Ticket status"
        idPrefix="desk"
        variant="segmented"
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Shortcuts">
        <button
          type="button"
          aria-pressed={assignee === "none"}
          onClick={() => setAssignee(assignee === "none" ? "" : "none")}
          className={`${rowButton} ${assignee === "none" ? "bg-tl-select" : ""}`}
        >
          Unassigned{counts.data ? ` (${counts.data.unassigned})` : ""}
        </button>
        <button
          type="button"
          aria-pressed={assignee === "me"}
          onClick={() => setAssignee(assignee === "me" ? "" : "me")}
          className={`${rowButton} ${assignee === "me" ? "bg-tl-select" : ""}`}
        >
          Assigned to me{counts.data ? ` (${counts.data.mine})` : ""}
        </button>
      </div>

      <div
        className="flex flex-wrap items-end gap-3 rounded-[22px] border border-tl-line bg-tl-surface p-4"
        role="search"
        aria-label="Filter tickets"
      >
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search tickets"
          placeholder="Reference or subject"
          className="min-w-[220px] flex-[2]"
        />
        <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
          <label htmlFor="desk-area" className={fieldLabel}>
            Area
          </label>
          <select
            id="desk-area"
            value={area}
            onChange={(e) => setArea(e.target.value as TicketArea | "")}
            className={selectControl}
          >
            <option value="">All areas</option>
            {TICKET_AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1.5">
          <label htmlFor="desk-priority" className={fieldLabel}>
            Priority
          </label>
          <select
            id="desk-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority | "")}
            className={selectControl}
          >
            <option value="">Any priority</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[170px] flex-1 flex-col gap-1.5">
          <label htmlFor="desk-assignee" className={fieldLabel}>
            Assignee
          </label>
          <select
            id="desk-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className={selectControl}
          >
            <option value="">Anyone</option>
            <option value="me">Me</option>
            <option value="none">Unassigned</option>
            {assignees.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        {filtered ? (
          <button type="button" className={quietButton} onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <section id="desk-panel" role="tabpanel" aria-labelledby={`desk-tab-${tab}`}>
        {queue.isPending ? (
          <ScreenLoading label="Loading tickets" blocks={3} height={88} />
        ) : queue.isError && !queue.data ? (
          <ScreenError
            title="We couldn't load the support desk"
            message={getErrorMessage(queue.error, "Check your connection and try again.")}
            onRetry={() => void queue.refetch()}
            retrying={queue.isFetching}
          />
        ) : rows.length === 0 ? (
          <div className={cardFrame}>
            <EmptyNote
              title={
                filtered
                  ? "No tickets match these filters"
                  : tab === "active"
                    ? "Nothing waiting for the desk"
                    : "No tickets here"
              }
              action={
                filtered ? (
                  <button type="button" className={ghostButton} onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : undefined
              }
            >
              {filtered
                ? "Try another area, priority or assignee, or clear the search."
                : "When a parent, student or member of staff raises a ticket to the school, it appears here."}
            </EmptyNote>
          </div>
        ) : (
          <div className={cardFrame}>
            <div className={tableScroll}>
              <table className={`${table} min-w-[880px]`}>
                <caption className="sr-only">Support tickets</caption>
                <thead>
                  <tr className={theadRow}>
                    <th scope="col" className={th}>
                      Ticket
                    </th>
                    <th scope="col" className={th}>
                      Requester
                    </th>
                    <th scope="col" className={th}>
                      Area
                    </th>
                    <th scope="col" className={th}>
                      Priority
                    </th>
                    <th scope="col" className={th}>
                      Status
                    </th>
                    <th scope="col" className={th}>
                      Assignee
                    </th>
                    <th scope="col" className={th}>
                      Last activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((ticket) => (
                    <tr key={ticket.id} className={tr}>
                      <td className={td}>
                        <Link
                          href={ticketHref(ticket.id, "desk")}
                          className={`block rounded-md font-extrabold text-tl-ink hover:text-tl-link ${focusRing}`}
                        >
                          <span className="block max-w-[280px] truncate">{ticket.subject}</span>
                          <span className="mt-0.5 block font-mono text-xs font-semibold text-tl-muted">
                            {ticket.reference}
                          </span>
                        </Link>
                        {ticket.access === "observer" ? (
                          <span className="mt-1 inline-block text-xs font-bold text-tl-accent">
                            With Talim support · read only
                          </span>
                        ) : null}
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            id={ticket.requester.id}
                            name={ticket.requester.name || "?"}
                            size={32}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-bold text-tl-ink">
                              {ticket.requester.name}
                            </div>
                            <div className="truncate text-xs text-tl-muted">
                              {roleLabel(ticket.requester.role)}
                              {ticket.child ? ` · for ${ticket.child.name}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={td}>{areaLabel(ticket.area)}</td>
                      <td className={td}>
                        <TicketPriorityPill priority={ticket.priority} />
                      </td>
                      <td className={td}>
                        <TicketStatusPill status={ticket.status} />
                      </td>
                      <td className={td}>
                        {ticket.assignee ? (
                          ticket.assignee.name
                        ) : (
                          <span className="text-tl-muted">Unassigned</span>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        <time dateTime={ticket.lastActivityAt}>
                          {timeAgo(ticket.lastActivityAt)}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.lastPage > 1 ? (
              <nav
                aria-label="Pages"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-tl-line-soft px-4 py-3"
              >
                <span className="text-sm text-tl-muted">
                  Page {meta.page} of {meta.lastPage} · {meta.total} tickets
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
          </div>
        )}
      </section>
    </Page>
  );
}
