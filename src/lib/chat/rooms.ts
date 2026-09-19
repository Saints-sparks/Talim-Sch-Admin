/**
 * Chat room list helpers: one normalizer for `GET /chat/rooms` and
 * `chat-rooms-update`, live updates from `chat-room-activity`, ordering,
 * and the sidebar display shape.
 */
import { ChatRoomType } from "@/types/chat.types";
import type { ChatRoom, ChatRoomLastMessage, Participant } from "@/types/chat.types";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { idOf } from "./messages";

/** `chat-room-activity` payload. */
export interface RoomActivity {
  roomId: string;
  lastMessage: {
    _id?: string;
    senderId: string;
    senderName?: string;
    type?: string;
    preview?: string;
    createdAt: string | Date;
  };
}

/** What the sidebar and chat headers render for a room. */
export interface DisplayChatRoom {
  roomId: string;
  displayName: string;
  type: "private" | "group";
  roomType: string;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: string;
  };
  unreadCount: number;
  participants: Array<{
    userId: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    email?: string;
    userAvatar?: string | null;
    isOnline: boolean;
  }>;
  avatarInfo: {
    type: "image" | "initials";
    value: string;
    bgColor?: string;
  };
  isOnline?: boolean;
  updatedAt: Date;
  /** Groups only. */
  description?: string;
  avatarUrl?: string;
  createdBy?: string;
}

/**
 * Narrows an unknown value to a readable record. Chat payloads arrive from
 * REST and from socket events in several shapes, so every nested read goes
 * through this rather than asserting a type that may not hold.
 *
 * @param value - Any value from a payload.
 * @returns The value as a record, or an empty one.
 */
function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * A payload field that should be text.
 *
 * @param value - Any value from a payload.
 * @returns The string, or `undefined` when it is anything else.
 */
function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function normalizeParticipant(raw: unknown): Participant {
  if (typeof raw === "string" || typeof raw === "number") {
    const id = String(raw);
    return { _id: id, userId: id };
  }
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const user = rec(p.user);
  const populatedUserId = rec(p.userId);
  const id = idOf(p.userId) || idOf(p._id) || idOf(p.id) || idOf(p.user);
  return {
    ...p,
    _id: id,
    userId: id,
    firstName: str(p.firstName ?? user.firstName ?? populatedUserId.firstName),
    lastName: str(p.lastName ?? user.lastName ?? populatedUserId.lastName),
    email: str(p.email ?? user.email ?? populatedUserId.email),
    role: str(p.role ?? user.role ?? populatedUserId.role),
    userAvatar: str(p.userAvatar ?? p.avatar ?? user.userAvatar ?? populatedUserId.userAvatar) ?? null,
    isOnline: Boolean(p.isOnline),
  };
}

function normalizeLastMessage(raw: unknown): ChatRoomLastMessage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const m = raw as Record<string, unknown>;
  if (!m._id && !m.createdAt && !m.timestamp) return undefined;
  const preview =
    typeof m.preview === "string"
      ? m.preview
      : typeof m.content === "string"
        ? m.content
        : typeof m.text === "string"
          ? m.text
          : "";
  return {
    _id: idOf(m._id) || undefined,
    senderId: idOf(m.senderId) || idOf(rec(m.sender)._id),
    senderName: (m.senderName as string) || (rec(m.sender).name as string) || "",
    type: (m.type as ChatRoomLastMessage["type"]) || "text",
    preview,
    content: preview,
    createdAt: (m.createdAt ?? m.timestamp) as string,
  };
}

