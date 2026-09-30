/**
 * Which chat room is open on screen right now, and whether anyone is looking.
 * The messages page writes the room; the app-wide chat alerts read it to skip
 * the in-app banner for the room being viewed. The service worker
 * (`public/sw.js`) makes the same decision for browser pushes from the
 * window's URL (`/messages?room=…`) and focus.
 */
import { idOf } from "./messages";

let openRoomId: string | null = null;

/** The room open on the messages page (null when none is). */
export const openChatRoom = {
  /**
   * The open room.
   *
   * @returns Its id, or null.
   */
  get(): string | null {
    return openRoomId;
  },
  /**
   * Records the open room.
   *
   * @param roomId - The room now on screen, or null when none is.
   */
  set(roomId: string | null): void {
    openRoomId = roomId || null;
  },
};

/**
 * The in-app route for a room — the same URL chat pushes carry.
 *
 * @param roomId - The room.
 * @returns `/messages?room=<id>`.
 */
export function chatRoomUrl(roomId: string): string {
  return `/messages?room=${encodeURIComponent(roomId)}`;
}

/**
 * Whether a room is open on the messages page.
 *
 * @param pathname - The current route.
 * @param currentOpenRoomId - The room the messages page has open.
 * @param roomId - The room in question.
 * @returns True when that room is the one on screen.
 */
export function isRoomOpen(pathname: string | null | undefined, currentOpenRoomId: string | null, roomId: string): boolean {
  return Boolean(pathname?.startsWith("/messages")) && Boolean(roomId) && currentOpenRoomId === roomId;
}

/**
 * Whether the page is on screen and has focus: only then is an open room
 * being read. Outside a browser it counts as focused.
 *
 * @param doc - The document (for tests).
 * @returns True when the tab is visible and focused.
 */
export function isPageFocused(doc: Document | undefined = typeof document === "undefined" ? undefined : document): boolean {
  if (!doc) return true;
  return doc.visibilityState === "visible" && (typeof doc.hasFocus !== "function" || doc.hasFocus());
}

/**
 * Whether a `chat-room-activity` event deserves an in-app banner: someone
 * else's message, unless its room is open on screen and focused. The backend
 * sends every message to every member, so the open room must be skipped here.
 *
 * @param input.activity - The socket event.
 * @param input.currentUserId - The signed-in user.
 * @param input.pathname - The current route.
 * @param input.openRoomId - The room the messages page has open.
 * @param input.focused - Whether the page is visible and focused ({@link isPageFocused}); true when omitted.
 * @returns True to show the banner.
 */
export function shouldAlertForActivity(input: {
  activity: { roomId?: unknown; lastMessage?: { senderId?: unknown } } | null | undefined;
  currentUserId: string | null | undefined;
  pathname: string | null | undefined;
  openRoomId: string | null;
  focused?: boolean;
}): boolean {
  const roomId = idOf(input.activity?.roomId);
  const senderId = idOf(input.activity?.lastMessage?.senderId);
  if (!roomId || !senderId || !input.currentUserId) return false;
  if (senderId === input.currentUserId) return false;
  const focused = input.focused ?? true;
  return !(focused && isRoomOpen(input.pathname, input.openRoomId, roomId));
}

/**
 * Turns a URL from the service worker into an in-app path, refusing other
 * origins so a notification can never navigate the app off-site.
 *
 * @param url - The URL the service worker sent.
 * @param origin - This app's origin.
 * @returns The path with its query and hash, or null for another origin or no URL.
 */
export function toInAppPath(url: unknown, origin: string): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
