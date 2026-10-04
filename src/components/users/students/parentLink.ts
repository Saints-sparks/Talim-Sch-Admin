/**
 * Parent links (A11): the pure rules behind the link-code card on the student
 * profile and the notice after creating a student whose parent already had an
 * account.
 */
import type { CreatedStudent } from "@/app/services/student.service";

/** What the profile says when a student was linked to an existing parent account. */
export const EXISTING_PARENT_NOTICE = "Linked to an existing parent account";

/**
 * The notice to show after creating a student, when the API says the parent
 * email already belonged to a parent account and the child was linked to it.
 *
 * @param created - What `POST /students` answered.
 * @returns The notice (with the parent's name when sent), or null for a new parent or an API that does not say.
 */
export function parentLinkNotice(created: CreatedStudent | null | undefined): string | null {
  const link = created?.parentLink;
  if (!link?.existing) return null;
  const name = link.parentName?.trim();
  return name ? `${EXISTING_PARENT_NOTICE} (${name})` : EXISTING_PARENT_NOTICE;
}

/**
 * When a link code stops working, for the card.
 *
 * @param expiresAt - ISO date-time from the API.
 * @param now - The current time (injected for tests).
 * @returns e.g. "Expires 17 Oct 2026, 09:30 (in 14 days)", or "Expired" once past.
 */
export function linkCodeExpiry(expiresAt: string, now: Date = new Date()): string {
  const at = new Date(expiresAt);
  if (Number.isNaN(at.getTime())) return "";
  const msLeft = at.getTime() - now.getTime();
  if (msLeft <= 0) return "Expired. Generate a new code.";
  const when = at.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const days = Math.floor(msLeft / 86_400_000);
  const left = days >= 1 ? `in ${days} day${days === 1 ? "" : "s"}` : "today";
  return `Expires ${when} (${left})`;
}