/** Reads a room from REST or `chat-rooms-update` (`_id` or the `roomId` alias). */
export function normalizeRoom(raw: unknown): ChatRoom {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const room = rec(r.data || r.chatRoom || r.room || r);
  const id = idOf(room._id) || idOf(room.roomId) || idOf(room.id);
  return {
    ...room,
    _id: id,
    roomId: id,
    type: room.type || ChatRoomType.ONE_TO_ONE,
    participants: (Array.isArray(room.participants) ? room.participants : []).map(normalizeParticipant),
    createdBy: idOf(room.createdBy),
    description: typeof room.description === "string" && room.description ? room.description : undefined,
    avatarUrl: typeof room.avatarUrl === "string" && room.avatarUrl ? room.avatarUrl : undefined,
    lastMessage: normalizeLastMessage(room.lastMessage),
    unreadCount: Number(room.unreadCount) || 0,
  } as ChatRoom;
}

/** The time a room last had activity — the sidebar sort key. */
export function roomActivityTime(room: ChatRoom): number {
  const value = room.lastMessage?.createdAt ?? room.lastMessageAt ?? room.updatedAt ?? room.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

/** Newest activity first. */
export function sortRooms(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => roomActivityTime(b) - roomActivityTime(a));
}

/** True when `userId` is one of the room's participants. */
export function isRoomMember(room: ChatRoom, userId: string): boolean {
  return Boolean(userId) && room.participants.some((p) => p.userId === userId);
}

/** For a direct message: the participant who isn't the current user. */
export function otherParticipant(room: ChatRoom, currentUserId: string): Participant | undefined {
  return room.participants.find((p) => p.userId && p.userId !== currentUserId);
}

/**
 * Replaces the room list with a fresh server list. Rooms the user isn't a
 * member of are dropped; the room being viewed keeps an unread count of 0.
 */
export function mergeRoomList(rawRooms: unknown[], currentUserId: string, viewingRoomId: string | null): ChatRoom[] {
  const rooms = rawRooms
    .map(normalizeRoom)
    .filter((room) => room._id && isRoomMember(room, currentUserId))
    .map((room) => (room._id === viewingRoomId ? { ...room, unreadCount: 0 } : room));
  return sortRooms(rooms);
}

function hasProfile(p: Participant): boolean {
  return Boolean(p.firstName || p.lastName || p.email);
}

/**
 * Inserts or replaces one room (after create / add participant / edit), keeping the order.
 * Some endpoints return participants as bare ids; the profiles we already
 * have are kept for those (`participants-changed` brings fresh ones).
 */
export function upsertRoom(rooms: ChatRoom[], room: ChatRoom): ChatRoom[] {
  const existing = rooms.find((r) => r._id === room._id);
  if (!existing) return sortRooms([room, ...rooms]);
  const known = new Map(existing.participants.map((p) => [p.userId, p]));
  const participants = room.participants.map((p) => (hasProfile(p) ? p : known.get(p.userId) ?? p));
  const merged: ChatRoom = {
    ...existing,
    ...room,
    participants,
    // A mutation response has no per-user fields; keep ours.
    unreadCount: existing.unreadCount,
    lastMessage: room.lastMessage ?? existing.lastMessage,
  };
  return sortRooms(rooms.map((r) => (r._id === room._id ? merged : r)));
}

/** Drops a room from the list (I left or was removed). */
export function removeRoom(rooms: ChatRoom[], roomId: string): ChatRoom[] {
  const next = rooms.filter((r) => r._id !== roomId);
  return next.length === rooms.length ? rooms : next;
}

/** `room-updated` payload. `null` / `''` clear description and picture. */
export interface RoomUpdatedEvent {
  roomId: string;
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
  updatedBy?: string;
}

/** Applies `room-updated` to the list (name, description, picture). */
export function applyRoomUpdated(rooms: ChatRoom[], event: RoomUpdatedEvent): ChatRoom[] {
  const roomId = idOf(event?.roomId);
  if (!roomId || !rooms.some((r) => r._id === roomId)) return rooms;
  return rooms.map((r) => {
    if (r._id !== roomId) return r;
    const next: ChatRoom = { ...r };
    if (typeof event.name === "string" && event.name) next.name = event.name;
    if ("description" in event) next.description = event.description || undefined;
    if ("avatarUrl" in event) next.avatarUrl = event.avatarUrl || undefined;
    return next;
  });
}

