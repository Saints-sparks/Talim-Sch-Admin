/**
 * Support tickets (v1.5 §1, "one system, two desks"), as aliases of the
 * generated contract (`./api.d.ts`, from `talimBE-V2/docs/api-types.d.ts`;
 * refresh it with `npm run types:api`). The shapes are described in
 * `talimBE-V2/docs/v1.5-platform-sync.md`, "v1.5 as built" → "Tickets as built".
 *
 * Dates arrive as ISO strings. Ids are strings. `requester.email` is only in
 * staff and observer views. `unread` is per side: for the desk, the
 * requester's messages since a desk member last opened or acted on the
 * ticket (always 0 for observers). Hand-written here: the desk's filters with
 * several statuses (the API takes them comma-separated), the 409 reason
 * codes, and the limits the forms check.
 */
import type { RequestBody, RequestQuery, Schema } from "./apiContract";

/** One ticket with its thread (`GET /tickets/:id`, and every write's answer). */
export type Ticket = Schema<"TicketDto">;
/** One row of a desk queue or of `GET /tickets/mine`. */
export type TicketSummary = Schema<"TicketSummaryDto">;
/** One page of tickets. */
export type TicketListResponse = Schema<"TicketListResponseDto">;
/** The page block of {@link TicketListResponse}. */
export type TicketPageMeta = TicketListResponse["meta"];
/** One message: internal notes are only in desk and observer views. */
export type TicketMessage = Schema<"TicketMessageDto">;
/** A file on a message. */
export type TicketAttachment = Schema<"TicketAttachmentDto">;
/** Where the requester was when raising it: shown to desk staff and observers, never to the requester. */
export type TicketContext = Schema<"TicketContextDto">;
/** The `context` sent on `POST /tickets`. */
export type TicketContextInput = Schema<"TicketContextInputDto">;
/** A person on a ticket: a message's author. */
export type TicketPerson = Schema<"TicketPersonDto">;
/** The requester (`email` only in staff and observer views). */
export type TicketRequester = Schema<"TicketRequesterDto">;
/** A school, child or assignee named on a ticket. */
export type TicketRef = Schema<"TicketRefDto">;
/** One of the desk's staff (`GET /tickets/desk/school/staff`): the school's admins and sub-admins with `manage:support`. */
export type TicketStaffMember = Schema<"TicketStaffDto">;
/** `GET /tickets/desk/school/counts`: `unassigned` and `mine` count active tickets only. */
export type TicketDeskCounts = Schema<"TicketCountsDto">;

/** Which desk handles a ticket: the requester's school, or Talim. */
export type TicketDesk = Ticket["desk"];
/** What a ticket is about. */
export type TicketArea = Ticket["area"];
/** Workflow status. */
export type TicketStatus = Ticket["status"];
/** Triage priority, set by desk staff. */
export type TicketPriority = Ticket["priority"];
/**
 * How the caller may use a ticket: `requester`, `desk` (act on it) or
 * `observer` (read only: the school desk on a ticket it escalated).
 */
export type TicketAccess = Ticket["access"];

/**
 * Filters of a desk queue (`GET /tickets/desk/school`). The contract types
 * `status` as one value; the API takes several, comma-separated.
 * `assigneeId` is a staff user id, `me`, or `none` (alias `unassigned`);
 * `q` is a reference (exact) or words of the subject, at most 100 characters.
 */
export type DeskTicketQuery = Omit<RequestQuery<"/tickets/desk/school">, "status" | "scope" | "schoolId"> & {
  status?: TicketStatus[];
};
/** Filters of `GET /tickets/mine` (several statuses, comma-separated). */
export type MyTicketQuery = Omit<RequestQuery<"/tickets/mine">, "status"> & { status?: TicketStatus[] };

/** Body of `POST /tickets`: school staff raise tickets to `talim` only. */
export type CreateTicketBody = RequestBody<"/tickets">;
/** Body of `POST /tickets/:id/messages`; `internal` and `status` are desk-only. */
export type AddTicketMessageBody = RequestBody<"/tickets/{id}/messages">;
/** Body of `PATCH /tickets/:id` (desk staff); `assigneeId: null` unassigns. */
export type UpdateTicketBody = RequestBody<"/tickets/{id}", "patch">;
/** Body of `POST /tickets/:id/escalate` (school desk): the note is kept as an internal note. */
export type EscalateTicketBody = RequestBody<"/tickets/{id}/escalate">;

/**
 * The reasons a ticket write's 409 carries at the top-level `code`
 * (`ApiError.meta.code`, while `error.code` stays `CONFLICT`), as built:
 * closed, the 500-message cap, a transition the rules do not allow (or
 * reopening a ticket that is not resolved), read-only after escalation, a
 * concurrent change, already with Talim, and the 7-day reopen window.
 * `MESSAGE_CAP`, `INVALID_TRANSITION` and `REOPEN_WINDOW_PASSED` carry no
 * `TICKET_` prefix.
 */
export type TicketConflictCode =
  | "TICKET_CLOSED"
  | "MESSAGE_CAP"
  | "INVALID_TRANSITION"
  | "TICKET_ESCALATED"
  | "TICKET_NOT_ESCALATED"
  | "TICKET_CHANGED"
  | "TICKET_ALREADY_TALIM"
  | "REOPEN_WINDOW_PASSED";

/** Limits the forms check before sending (the backend checks them too). */
export const TICKET_LIMITS = {
  subjectMin: 3,
  subjectMax: 140,
  bodyMax: 5000,
  noteMax: 2000,
  attachmentsPerMessage: 5,
  attachmentMaxBytes: 25 * 1024 * 1024,
  searchMax: 100,
} as const;

/** Longest `context` values `POST /tickets` takes. */
export const TICKET_CONTEXT_LIMITS = { path: 500, appVersion: 50, userAgent: 500 } as const;
