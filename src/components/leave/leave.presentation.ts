/**
 * Turning a leave request into something a reviewer can scan: the student's
 * name, readable dates, and the status colours for both themes.
 *
 * The API stores the status title-cased (`Pending`) while the filter tabs are
 * lower-case (`pending`); both spellings live here so no component compares
 * raw strings and silently matches nothing.
 */
import type { LeaveRequest, LeaveStatus } from "@/app/services/leave.service";

/** The filter tabs above the queue. */
export const LEAVE_FILTERS = ["all", "pending", "approved", "rejected"] as const;

/** One of the filter tabs. */
export type LeaveFilter = (typeof LEAVE_FILTERS)[number];

/** A status as the filters spell it. */
export type LeaveStatusKey = "pending" | "approved" | "rejected";

/** Text colour per status, for the badge on a card. */
export const STATUS_TEXT: Record<LeaveStatusKey, string> = {
  pending: "text-[#B07800] dark:text-amber-400",
  approved: "text-[#2E8B57] dark:text-emerald-400",
  rejected: "text-red-600 dark:text-red-400",
};

/** Filled badge per status, for the detail header. */
export const STATUS_BADGE: Record<LeaveStatusKey, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

/**
 * Normalises a stored status onto the key the filters and colour maps use.
 *
 * @param status - Status as the API returned it.
 * @returns The lower-case key; anything unrecognised counts as pending, which
 *   is the state that still needs a decision.
 */
export function statusKey(status: string | undefined): LeaveStatusKey {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  return "pending";
}

/**
 * The API value for a decision, title-cased the way `LeaveStatus` is.
 *
 * @param key - The decision the reviewer made.
 * @returns The status to send.
 */
export function statusValue(key: "approved" | "rejected"): LeaveStatus {
  return key === "approved" ? "Approved" : "Rejected";
}

/**
 * The student's display name.
 *
 * `studentUser` is null when the student record has been removed, and some
 * accounts have no name yet — fall back to the email local part rather than
 * rendering "undefined undefined".
 *
 * @param request - The leave request.
 * @returns A name to show.
 */
export function studentName(request: LeaveRequest): string {
  const user = request.studentUser;
  if (!user) return "Unknown student";

  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.email) return user.email.split("@")[0];
  return "Unknown student";
}

/** Shown when a student has no avatar, or theirs fails to load. */
export const FALLBACK_AVATAR = "/img/default-avatar.png";

/**
 * The student's avatar, or the shared placeholder.
 *
 * @param request - The leave request.
 * @returns An image URL.
 */
export function studentAvatar(request: LeaveRequest): string {
  return request.studentUser?.userAvatar || FALLBACK_AVATAR;
}

/**
 * Formats a date for display, e.g. `04 Sep 2026`.
 *
 * @param value - ISO date string.
 * @returns The formatted date, or `-` when it is missing or unparseable.
 */
export function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * How many requests sit in each status, for the filter tab counts.
 *
 * @param requests - The whole queue.
 * @returns A count per filter, including `all`.
 */
export function countByStatus(requests: LeaveRequest[]): Record<LeaveFilter, number> {
  const counts: Record<LeaveFilter, number> = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
  for (const request of requests) counts[statusKey(request.status)] += 1;
  return counts;
}

/**
 * Applies the active tab and the search box to the queue.
 *
 * @param requests - The whole queue.
 * @param filter - The active status tab.
 * @param search - What the reviewer typed; matched against the student's name,
 *   the leave type and the reason.
 * @returns The requests to render.
 */
export function filterLeaveRequests(
  requests: LeaveRequest[],
  filter: LeaveFilter,
  search: string
): LeaveRequest[] {
  const query = search.trim().toLowerCase();

  return requests.filter((request) => {
    if (filter !== "all" && statusKey(request.status) !== filter) return false;
    if (!query) return true;
    return `${studentName(request)} ${request.leaveType} ${request.reason ?? ""}`
      .toLowerCase()
      .includes(query);
  });
}
