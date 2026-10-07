/**
 * Support tickets (v1.5 §1, "one system, two desks"), hand-written from the
 * contract `talimBE-V2/docs/v1.5-platform-sync.md` §1 and its "v1.5 as
 * built" section (backend, 2026-10-07), which wins where they differ: the
 * un-prefixed 409 codes, `closed` and `total` in the counts, the staff list,
 * `requester.email` in staff views. These were written while the backend was
 * built, so they are not generated: when `npm run types:api` carries the
 * ticket schemas, replace these with aliases of the generated ones and keep
 * the comments.
 *
 * Dates arrive as ISO strings. Ids are strings. A person on a ticket is
 * `{ id, name, role }` and never carries an email.
 */

/** Which desk handles a ticket: the requester's school, or Talim. */
export type TicketDesk = "school" | "talim";

/** What a ticket is about (the Round 4 support areas, widened in v1.5). */
export type TicketArea =
  | "grading"
  | "attendance"
  | "timetable"
  | "messages"
  | "signing_in"
  | "payments"
  | "fees"
  | "results"
  | "transport"
  | "behaviour"
  | "other";

/**
 * Where a ticket stands. `waiting_on_user` waits for the requester; a
 * `resolved` ticket can be reopened by its requester for 7 days, after which
 * a cron closes it.
 */
export type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";

/** How urgent the desk judges it. New tickets are `normal`. */
export type TicketPriority = "low" | "normal" | "high" | "urgent";

/**
 * How the signed-in user may use a ticket (the backend's `access`):
 * - `requester`: they raised it; they read it without internal notes, reply,
 *   reopen and close it;
 * - `desk`: staff of the desk that holds it; everything, internal notes
 *   included;
 * - `observer`: may read it with internal notes but not act on it (the
 *   school desk on a ticket it escalated to Talim).
 */
export type TicketAccess = "requester" | "desk" | "observer";

/** A person on a ticket: the requester, a message's author. */
export interface TicketPerson {
  id: string;
  name: string;
  /** `parent`, `student`, `teacher`, `school_admin`, `school_sub_admin`, `platform_admin`… */
  role: string;
  /** The requester's email, in staff and observer views only (never in a requester's own view). */
  email?: string;
}

/** One member of a desk's staff (`GET /tickets/desk/:desk/staff`): who a ticket can be assigned to. */
export interface TicketStaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

/** A named reference: the school, the child, the assignee. */
export interface TicketRef {
  id: string;
  name: string;
}

/** An uploaded file on a message (upload first with `POST /upload/file`, then send its URL). */
export interface TicketAttachment {
  /** An https URL from the upload route. */
  url: string;
  name: string;
  mimeType: string;
  /** Bytes; 0 when unknown (attachments migrated from a bare URL). */
  size: number;
}

/**
 * One message on a ticket. `internal` notes are for desk staff only: the
 * backend strips them from everything a requester reads, and the requester
 * views here drop them again as a second guard.
 */
export interface TicketMessage {
  id: string;
  author: TicketPerson;
  /** 1 to 5000 characters. */
  body: string;
  attachments: TicketAttachment[];
  internal: boolean;
  createdAt: string;
}

/** Where the requester was when they raised it (desk staff only; null for the requester). */
export interface TicketContext {
  path?: string | null;
  appVersion?: string | null;
  userAgent?: string | null;
}

/** One row of a ticket list (`GET /tickets/mine`, the desk queues). */
export interface TicketSummary {
  id: string;
  /** "TS-XXXXX" on the Talim desk; the school desk keeps the complaint reference format. */
  reference: string;
  desk: TicketDesk;
  area: TicketArea;
  /** 3 to 140 characters. */
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: TicketPerson;
  /** The requester's school (a multi-school parent's ticket uses the chosen child's school). */
  school: TicketRef | null;
  /** The child it is about, when a parent chose one. */
  child: TicketRef | null;
  /** The desk staff member handling it. */
  assignee: TicketRef | null;
  /** Messages the caller can see (internal notes count for desk staff only). */
  messageCount: number;
  /** "school" once a school ticket has been escalated to Talim. */
  escalatedFrom: "school" | null;
  access: TicketAccess;
  lastActivityAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

/** One ticket with its messages (`GET /tickets/:id` and the answer to every write). */
export interface Ticket extends TicketSummary {
  /** Oldest first. At most 500; the 501st answers 409 `MESSAGE_CAP`. */
  messages: TicketMessage[];
  /** While resolved: the last moment the requester can reopen it (7 days). */
  reopenableUntil: string | null;
  escalatedAt: string | null;
  context: TicketContext | null;
}

/** The paging block of a list. */
export interface TicketPageMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

/** A page of tickets. */
export interface TicketListResponse {
  data: TicketSummary[];
  meta: TicketPageMeta;
}

/**
 * `GET /tickets/desk/school/counts`: the status tabs' numbers. The school
 * desk counts its own desk only (not what it escalated).
 */
export interface TicketDeskCounts {
  open: number;
  in_progress: number;
  waiting_on_user: number;
  resolved: number;
  closed: number;
  /** Every ticket on the desk. */
  total: number;
  /** Active (open, in progress, waiting) and nobody assigned. */
  unassigned: number;
  /** Active and assigned to the caller. */
  mine: number;
}

/** Filters of a desk queue (`GET /tickets/desk/school`). */
export interface DeskTicketQuery {
  /** One or more statuses (sent comma-separated); none means every status. */
  status?: TicketStatus[];
  area?: TicketArea;
  priority?: TicketPriority;
  /** A staff user id, `me`, or `none` (alias `unassigned`) for unassigned tickets. */
  assigneeId?: string;
  /** A reference (exact) or words of the subject. At most 100 characters. */
  q?: string;
  page?: number;
  limit?: number;
}

/** Filters of `GET /tickets/mine`. */
export interface MyTicketQuery {
  status?: TicketStatus[];
  page?: number;
  limit?: number;
}

/** Body of `POST /tickets`. School staff may raise tickets to `talim` only. */
export interface CreateTicketBody {
  desk: TicketDesk;
  area: TicketArea;
  /** 3 to 140 characters. */
  subject: string;
  /** The first message, 1 to 5000 characters. */
  body: string;
  /** At most 5 per message, 25 MB each. */
  attachments?: TicketAttachment[];
  /** A parent's child (not used by School Admin). */
  childId?: string;
}

/** Body of `POST /tickets/:id/messages`. */
export interface AddTicketMessageBody {
  /** 1 to 5000 characters. */
  body: string;
  attachments?: TicketAttachment[];
  /** Desk staff only: a note the requester never sees. */
  internal?: boolean;
}

/** Body of `PATCH /tickets/:id` (desk staff). */
export interface UpdateTicketBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  /** A staff user of the ticket's desk; `null` unassigns. */
  assigneeId?: string | null;
}

/** Body of `POST /tickets/:id/escalate` (school desk). */
export interface EscalateTicketBody {
  /** Why it goes to Talim, 1 to 2000 characters; kept as an internal note. */
  note: string;
}

/**
 * The sub-codes a ticket write's 409 carries (`ApiError.meta.code`, while
 * `error.code` stays `CONFLICT`), as built: closed, the 500-message cap, a
 * transition the rules do not allow (or reopening a ticket that is not
 * resolved), read-only after escalation, a concurrent change, already with
 * Talim, and the 7-day reopen window. `MESSAGE_CAP`, `INVALID_TRANSITION`
 * and `REOPEN_WINDOW_PASSED` carry no `TICKET_` prefix.
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
