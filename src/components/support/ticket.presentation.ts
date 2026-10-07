/**
 * Words, tones and rules for support tickets (v1.5 §1), shared by the school
 * desk and "Contact Talim support". Pure, so it is tested without rendering.
 */
import { ApiError, getErrorMessage } from "@/lib/apiError";
import type { Tone } from "@/components/tl/styles";
import {
  TICKET_LIMITS,
  type TicketArea,
  type TicketAttachment,
  type TicketConflictCode,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
} from "@/types/tickets";

/** Every area, in menu order, with its label. */
export const TICKET_AREAS: ReadonlyArray<{ value: TicketArea; label: string }> = [
  { value: "grading", label: "Grading" },
  { value: "results", label: "Results" },
  { value: "attendance", label: "Attendance" },
  { value: "timetable", label: "Timetable" },
  { value: "messages", label: "Messages" },
  { value: "fees", label: "Fees" },
  { value: "payments", label: "Payments" },
  { value: "transport", label: "Transport" },
  { value: "behaviour", label: "Behaviour" },
  { value: "signing_in", label: "Signing in" },
  { value: "other", label: "Something else" },
];

/** Every priority, lowest first. */
export const TICKET_PRIORITIES: ReadonlyArray<{
  value: TicketPriority;
  label: string;
  tone: Tone;
}> = [
  { value: "low", label: "Low", tone: "muted" },
  { value: "normal", label: "Normal", tone: "info" },
  { value: "high", label: "High", tone: "warning" },
  { value: "urgent", label: "Urgent", tone: "danger" },
];

/** Every status in workflow order. */
export const TICKET_STATUSES: readonly TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_on_user",
  "resolved",
  "closed",
];

/** Who is reading: desk staff, or the person who raised the ticket. */
export type TicketViewer = "desk" | "requester";

/**
 * A status as each side reads it ("Waiting on requester" at the desk is
 * "Waiting on you" to the requester).
 *
 * @param status - The status.
 * @param viewer - Who is reading.
 * @returns The label.
 */
export function statusLabel(status: TicketStatus, viewer: TicketViewer = "desk"): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "waiting_on_user":
      return viewer === "desk" ? "Waiting on requester" : "Waiting on you";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
  }
}

/**
 * The pill tone of a status.
 *
 * @param status - The status.
 * @returns The tone.
 */
export function statusTone(status: TicketStatus): Tone {
  switch (status) {
    case "open":
      return "info";
    case "in_progress":
      return "accent";
    case "waiting_on_user":
      return "warning";
    case "resolved":
      return "success";
    case "closed":
      return "muted";
  }
}

/**
 * An area's label.
 *
 * @param area - The area.
 * @returns "Signing in", "Something else", …
 */
export function areaLabel(area: TicketArea): string {
  return TICKET_AREAS.find((a) => a.value === area)?.label ?? "Something else";
}

/**
 * A priority's label and tone.
 *
 * @param priority - The priority.
 * @returns The label and tone.
 */
export function priorityMeta(priority: TicketPriority): { label: string; tone: Tone } {
  const found = TICKET_PRIORITIES.find((p) => p.value === priority);
  return found ? { label: found.label, tone: found.tone } : { label: "Normal", tone: "info" };
}

/**
 * A role as people read it.
 *
 * @param role - The API role.
 * @returns "Parent", "School admin", "Talim support", …
 */
export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    parent: "Parent",
    student: "Student",
    teacher: "Teacher",
    school_admin: "School admin",
    school_sub_admin: "Sub-admin",
    platform_admin: "Talim support",
    super_admin: "Talim support",
  };
  return (
    labels[role] ?? (role ? role.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "")
  );
}

/**
 * The messages a viewer may see. A requester never sees internal notes, even
 * if one slipped into the payload (the backend strips them too).
 *
 * @param messages - The ticket's messages.
 * @param viewer - Who is reading.
 * @returns The visible messages, oldest first.
 */
export function visibleMessages(
  messages: readonly TicketMessage[],
  viewer: TicketViewer
): TicketMessage[] {
  return viewer === "desk" ? [...messages] : messages.filter((m) => !m.internal);
}

