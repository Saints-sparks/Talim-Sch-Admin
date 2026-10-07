/**
 * Turning a leave request into something a reviewer can scan: the student's
 * name, readable dates, and the status colours for both themes.
 *
 * The API stores the status title-cased (`Pending`) while the filter tabs are
 * lower-case (`pending`); both spellings live here so no component compares
 * raw strings and silently matches nothing.
 */
import type { Tone } from "@/components/tl/styles";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/app/services/leave.service";

/**
 * Label per leave type (B9). Legacy values read as the B9 type the backend
 * maps them to (`Health Issue` → illness, `Family Event`/`Travel` →
 * family or travel, `Fees Issue`/`Emergency`/`Other` → other).
 */
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  illness: "Illness",
  medical: "Medical appointment",
  family_travel: "Family or travel",
  religious: "Religious observance",
  other: "Other",
  "Health Issue": "Illness",
  "Family Event": "Family or travel",
  Travel: "Family or travel",
  "Fees Issue": "Other",
  Emergency: "Other",
  Other: "Other",
};

/**
 * The label for a stored leave type.
 *
 * @param type - `leaveType` as the API sent it.
 * @returns Its label, or the value itself for a type this app does not know.
 */
export function leaveTypeLabel(type: string | undefined): string {
  if (!type) return "-";
  return (LEAVE_TYPE_LABELS as Record<string, string>)[type] ?? type;
}

/** The filter tabs above the queue. */
export const LEAVE_FILTERS = ["all", "pending", "approved", "rejected"] as const;

/** One of the filter tabs. */
export type LeaveFilter = (typeof LEAVE_FILTERS)[number];

/** A status as the filters spell it. */
export type LeaveStatusKey = "pending" | "approved" | "rejected";

/** The pill tone per status (cards and the detail header). */
export const STATUS_TONE: Record<LeaveStatusKey, Tone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/** Filled badge per status, for the detail header. */
export const STATUS_BADGE: Record<LeaveStatusKey, string> = {
  pending: "bg-tl-warning-bg text-tl-warning",
  approved: "bg-tl-success-bg text-tl-success",
  rejected: "bg-tl-danger-bg text-tl-danger",
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
  const counts: Record<LeaveFilter, number> = {
    all: requests.length,
    pending: 0,
    approved: 0,
    rejected: 0,
  };
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
    return `${studentName(request)} ${request.leaveType} ${leaveTypeLabel(request.leaveType)} ${request.reason ?? ""}`
      .toLowerCase()
      .includes(query);
  });
}