/** `participants-changed` payload. */
export interface ParticipantsChangedEvent {
  roomId: string;
  added?: string[];
  removed?: string[];
  by?: string;
  participants?: unknown[];
}

/**
 * Applies `participants-changed`. When I'm among `removed`, the room is
 * dropped and `removedMe` is set (leave it if open, tell the user).
 *
 * @returns `known: false` when the room isn't in the list (fetch the list if I was added).
 */
export function applyParticipantsChanged(
  rooms: ChatRoom[],
  event: ParticipantsChangedEvent,
  currentUserId: string
): { rooms: ChatRoom[]; removedMe: boolean; room?: ChatRoom; known: boolean } {
  const roomId = idOf(event?.roomId);
  const room = rooms.find((r) => r._id === roomId);
  const removed = (event?.removed ?? []).map(idOf);
  const removedMe = Boolean(currentUserId) && removed.includes(currentUserId);
  if (!roomId) return { rooms, removedMe: false, known: false };
  if (removedMe) return { rooms: removeRoom(rooms, roomId), removedMe: true, room, known: Boolean(room) };
  if (!room || !Array.isArray(event.participants)) return { rooms, removedMe: false, room, known: Boolean(room) };
  const participants = event.participants.map(normalizeParticipant).filter((p) => p.userId);
  return {
    rooms: rooms.map((r) => (r._id === roomId ? { ...r, participants } : r)),
    removedMe: false,
    room,
    known: true,
  };
}

/** Roles that can manage any group they're in (the server has the final say). */
export const GROUP_MANAGER_ROLES = ["teacher", "school_admin", "school_sub_admin", "admin"];

/** Rooms whose members may leave on their own. */
export const LEAVABLE_ROOM_TYPES: string[] = [ChatRoomType.CUSTOM_GROUP, ChatRoomType.PARENT_GROUP];

/** Whether to show group controls: never for direct messages; managers by role, or the creator. */
export function canManageRoom(
  room: Pick<ChatRoom, "type" | "createdBy"> | null | undefined,
  user: { id: string; role?: string | null }
): boolean {
  if (!room || room.type === ChatRoomType.ONE_TO_ONE) return false;
  if (user.role && GROUP_MANAGER_ROLES.includes(user.role)) return true;
  return Boolean(user.id) && idOf(room.createdBy) === user.id;
}

/** Whether "Leave group" is offered. */
export function canLeaveRoom(room: Pick<ChatRoom, "type"> | null | undefined): boolean {
  return Boolean(room) && LEAVABLE_ROOM_TYPES.includes(room!.type);
}

/**
 * Applies `chat-room-activity` to the room list: new preview and time, the
 * room moves up, and its unread count grows by one when the message is from
 * someone else and the room isn't being viewed.
 *
 * @returns `known: false` when the room isn't in the list yet (fetch the list).
 */
export function applyRoomActivity(
  rooms: ChatRoom[],
  activity: RoomActivity,
  options: { currentUserId: string; viewingRoomId: string | null }
): { rooms: ChatRoom[]; known: boolean } {
  const roomId = idOf(activity?.roomId);
  const incoming = activity?.lastMessage;
  const index = rooms.findIndex((r) => r._id === roomId);
  if (!roomId || !incoming || index === -1) return { rooms, known: index !== -1 };

  const room = rooms[index];
  const messageId = idOf(incoming._id);
  const alreadyApplied = Boolean(messageId) && room.lastMessage?._id === messageId;
  const current = room.lastMessage?.createdAt ? new Date(room.lastMessage.createdAt).getTime() : 0;
  const incomingTime = new Date(incoming.createdAt).getTime();
  const isNewer = !alreadyApplied && (Number.isNaN(incomingTime) || incomingTime >= current);

  const fromMe = idOf(incoming.senderId) === options.currentUserId;
  const viewing = options.viewingRoomId === roomId;
  const unreadCount = viewing
    ? 0
    : alreadyApplied || fromMe
      ? room.unreadCount ?? 0
      : (room.unreadCount ?? 0) + 1;

  const preview = incoming.preview ?? "";
  const updated: ChatRoom = {
    ...room,
    unreadCount,
    lastMessage: isNewer
      ? {
          _id: messageId || undefined,
          senderId: idOf(incoming.senderId),
          senderName: incoming.senderName ?? "",
          type: incoming.type ?? "text",
          preview,
          content: preview,
          createdAt: incoming.createdAt,
        }
      : room.lastMessage,
  };
  const next = [...rooms];
  next[index] = updated;
  return { rooms: sortRooms(next), known: true };
}

