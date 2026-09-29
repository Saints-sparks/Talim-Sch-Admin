/**
 * How a signed-in device (Round 4 §34) is described in Settings → Security.
 */
import { formatDistanceStrict } from "date-fns";
import type { AuthSession } from "@/types/round4Contract";

/** Which icon a device gets. */
export type DeviceKind = "phone" | "tablet" | "computer";

/**
 * The row's title: the browser and system, else whatever the server could tell.
 *
 * @param session - A session.
 * @returns e.g. "Chrome 128 on macOS 15", or "Unknown device".
 */
export function sessionTitle(session: AuthSession): string {
  const { browser, os, device } = session;
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || device || "Unknown device";
}

/**
 * The line under the title: the device (when the title doesn't already say
 * it) and the IP address.
 *
 * @param session - A session.
 * @returns e.g. "iPhone · IP 102.89.1.4", or "" when there is nothing to add.
 */
export function sessionDetails(session: AuthSession): string {
  const title = sessionTitle(session);
  const parts = [session.device && session.device !== title ? session.device : null, session.ip ? `IP ${session.ip}` : null];
  return parts.filter(Boolean).join(" · ");
}

/**
 * When the session was last used, in words.
 *
 * @param session - A session.
 * @param now - The current time (for tests).
 * @returns "Active now" within two minutes, else e.g. "Last active 3 hours ago".
 */
export function lastActiveLabel(session: AuthSession, now: Date = new Date()): string {
  const at = new Date(session.lastUsedAt || session.createdAt);
  if (Number.isNaN(at.getTime())) return "Last active: unknown";
  if (now.getTime() - at.getTime() < 2 * 60_000) return "Active now";
  return `Last active ${formatDistanceStrict(at, now, { addSuffix: true })}`;
}

/**
 * The icon for a device.
 *
 * @param session - A session.
 * @returns `phone`, `tablet` or `computer` (the default).
 */
export function deviceKind(session: AuthSession): DeviceKind {
  const text = `${session.device ?? ""} ${session.os ?? ""}`.toLowerCase();
  if (/ipad|tablet/.test(text)) return "tablet";
  if (/iphone|android|mobile|phone|ios/.test(text)) return "phone";
  return "computer";
}
