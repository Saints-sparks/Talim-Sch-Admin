/**
 * The one place chat messages are read and merged.
 *
 * Every channel (REST history, `chat-room-joined`, `messages-update`,
 * `chat-message`, the `send-chat-message` ack) goes through
 * {@link normalizeMessage}, and every thread is updated with
 * {@link mergeMessages}, so a message is never shown twice and a pending
 * bubble is replaced by the stored message it became.
 */
import type { ChatAttachment, ChatMessage } from "@/types/chat.types";

/** Extracts an id from a string, number, ObjectId-like or populated object. */
export function idOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const obj = value as { _id?: unknown; id?: unknown; userId?: unknown; toHexString?: () => string };
    const nested = obj._id ?? obj.id ?? obj.userId;
    if (nested !== undefined && nested !== value) return idOf(nested);
    if (typeof obj.toHexString === "function") return obj.toHexString();
  }
  return "";
}

/** A new id for an outgoing message (≤ 64 chars, as the server requires). */
export function createClientMessageId(): string {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  const random = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random()}-${random()}`;
}

/** The local `_id` of a pending bubble. */
export function pendingMessageId(clientMessageId: string): string {
  return `pending:${clientMessageId}`;
}

/** True for a bubble that only exists in this browser (not yet stored). */
export function isLocalMessage(message: Pick<ChatMessage, "status">): boolean {
  return message.status === "pending" || message.status === "failed";
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic|svg)(\?|$)/i;
const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|webm)(\?|$)/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|avi|mkv)(\?|$)/i;

function attachmentTypeOf(url: string, mimeType?: string): string {
  if (mimeType?.startsWith("image/") || IMAGE_EXT.test(url)) return "image";
  if (mimeType?.startsWith("audio/") || AUDIO_EXT.test(url)) return "audio";
  if (mimeType?.startsWith("video/") || VIDEO_EXT.test(url)) return "video";
  return "file";
}

function toNumber(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

/** Attachments are objects on the current API; plain URL strings are converted. */
export function normalizeAttachment(raw: unknown): ChatAttachment | null {
  if (typeof raw === "string") {
    if (!raw) return null;
    const name = decodeURIComponent(raw.split("?")[0].split("/").pop() || "");
    return { url: raw, type: attachmentTypeOf(raw), name };
  }
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const url = typeof a.url === "string" ? a.url : "";
  const mimeType = typeof a.mimeType === "string" ? a.mimeType : undefined;
  return {
    url,
    type: typeof a.type === "string" && a.type ? a.type : attachmentTypeOf(url, mimeType),
    name: typeof a.name === "string" ? a.name : "",
    mimeType,
    size: toNumber(a.size),
    duration: toNumber(a.duration),
    width: toNumber(a.width),
    height: toNumber(a.height),
  };
}

/** The message type, inferred from attachments when missing or `text` (as the server does). */
export function inferMessageType(type: unknown, attachments: ChatAttachment[]): string {
  const given = typeof type === "string" ? type : "";
  if (given === "audio") return "voice";
  if (given && given !== "text") return given;
  if (attachments.length === 0) return "text";
  const first = attachments[0].type;
  if (first === "audio") return "voice";
  if (first === "image") return "image";
  return "file";
}

function toDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

/**
 * Reads a message from any channel into the UI shape. Canonical fields
 * (`text`, `createdAt`, `senderId` string or `sender._id`, attachment
 * objects, `type`) win; the deprecated aliases are only fallbacks.
 *
 * @param raw - A `MessageView` (or an older payload).
 * @param fallbackRoomId - Room to assume when the payload doesn't say.
 */
export function normalizeMessage(raw: unknown, fallbackRoomId = ""): ChatMessage {
  const m = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const sender = m.sender && typeof m.sender === "object" ? m.sender : undefined;
  const populated = m.senderId && typeof m.senderId === "object" ? m.senderId : undefined;

  const attachments = (Array.isArray(m.attachments) ? m.attachments : [])
    .map(normalizeAttachment)
    .filter((a: ChatAttachment | null): a is ChatAttachment => a !== null);
  const type = inferMessageType(m.type, attachments);
  const duration =
    toNumber(m.duration) ?? (type === "voice" ? attachments.find((a) => a.type === "audio")?.duration : undefined);
  if (type === "voice" && duration !== undefined && attachments[0] && attachments[0].duration === undefined) {
    attachments[0] = { ...attachments[0], duration };
  }

  const populatedName = populated
    ? `${populated.firstName ?? ""} ${populated.lastName ?? ""}`.trim()
    : "";
  const serverName = typeof sender?.name === "string" && sender.name !== "Unknown" ? sender.name : "";
  const aliasName = typeof m.senderName === "string" && m.senderName !== "Unknown" ? m.senderName : "";
  const text = typeof m.text === "string" ? m.text : typeof m.content === "string" ? m.content : "";
  const createdAt = toDate(m.createdAt ?? m.timestamp);

  return {
    _id: idOf(m._id) || idOf(m.id),
    clientMessageId: typeof m.clientMessageId === "string" ? m.clientMessageId : undefined,
    senderId: idOf(m.senderId) || idOf(sender?._id),
    senderName: serverName || aliasName || populatedName,
    senderAvatar: sender?.avatar || m.senderAvatar || populated?.userAvatar || undefined,
    content: text,
    roomId: idOf(m.roomId) || idOf(m.chatRoomId) || fallbackRoomId,
    isRead: Boolean(m.isRead),
    readBy: (Array.isArray(m.readBy) ? m.readBy : []).map(idOf).filter(Boolean),
    type,
    duration,
    attachments,
    createdAt,
    updatedAt: toDate(m.updatedAt ?? m.createdAt ?? m.timestamp),
    status: m.status === "pending" || m.status === "failed" ? m.status : undefined,
    error: typeof m.error === "string" ? m.error : undefined,
  };
}

function compareMessages(a: ChatMessage, b: ChatMessage): number {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (diff !== 0) return diff;
  return a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
}

/**
 * Merges messages into a thread: one entry per `_id`, sorted oldest first.
 * A stored message replaces the pending bubble with the same
 * `clientMessageId`; a late local update never overwrites a stored message.
 *
 * @param existing - The thread as it is.
 * @param incoming - Messages from any channel, in any order.
 * @returns A new array (or `existing` when nothing changed).
 */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return existing;
  const byId = new Map<string, ChatMessage>();
  const idByClientId = new Map<string, string>();
  for (const message of existing) {
    byId.set(message._id, message);
    if (message.clientMessageId) idByClientId.set(message.clientMessageId, message._id);
  }

  for (const message of incoming) {
    if (!message._id) continue;
    if (message.clientMessageId) {
      const knownId = idByClientId.get(message.clientMessageId);
      if (knownId && knownId !== message._id) {
        const known = byId.get(knownId);
        // A pending/failed bubble arriving after its stored message is stale.
        if (known && isLocalMessage(message) && !isLocalMessage(known)) continue;
        byId.delete(knownId);
      }
      idByClientId.set(message.clientMessageId, message._id);
    }
    const previous = byId.get(message._id);
    byId.set(message._id, previous ? { ...previous, ...message } : message);
  }

  return Array.from(byId.values()).sort(compareMessages);
}

/** Marks a still-local bubble as failed. Stored messages are left alone. */
export function markMessageFailed(messages: ChatMessage[], clientMessageId: string, error: string): ChatMessage[] {
  let changed = false;
  const next = messages.map((m) => {
    if (m.clientMessageId !== clientMessageId || !isLocalMessage(m)) return m;
    changed = true;
    return { ...m, status: "failed" as const, error };
  });
  return changed ? next : messages;
}

/** Puts a failed bubble back into the pending state (before a retry). */
export function markMessagePending(messages: ChatMessage[], clientMessageId: string): ChatMessage[] {
  let changed = false;
  const next = messages.map((m) => {
    if (m.clientMessageId !== clientMessageId || m.status !== "failed") return m;
    changed = true;
    return { ...m, status: "pending" as const, error: undefined };
  });
  return changed ? next : messages;
}

/** Removes a local bubble (Delete on a failed send). */
export function removeLocalMessage(messages: ChatMessage[], clientMessageId: string): ChatMessage[] {
  const next = messages.filter((m) => !(m.clientMessageId === clientMessageId && isLocalMessage(m)));
  return next.length === messages.length ? messages : next;
}

/** True once the stored message for `clientMessageId` is in the thread. */
export function isDelivered(messages: ChatMessage[], clientMessageId: string): boolean {
  return messages.some((m) => m.clientMessageId === clientMessageId && !isLocalMessage(m));
}

/** The newest stored message id — the cursor to backfill from after a reconnect. */
export function newestStoredMessageId(messages: ChatMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!isLocalMessage(messages[i]) && messages[i]._id) return messages[i]._id;
  }
  return undefined;
}

/**
 * Builds the pending bubble shown while a message is uploading / sending.
 */
export function buildPendingMessage(input: {
  clientMessageId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: string;
  attachments?: ChatAttachment[];
  duration?: number;
  now?: Date;
}): ChatMessage {
  const now = input.now ?? new Date();
  return {
    _id: pendingMessageId(input.clientMessageId),
    clientMessageId: input.clientMessageId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderAvatar: input.senderAvatar,
    content: input.text,
    roomId: input.roomId,
    isRead: false,
    readBy: [],
    type: input.type,
    duration: input.duration,
    attachments: input.attachments ?? [],
    createdAt: now,
    updatedAt: now,
    status: "pending",
  };
}

/** True when a scroll container is within `threshold` px of its bottom. */
export function isNearBottom(
  el: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
  threshold = 120
): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}