/** Zeroes one room's unread count (the user is looking at it). */
export function clearRoomUnread(rooms: ChatRoom[], roomId: string): ChatRoom[] {
  const room = rooms.find((r) => r._id === roomId);
  if (!room || !room.unreadCount) return rooms;
  return rooms.map((r) => (r._id === roomId ? { ...r, unreadCount: 0 } : r));
}

function participantName(p: Participant): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
}

/** The sidebar / header shape for a room. */
export function toDisplayRoom(room: ChatRoom, currentUserId: string): DisplayChatRoom {
  const isGroup = room.type !== ChatRoomType.ONE_TO_ONE;
  let displayName = room.name || (isGroup ? "Group Chat" : "Chat");
  let isOnline = false;

  if (!isGroup) {
    const other = otherParticipant(room, currentUserId);
    if (other) {
      displayName = participantName(other) || other.email || "User";
      isOnline = Boolean(other.isOnline);
    }
  }

  const last = room.lastMessage;
  const lastTime = last?.createdAt ? new Date(last.createdAt) : undefined;

  return {
    roomId: room._id,
    displayName,
    type: isGroup ? "group" : "private",
    roomType: room.type,
    lastMessage:
      last && lastTime && !Number.isNaN(lastTime.getTime())
        ? {
            content: last.preview,
            senderId: last.senderId,
            senderName: last.senderName,
            timestamp: lastTime,
            type: last.type,
          }
        : undefined,
    unreadCount: room.unreadCount ?? 0,
    participants: room.participants.map((p) => ({
      userId: p.userId,
      name: participantName(p) || p.email || undefined,
      firstName: p.firstName,
      lastName: p.lastName,
      role: p.role,
      email: p.email,
      userAvatar: p.userAvatar,
      isOnline: Boolean(p.isOnline),
    })),
    avatarInfo:
      isGroup && room.avatarUrl
        ? { type: "image", value: room.avatarUrl, bgColor: generateColorFromString(displayName) }
        : {
            type: "initials",
            value: getUserInitials(displayName),
            bgColor: generateColorFromString(displayName),
          },
    isOnline,
    updatedAt: new Date(roomActivityTime(room) || Date.now()),
    description: isGroup ? room.description : undefined,
    avatarUrl: isGroup ? room.avatarUrl : undefined,
    createdBy: room.createdBy || undefined,
  };
}

/** Preview shown for a room whose last message was deleted. */
export const DELETED_PREVIEW = "This message was deleted";

/**
 * A message in `roomId` was deleted: when it is the room's last message, the
 * list previews it as deleted. Returns the same array otherwise.
 *
 * @param rooms - The room list.
 * @param roomId - The room the message was in.
 * @param messageId - The deleted message's `_id`.
 */
export function applyMessageDeletedToRooms(rooms: ChatRoom[], roomId: string, messageId: string): ChatRoom[] {
  const at = rooms.findIndex((r) => r._id === roomId);
  const last = at === -1 ? undefined : rooms[at].lastMessage;
  if (!last || last._id !== messageId || last.preview === DELETED_PREVIEW) return rooms;
  const next = rooms.slice();
  next[at] = { ...rooms[at], lastMessage: { ...last, preview: DELETED_PREVIEW, content: DELETED_PREVIEW } };
  return next;
}
