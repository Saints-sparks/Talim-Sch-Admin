/**
 * Support tickets (v1.5 §1): the school's support desk and the admin's own
 * tickets to Talim. One backend system (`/tickets`), two desks.
 *
 * - The school desk (school admin, or a sub-admin with `manage:support`)
 *   lists its queue, reads tickets with internal notes, replies or adds
 *   internal notes, sets status, priority and assignee, and escalates to
 *   Talim.
 * - Anyone signed in raises tickets to Talim and follows them ("Contact Talim
 *   support"): list, read (internal notes never included), reply, reopen
 *   within 7 days, close.
 *
 * Every function throws `ApiError`. Writes answer 409 with a sub-code in
 * `ApiError.meta.code` (see `TicketConflictCode`).
 */
import { api } from "@/lib/apiClient";
import type {
  AddTicketMessageBody,
  CreateTicketBody,
  DeskTicketQuery,
  EscalateTicketBody,
  MyTicketQuery,
  Ticket,
  TicketDeskCounts,
  TicketListResponse,
  UpdateTicketBody,
} from "@/types/tickets";

/** The routes, in one place. */
export const TICKET_ROUTES = {
  create: "/tickets",
  mine: "/tickets/mine",
  schoolDesk: "/tickets/desk/school",
  schoolDeskCounts: "/tickets/desk/school/counts",
  one: (id: string) => `/tickets/${encodeURIComponent(id)}`,
  messages: (id: string) => `/tickets/${encodeURIComponent(id)}/messages`,
  escalate: (id: string) => `/tickets/${encodeURIComponent(id)}/escalate`,
  reopen: (id: string) => `/tickets/${encodeURIComponent(id)}/reopen`,
  close: (id: string) => `/tickets/${encodeURIComponent(id)}/close`,
} as const;

/**
 * The query string of a desk queue: statuses comma-separated, empty filters
 * left out, the search trimmed.
 *
 * @param query - The filters.
 * @returns `?status=open,in_progress&page=1&limit=20…`, or "" when nothing is set.
 */
export function deskQueryString(query: DeskTicketQuery): string {
  const params = new URLSearchParams();
  if (query.status?.length) params.set("status", query.status.join(","));
  if (query.area) params.set("area", query.area);
  if (query.priority) params.set("priority", query.priority);
  if (query.assigneeId) params.set("assigneeId", query.assigneeId);
  const q = query.q?.trim();
  if (q) params.set("q", q);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/**
 * The query string of `GET /tickets/mine`.
 *
 * @param query - Statuses and paging.
 * @returns The query string, or "".
 */
export function mineQueryString(query: MyTicketQuery): string {
  return deskQueryString({ status: query.status, page: query.page, limit: query.limit });
}

export const ticketService = {
  /**
   * The school desk's queue: tickets raised to the school, plus the ones it
   * escalated to Talim (read-only, `access: "observer"`).
   *
   * @param query - Status, area, priority, assignee, search and paging.
   * @returns A page of tickets.
   */
  schoolDesk: (query: DeskTicketQuery = {}): Promise<TicketListResponse> =>
    api.get<TicketListResponse>(`${TICKET_ROUTES.schoolDesk}${deskQueryString(query)}`),

  /**
   * The school desk's numbers for its status tabs and the Unassigned / Mine
   * shortcuts.
   *
   * @returns The counts.
   */
  schoolDeskCounts: (): Promise<TicketDeskCounts> =>
    api.get<TicketDeskCounts>(TICKET_ROUTES.schoolDeskCounts),

  /**
   * The tickets the signed-in admin raised (to Talim), newest activity first.
   *
   * @param query - Statuses and paging.
   * @returns A page of tickets.
   */
  mine: (query: MyTicketQuery = {}): Promise<TicketListResponse> =>
    api.get<TicketListResponse>(`${TICKET_ROUTES.mine}${mineQueryString(query)}`),

  /**
   * One ticket with its messages. Desk staff get internal notes and the
   * context; a requester never does.
   *
   * @param id - The ticket id.
   * @returns The ticket.
   */
  get: (id: string): Promise<Ticket> => api.get<Ticket>(TICKET_ROUTES.one(id)),

  /**
   * Raises a ticket. School Admin raises tickets to Talim (`desk: "talim"`).
   *
   * @param body - Desk, area, subject, first message and attachments.
   * @returns The new ticket.
   */
  create: (body: CreateTicketBody): Promise<Ticket> => api.post<Ticket>(TICKET_ROUTES.create, body),

  /**
   * Replies, or (desk staff, `internal: true`) adds an internal note. 409
   * when the ticket is closed, holds 500 messages, or is read-only to the
   * caller.
   *
   * @param id - The ticket id.
   * @param body - The message, attachments and the internal flag.
   * @returns The ticket after the message.
   */
  reply: (id: string, body: AddTicketMessageBody): Promise<Ticket> =>
    api.post<Ticket>(TICKET_ROUTES.messages(id), body),

  /**
   * Desk staff: sets the status, priority or assignee. 409 `TICKET_CHANGED`
   * when someone changed the ticket meanwhile.
   *
   * @param id - The ticket id.
   * @param body - The fields to change.
   * @returns The ticket after the change.
   */
  update: (id: string, body: UpdateTicketBody): Promise<Ticket> =>
    api.patch<Ticket>(TICKET_ROUTES.one(id), body),

  /**
   * School desk: moves a ticket to the Talim desk, keeping its history; the
   * note becomes an internal note and the school keeps read-only access.
   *
   * @param id - The ticket id.
   * @param body - Why it goes to Talim.
   * @returns The ticket after the move.
   */
  escalate: (id: string, body: EscalateTicketBody): Promise<Ticket> =>
    api.post<Ticket>(TICKET_ROUTES.escalate(id), body),

  /**
   * Requester: reopens a resolved ticket (409 after 7 days, or when it is not
   * resolved).
   *
   * @param id - The ticket id.
   * @returns The reopened ticket.
   */
  reopen: (id: string): Promise<Ticket> => api.post<Ticket>(TICKET_ROUTES.reopen(id), {}),

  /**
   * Requester: closes their own ticket.
   *
   * @param id - The ticket id.
   * @returns The closed ticket.
   */
  close: (id: string): Promise<Ticket> => api.post<Ticket>(TICKET_ROUTES.close(id), {}),
};
