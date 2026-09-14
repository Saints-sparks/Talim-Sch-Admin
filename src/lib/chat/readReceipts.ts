/**
 * Read model: which message to mark read (`mark-room-read`), applying
 * `messages-read` to a thread, and the tick state of own messages.
 */
import type { ChatMessage } from "@/types/chat.types";
import { idOf, isLocalMessage } from "./messages";

/** `messages-read` / `room-read` payload. */
export interface ReadEvent {
  roomId: string;
  userId: string;
  upToMessageId?: string;
  readAt: string | Date;
}

/** The last `mark-room-read` sent for a room. */
export interface ReadMarker {
  messageId: string;
  createdAt: number;
}

function timeOf(value: Date | string | undefined): number {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * The newest stored message from someone else — what `mark-room-read`
 * should acknowledge — or `null` when there is nothing new since `lastSent`.
 *
 * @param messages - The thread, oldest first.
 * @param currentUserId - Me.
 * @param lastSent - The marker already sent for this room, if any.
 */
export function nextReadMarker(
  messages: ChatMessage[],
  currentUserId: string,
  lastSent?: ReadMarker | null
): ReadMarker | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (isLocalMessage(m) || !m._id || !m.senderId || m.senderId === currentUserId) continue;
    const candidate = { messageId: m._id, createdAt: timeOf(m.createdAt) };
    if (!lastSent) return candidate;
    if (candidate.messageId === lastSent.messageId) return null;
    if (candidate.createdAt < lastSent.createdAt) return null;
    if (candidate.createdAt === lastSent.createdAt && candidate.messageId <= lastSent.messageId) return null;
    return candidate;
  }
  return null;
}

/**
 * Applies `messages-read`: `userId` joins `readBy` on every message from
 * another sender created at or before `readAt`. Returns `messages` itself
 * when nothing changed.
 */
export function applyMessagesRead(messages: ChatMessage[], event: Pick<ReadEvent, "userId" | "readAt">): ChatMessage[] {
  const userId = idOf(event.userId);
  const readAt = timeOf(event.readAt);
  if (!userId || !readAt) return messages;
  let changed = false;
  const next = messages.map((m) => {
    if (isLocalMessage(m) || m.senderId === userId || m.readBy.includes(userId)) return m;
    if (timeOf(m.createdAt) > readAt) return m;
    changed = true;
    return { ...m, readBy: [...m.readBy, userId] };
  });
  return changed ? next : messages;
}

/** Tick state of a message: pending (clock), failed, sent (one tick), read (two ticks). */
export type DeliveryState = "pending" | "failed" | "sent" | "read";

/**
 * Tick state for an own message. In a direct message it is read once the
 * other person is in `readBy`; in groups once anyone else is.
 */
export function deliveryState(
  message: Pick<ChatMessage, "status" | "readBy" | "senderId">,
  otherUserId?: string
): DeliveryState {
  if (message.status === "pending") return "pending";
  if (message.status === "failed") return "failed";
  if (otherUserId) return message.readBy.includes(otherUserId) ? "read" : "sent";
  return readByCount(message) > 0 ? "read" : "sent";
}

/** How many people other than the sender have read a message. */
export function readByCount(message: Pick<ChatMessage, "readBy" | "senderId">): number {
  return new Set(message.readBy.filter((id) => id && id !== message.senderId)).size;
}

/** The `_id` of my newest stored message (where a group shows "Read by N"). */
export function latestOwnStoredMessageId(messages: ChatMessage[], currentUserId: string): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.senderId === currentUserId && !isLocalMessage(m) && m._id) return m._id;
  }
  return null;
}
