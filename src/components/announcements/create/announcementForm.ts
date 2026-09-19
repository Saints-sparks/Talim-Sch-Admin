import type { Announcement, AnnouncementAudience } from "@/app/services/announcement.service";

/** Largest attachment the file service accepts. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Longest title the form accepts. */
export const TITLE_MAX = 100;
/** Longest body the form accepts. */
export const CONTENT_MAX = 2000;

/** Whether the announcement goes out now or at a chosen time. */
export type Schedule = "now" | "later";

/** The create-announcement form as typed. */
export interface AnnouncementForm {
  title: string;
  content: string;
  attachment?: string;
  audience: AnnouncementAudience[];
  schedule: Schedule;
  /** `datetime-local` value, converted to ISO before sending. */
  scheduledFor: string;
  preview: boolean;
}

/** A blank form: parents as the audience, published immediately. */
export const emptyForm: AnnouncementForm = {
  title: "",
  content: "",
  attachment: undefined,
  audience: ["all_parents"],
  schedule: "now",
  scheduledFor: "",
  preview: false,
};

/**
 * Ticks or unticks an audience. The last audience cannot be unticked: an
 * announcement always has at least one.
 *
 * @param current - The audiences chosen so far.
 * @param audience - The one that was clicked.
 * @returns The next selection (never empty).
 */
export function toggleAudience(
  current: AnnouncementAudience[],
  audience: AnnouncementAudience,
): AnnouncementAudience[] {
  const next = current.includes(audience)
    ? current.filter((item) => item !== audience)
    : [...current, audience];
  return next.length ? next : [audience];
}

/**
 * Checks the form before anything is sent, so the API's 400 is never the first
 * thing the user hears about.
 *
 * @param form - The form as typed.
 * @param now - Current time in ms, for tests.
 * @returns The first problem to show, or `null` when the form can be sent.
 */
export function validateAnnouncement(form: AnnouncementForm, now: number = Date.now()): string | null {
  if (!form.title.trim() || !form.content.trim()) return "Title and content are required.";
  if (form.schedule === "later") {
    if (!form.scheduledFor) return "Choose a date and time for scheduled announcements.";
    if (new Date(form.scheduledFor).getTime() <= now) {
      return "Scheduled announcements must be set for a future time.";
    }
  }
  return null;
}

/**
 * Builds the create request from a validated form.
 *
 * @param form - The validated form.
 * @returns The payload: text trimmed, `SCHEDULED` with an ISO instant for a
 *   later send and `PUBLISHED` otherwise.
 */
export function toAnnouncementPayload(form: AnnouncementForm): Announcement {
  const later = form.schedule === "later";
  return {
    title: form.title.trim(),
    content: form.content.trim(),
    attachment: form.attachment,
    attachments: form.attachment ? [form.attachment] : undefined,
    audience: form.audience,
    status: later ? "SCHEDULED" : "PUBLISHED",
    scheduledFor: later ? new Date(form.scheduledFor).toISOString() : undefined,
  };
}