/**
 * The statuses desk staff may move a ticket to from `from` (the backend's
 * `STAFF_TRANSITIONS`): open, in progress and waiting go anywhere; resolved
 * goes back to open or in progress, or to closed; closed is final. The
 * current status is always listed (choosing it changes nothing).
 *
 * @param from - Where the ticket stands.
 * @returns The statuses the status control offers.
 */
export function staffTransitions(from: TicketStatus): TicketStatus[] {
  if (from === "closed") return ["closed"];
  if (from === "resolved") return ["open", "in_progress", "resolved", "closed"];
  return [...TICKET_STATUSES];
}

/** The status tabs of the desk queue. `active` is everything not resolved or closed. */
export type DeskTab =
  | "active"
  | "open"
  | "in_progress"
  | "waiting_on_user"
  | "resolved"
  | "closed"
  | "all";

/**
 * The statuses a desk tab lists.
 *
 * @param tab - The tab.
 * @returns The statuses, or undefined for every status.
 */
export function statusesForTab(tab: DeskTab): TicketStatus[] | undefined {
  if (tab === "all") return undefined;
  if (tab === "active") return ["open", "in_progress", "waiting_on_user"];
  return [tab];
}

/** The requester's list filter on "Contact Talim support". */
export type MineTab = "active" | "resolved" | "closed" | "all";

/**
 * The statuses a requester's tab lists.
 *
 * @param tab - The tab.
 * @returns The statuses, or undefined for every status.
 */
export function statusesForMineTab(tab: MineTab): TicketStatus[] | undefined {
  if (tab === "all") return undefined;
  if (tab === "active") return ["open", "in_progress", "waiting_on_user"];
  return [tab];
}

/** What to tell the user for each 409 sub-code, from the desk's side and the requester's. */
const CONFLICT_MESSAGES: Record<TicketConflictCode, string> = {
  TICKET_CLOSED: "This ticket is closed, so it can't take replies or changes.",
  MESSAGE_CAP: "This ticket has reached its 500-message limit. Ask for a new ticket to carry on.",
  INVALID_TRANSITION:
    "That status change isn't allowed from where the ticket stands now. The latest version is loaded.",
  TICKET_ESCALATED:
    "This ticket was escalated to Talim support. Your desk can read it but no longer change it.",
  TICKET_NOT_ESCALATED: "This school ticket hasn't been escalated, so Talim can't act on it yet.",
  TICKET_CHANGED:
    "Someone else changed this ticket while you were working on it. The latest version is loaded: check it and try again.",
  TICKET_ALREADY_TALIM: "This ticket is already with Talim support.",
  REOPEN_WINDOW_PASSED:
    "A resolved ticket can only be reopened within 7 days. Raise a new ticket instead.",
};

/**
 * The 409 sub-code of a failed ticket write, if it is one.
 *
 * @param error - What the write threw.
 * @returns The sub-code, or null for anything else.
 */
export function ticketConflictCode(error: unknown): TicketConflictCode | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const code = error.meta?.code;
  return typeof code === "string" && code in CONFLICT_MESSAGES
    ? (code as TicketConflictCode)
    : null;
}

/**
 * What to tell the user about a failed ticket write: the 409's own words per
 * sub-code, else the API's message.
 *
 * @param error - What the write threw.
 * @param fallback - Used when the error says nothing useful.
 * @returns The message.
 */
export function ticketErrorMessage(
  error: unknown,
  fallback = "That didn't work. Try again."
): string {
  const code = ticketConflictCode(error);
  if (code) return CONFLICT_MESSAGES[code];
  if (error instanceof ApiError && error.status === 409)
    return error.message || CONFLICT_MESSAGES.TICKET_CHANGED;
  return getErrorMessage(error, fallback);
}

/**
 * Whether a failed write means the ticket on screen is out of date and must
 * be read again (every 409 does: it was closed, escalated, capped or
 * changed meanwhile).
 *
 * @param error - What the write threw.
 * @returns True when the ticket should be refetched.
 */
export function shouldRefetchAfter(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 409 || error.status === 404);
}

/**
 * Checks a message before sending.
 *
 * @param body - The text.
 * @returns A message, or null when it can be sent.
 */
