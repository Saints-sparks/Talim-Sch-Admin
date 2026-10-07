/**
 * Support-ticket fixtures (v1.5 §1) for the desk and Help tests, in the
 * shapes of `src/types/tickets.ts` (hand-written from the contract while the
 * backend is built). Each builder returns a fresh object, so a test can
 * change it freely.
 */
import { ApiError } from "@/lib/apiError";
import type {
  Ticket,
  TicketConflictCode,
  TicketDeskCounts,
  TicketListResponse,
  TicketMessage,
  TicketSummary,
} from "@/types/tickets";

/** The school's admin (matches `mockAdmin.userId` in test-utils/render). */
export const ADMIN = { id: "user-1", name: "Sade Admin", role: "school_admin" };
/** A parent who raises a ticket to the school. */
export const PARENT = { id: "parent-1", name: "Paul Parent", role: "parent" };
/** A sub-admin on the desk. */
export const DESK_SUB_ADMIN = { id: "sub-9", name: "Dayo Desk" };

/**
 * A message.
 *
 * @param overrides - Fields to change.
 * @returns The message.
 */
export function message(overrides: Partial<TicketMessage> = {}): TicketMessage {
  return {
    id: "m1",
    author: PARENT,
    body: "Ada's Term 1 result shows the wrong maths score.",
    attachments: [],
    internal: false,
    createdAt: "2026-10-05T09:00:00.000Z",
    ...overrides,
  };
}

/**
 * A school-desk ticket the desk can act on: a parent's question, an internal
 * note and a staff reply.
 *
 * @param overrides - Fields to change.
 * @returns The ticket.
 */
export function deskTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    reference: "CMP-10042",
    desk: "school",
    area: "results",
    subject: "Wrong maths score on Ada's result",
    status: "open",
    priority: "normal",
    requester: PARENT,
    school: { id: "school-1", name: "Greenfield Academy" },
    child: { id: "stu-1", name: "Ada Student" },
    assignee: null,
    messageCount: 3,
    escalatedFrom: null,
    access: "desk",
    lastActivityAt: "2026-10-05T11:00:00.000Z",
    firstResponseAt: "2026-10-05T10:30:00.000Z",
    resolvedAt: null,
    closedAt: null,
    createdAt: "2026-10-05T09:00:00.000Z",
    messages: [
      message({
        attachments: [
          {
            url: "https://cdn.test/result.png",
            name: "result.png",
            mimeType: "image/png",
            size: 245_000,
          },
        ],
      }),
      message({
        id: "m2",
        author: ADMIN,
        body: "Checked the gradebook: the CA score was entered twice.",
        internal: true,
        createdAt: "2026-10-05T10:00:00.000Z",
      }),
      message({
        id: "m3",
        author: ADMIN,
        body: "Thanks, Paul. We're correcting it with the class teacher.",
        createdAt: "2026-10-05T10:30:00.000Z",
      }),
    ],
    reopenableUntil: null,
    escalatedAt: null,
    context: { path: "/results", appVersion: "1.5.0", userAgent: "Parents web" },
    ...overrides,
  };
}

/**
 * A school ticket the desk escalated: Talim holds it now and the school
 * reads it only.
 *
 * @param overrides - Fields to change.
 * @returns The ticket.
 */
export function escalatedTicket(overrides: Partial<Ticket> = {}): Ticket {
  return deskTicket({
    id: "t2",
    reference: "TS-7KQ2M",
    desk: "talim",
    escalatedFrom: "school",
    access: "observer",
    status: "in_progress",
    escalatedAt: "2026-10-05T12:00:00.000Z",
    ...overrides,
  });
}

/**
 * The admin's own ticket to Talim, resolved and still inside its 7 days. Its
 * payload carries an internal note on purpose: the requester views must drop
 * it.
 *
 * @param overrides - Fields to change.
 * @returns The ticket.
 */
export function myTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t9",
    reference: "TS-4F2K9",
    desk: "talim",
    area: "payments",
    subject: "Bank transfer stuck on pending",
    status: "resolved",
    priority: "normal",
    requester: ADMIN,
    school: { id: "school-1", name: "Greenfield Academy" },
    child: null,
    assignee: { id: "talim-1", name: "Tobi (Talim)" },
    messageCount: 2,
    escalatedFrom: null,
    access: "requester",
    lastActivityAt: "2026-10-04T15:00:00.000Z",
    firstResponseAt: "2026-10-04T12:00:00.000Z",
    resolvedAt: "2026-10-04T15:00:00.000Z",
    closedAt: null,
    createdAt: "2026-10-04T09:00:00.000Z",
    messages: [
      message({
        id: "a1",
        author: ADMIN,
        body: "A parent's bank transfer has been pending for 3 days.",
        createdAt: "2026-10-04T09:00:00.000Z",
      }),
      message({
        id: "a2",
        author: { id: "talim-1", name: "Tobi (Talim)", role: "platform_admin" },
        body: "Provider delay; it cleared overnight.",
        internal: true,
        createdAt: "2026-10-04T11:00:00.000Z",
      }),
      message({
        id: "a3",
        author: { id: "talim-1", name: "Tobi (Talim)", role: "platform_admin" },
        body: "It's confirmed now. Reopen this if it happens again.",
        createdAt: "2026-10-04T15:00:00.000Z",
      }),
    ],
    reopenableUntil: "2099-01-01T00:00:00.000Z",
    escalatedAt: null,
    context: null,
    ...overrides,
  };
}

/**
 * A ticket as a list row (the summary fields only).
 *
 * @param ticket - The full ticket.
 * @returns The summary.
 */
export function summaryOf(ticket: Ticket): TicketSummary {
  const {
    messages: _messages,
    reopenableUntil: _reopen,
    escalatedAt: _escalated,
    context: _context,
    ...summary
  } = ticket;
  return summary;
}

/**
 * A one-page list.
 *
 * @param rows - The tickets.
 * @returns The list response.
 */
export function ticketPage(rows: Ticket[]): TicketListResponse {
  return {
    data: rows.map(summaryOf),
    meta: { total: rows.length, page: 1, lastPage: 1, limit: 20 },
  };
}

/**
 * The desk's counts.
 *
 * @param overrides - Fields to change.
 * @returns The counts.
 */
export function deskCounts(overrides: Partial<TicketDeskCounts> = {}): TicketDeskCounts {
  return {
    open: 3,
    in_progress: 2,
    waiting_on_user: 1,
    resolved: 4,
    unassigned: 2,
    mine: 1,
    ...overrides,
  };
}

/**
 * The 409 a ticket write answers, with its sub-code in `meta.code`.
 *
 * @param code - The sub-code.
 * @param message - The server's words.
 * @returns The error.
 */
export function ticketConflict(code: TicketConflictCode, message = "Conflict"): ApiError {
  return new ApiError("CONFLICT", message, 409, [], "req-1", { code });
}
