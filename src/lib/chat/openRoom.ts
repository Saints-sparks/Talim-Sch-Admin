/**
 * Which chat room is open on screen right now. The messages page writes it;
 * the app-wide chat alerts read it to skip toasts for the room being viewed.
 */
import { idOf } from "./messages";

let openRoomId: string | null = null;

export const openChatRoom = {
  get(): string | null {
    return openRoomId;
  },
  set(roomId: string | null): void {
    openRoomId = roomId || null;
  },
};

/** The in-app route for a room — the same URL chat pushes carry. */
export function chatRoomUrl(roomId: string): string {
  return `/messages?room=${encodeURIComponent(roomId)}`;
}

/** True when `roomId` is open on the messages page. */
export function isRoomOpen(pathname: string | null | undefined, currentOpenRoomId: string | null, roomId: string): boolean {
  return Boolean(pathname?.startsWith("/messages")) && Boolean(roomId) && currentOpenRoomId === roomId;
}

/**
 * Whether a `chat-room-activity` event deserves an in-app toast: someone
 * else's message in a room that isn't open on screen.
 */
export function shouldAlertForActivity(input: {
  activity: { roomId?: unknown; lastMessage?: { senderId?: unknown } } | null | undefined;
  currentUserId: string | null | undefined;
  pathname: string | null | undefined;
  openRoomId: string | null;
}): boolean {
  const roomId = idOf(input.activity?.roomId);
  const senderId = idOf(input.activity?.lastMessage?.senderId);
  if (!roomId || !senderId || !input.currentUserId) return false;
  if (senderId === input.currentUserId) return false;
  return !isRoomOpen(input.pathname, input.openRoomId, roomId);
}

/**
 * Turns a URL from the service worker into an in-app path, refusing other
 * origins so a notification can never navigate the app off-site.
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