export function validateMessageBody(body: string): string | null {
  const length = body.trim().length;
  if (length === 0) return "Write a message first.";
  if (length > TICKET_LIMITS.bodyMax)
    return `Keep it to ${TICKET_LIMITS.bodyMax} characters or fewer.`;
  return null;
}

/**
 * Checks a new ticket's subject.
 *
 * @param subject - The subject.
 * @returns A message, or null when it is fine.
 */
export function validateSubject(subject: string): string | null {
  const length = subject.trim().length;
  if (length < TICKET_LIMITS.subjectMin)
    return `Give it a subject of at least ${TICKET_LIMITS.subjectMin} characters.`;
  if (length > TICKET_LIMITS.subjectMax)
    return `Keep the subject to ${TICKET_LIMITS.subjectMax} characters or fewer.`;
  return null;
}

/**
 * Checks an escalation note.
 *
 * @param note - Why it goes to Talim.
 * @returns A message, or null when it is fine.
 */
export function validateEscalationNote(note: string): string | null {
  const length = note.trim().length;
  if (length === 0) return "Say why this needs Talim support.";
  if (length > TICKET_LIMITS.noteMax)
    return `Keep the note to ${TICKET_LIMITS.noteMax} characters or fewer.`;
  return null;
}

/**
 * Which chosen files can be attached: at most the per-message limit in
 * total, each within the size limit.
 *
 * @param files - The files chosen now.
 * @param alreadyAttached - How many are attached already.
 * @returns The files to keep and a message about the ones left out.
 */
export function acceptAttachments(
  files: readonly File[],
  alreadyAttached: number
): { accepted: File[]; problem: string | null } {
  const room = Math.max(0, TICKET_LIMITS.attachmentsPerMessage - alreadyAttached);
  const sized = files.filter((f) => f.size <= TICKET_LIMITS.attachmentMaxBytes);
  const accepted = sized.slice(0, room);
  let problem: string | null = null;
  if (sized.length < files.length) problem = "Files over 25 MB can't be attached.";
  else if (accepted.length < sized.length)
    problem = `Attach up to ${TICKET_LIMITS.attachmentsPerMessage} files per message.`;
  return { accepted, problem };
}

/**
 * A file size as people read it.
 *
 * @param bytes - The size; 0 when unknown.
 * @returns "2.4 MB", "830 KB", or "" when unknown.
 */
export function fileSizeLabel(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Whether an attachment's link is safe to open (https only, as the backend
 * requires).
 *
 * @param attachment - The attachment.
 * @returns True for an https URL.
 */
export function isSafeAttachmentUrl(attachment: Pick<TicketAttachment, "url">): boolean {
  try {
    return new URL(attachment.url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * A date and time as the desk reads it: "6 Oct 2026, 14:05".
 *
 * @param iso - An ISO date.
 * @returns The text, or "" when missing or invalid.
 */
export function formatTicketDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * How long ago something happened, short: "just now", "5 min ago", "3 h ago",
 * "2 d ago", else the date.
 *
 * @param iso - An ISO date.
 * @param now - The current time (for tests).
 * @returns The text.
 */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(then).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Whether the requester can still reopen a resolved ticket.
 *
 * @param ticket - Status and the reopen deadline.
 * @param ticket.status - The status.
 * @param ticket.reopenableUntil - The deadline, while resolved.
 * @param now - The current time (for tests).
 * @returns True while resolved and inside the 7 days.
 */
export function canReopen(
  ticket: { status: TicketStatus; reopenableUntil: string | null },
  now: number = Date.now()
): boolean {
  if (ticket.status !== "resolved" || !ticket.reopenableUntil) return false;
  return new Date(ticket.reopenableUntil).getTime() > now;
}

/** Where a ticket lives in this app: the desk for desk staff, Help for the requester. */
export const SUPPORT_DESK_HREF = "/support";
/** "Help & support": the admin's own tickets to Talim. */
export const HELP_HREF = "/help";

/**
 * The page of a ticket.
 *
 * @param id - The ticket id.
 * @param viewer - Desk staff or the requester.
 * @returns The path.
 */
export function ticketHref(id: string, viewer: TicketViewer): string {
  return viewer === "desk"
    ? `${SUPPORT_DESK_HREF}/${encodeURIComponent(id)}`
    : `${HELP_HREF}/tickets/${encodeURIComponent(id)}`;
}
