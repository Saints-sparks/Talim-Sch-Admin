/**
 * Everything the announcements screen needs to turn an API announcement into
 * something readable: the tab-to-status mapping, audience labels, and the
 * badge colours for both themes.
 *
 * The API stores audiences as the backend enum (`all_parents`); the UI shows
 * "All Parents". Both directions live here so no component invents its own
 * spelling of an audience and sends the API a value it rejects.
 */
import type {
  AnnouncementAudience,
  AnnouncementStatus,
  CreateAnnouncementResponse,
} from "@/app/services/announcement.service";

/** The list tabs, in the order they are shown. */
export const ANNOUNCEMENT_TABS = ["Published", "Scheduled", "Drafts", "Archived"] as const;

/** One of the list tabs. */
export type AnnouncementTab = (typeof ANNOUNCEMENT_TABS)[number];

/** Which stored status each tab asks the API for. */
export const TAB_STATUS: Record<AnnouncementTab, AnnouncementStatus> = {
  Published: "PUBLISHED",
  Scheduled: "SCHEDULED",
  Drafts: "DRAFT",
  Archived: "ARCHIVED",
};

/** Status as shown on a row. */
export type AnnouncementStatusLabel = "Published" | "Scheduled" | "Draft" | "Archived";

/**
 * The three broadcast audiences an administrator can pick.
 *
 * The backend also accepts `custom`, but only alongside an explicit list of
 * user ids — there is no recipient picker on this screen, so offering it
 * would only ever produce a 400.
 */
export const AUDIENCE_OPTIONS: ReadonlyArray<{ value: AnnouncementAudience; label: string }> = [
  { value: "all_parents", label: "All Parents" },
  { value: "all_students", label: "All Students" },
  { value: "all_teachers", label: "All Teachers" },
];

const AUDIENCE_LABELS: Record<string, string> = {
  all_parents: "All Parents",
  parents: "All Parents",
  all_students: "All Students",
  students: "All Students",
  all_teachers: "All Teachers",
  teachers: "All Teachers",
  custom: "Selected people",
};

/** Badge colours per audience label, light and dark. */
export const AUDIENCE_STYLES: Record<string, string> = {
  "All Parents":
    "bg-blue-50 text-[#003366] border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "All Students":
    "bg-blue-50 text-[#003366] border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "All Teachers":
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  "Selected people":
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
};

/** Badge colours per status, light and dark. */
export const STATUS_STYLES: Record<AnnouncementStatusLabel, string> = {
  Published:
    "bg-blue-50 text-[#003366] border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  Scheduled:
    "bg-blue-50 text-[#003366] border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  Draft:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  Archived:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600",
};

/** One announcement, ready to render. */
export interface DashboardAnnouncement {
  id: string;
  title: string;
  content: string;
  audience: string[];
  status: AnnouncementStatusLabel;
  publishDate: string | null;
  readRate: number;
  pinned: boolean;
  hasAttachment: boolean;
}

/**
 * Turns a stored status into its display label.
 *
 * @param status - Status as the API returned it, in any casing.
 * @returns The label to show on the row.
 */
export function statusLabel(status?: string): AnnouncementStatusLabel {
  switch (status?.toUpperCase()) {
    case "SCHEDULED":
      return "Scheduled";
    case "DRAFT":
      return "Draft";
    case "ARCHIVED":
      return "Archived";
    default:
      return "Published";
  }
}

/**
 * Turns stored audience values into display labels.
 *
 * @param audience - Audience values as the API returned them.
 * @returns One label per audience; `["All Parents"]` when the list is empty,
 *   which is what the API itself defaults to.
 */
export function audienceLabels(audience?: string[]): string[] {
  const labels = (audience ?? [])
    .map((item) => AUDIENCE_LABELS[item.trim().toLowerCase().replace(/\s+/g, "_")])
    .filter((label): label is string => Boolean(label));

  return labels.length ? Array.from(new Set(labels)) : ["All Parents"];
}

/**
 * Formats a timestamp for the list, e.g. `04 Sep 2026, 14:30`.
 *
 * @param value - ISO timestamp, or null when there is no date yet.
 * @returns The formatted date, or `-`.
 */
export function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Holds a percentage inside 0–100 so a bad number from the API cannot draw a
 * progress bar past the end of its track.
 *
 * @param value - A percentage.
 * @returns The value clamped to 0–100.
 */
export function clampPercent(value: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
}

/**
 * Maps one API announcement onto the row model the table renders.
 *
 * @param announcement - The announcement as the API returned it.
 * @returns The row model.
 */
export function toDashboardAnnouncement(
  announcement: CreateAnnouncementResponse
): DashboardAnnouncement {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    audience: audienceLabels(announcement.audience),
    status: statusLabel(announcement.status),
    publishDate: announcement.publishedAt ?? announcement.scheduledFor ?? announcement.createdAt,
    readRate: clampPercent(announcement.readRate ?? 0),
    pinned: announcement.isPinned ?? false,
    hasAttachment: announcement.hasAttachment ?? Boolean(announcement.attachments?.length),
  };
}
