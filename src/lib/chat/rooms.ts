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
}

function normalizeParticipant(raw: unknown): Participant {
  if (typeof raw === "string" || typeof raw === "number") {
    const id = String(raw);
    return { _id: id, userId: id };
  }
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const user = p.user && typeof p.user === "object" ? p.user : {};
  const populatedUserId = p.userId && typeof p.userId === "object" ? p.userId : {};
  const id = idOf(p.userId) || idOf(p._id) || idOf(p.id) || idOf(p.user);
  return {
    ...p,
    _id: id,
    userId: id,
    firstName: p.firstName ?? user.firstName ?? populatedUserId.firstName,
    lastName: p.lastName ?? user.lastName ?? populatedUserId.lastName,
    email: p.email ?? user.email ?? populatedUserId.email,
    role: p.role ?? user.role ?? populatedUserId.role,
    userAvatar: p.userAvatar ?? p.avatar ?? user.userAvatar ?? populatedUserId.userAvatar ?? null,
    isOnline: Boolean(p.isOnline),
  };
}

function normalizeLastMessage(raw: unknown): ChatRoomLastMessage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const m = raw as Record<string, any>;
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
    senderId: idOf(m.senderId) || idOf(m.sender?._id),
    senderName: m.senderName || m.sender?.name || "",
    type: m.type || "text",
    preview,
    content: preview,
    createdAt: m.createdAt ?? m.timestamp,
  };
}

/** Reads a room from REST or `chat-rooms-update` (`_id` or the `roomId` alias). */
export function normalizeRoom(raw: unknown): ChatRoom {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const room = r.data || r.chatRoom || r.room || r;
  const id = idOf(room._id) || idOf(room.roomId) || idOf(room.id);
  return {
    ...room,
    _id: id,
    roomId: id,
    type: room.type || ChatRoomType.ONE_TO_ONE,
    participants: (Array.isArray(room.participants) ? room.participants : []).map(normalizeParticipant),
    createdBy: idOf(room.createdBy),
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

/** Inserts or replaces one room (after create / add participant), keeping the order. */
export function upsertRoom(rooms: ChatRoom[], room: ChatRoom): ChatRoom[] {
  const exists = rooms.some((r) => r._id === room._id);
  const next = exists ? rooms.map((r) => (r._id === room._id ? { ...r, ...room } : r)) : [room, ...rooms];
  return sortRooms(next);
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
    avatarInfo: {
      type: "initials",
      value: getUserInitials(displayName),
      bgColor: generateColorFromString(displayName),
    },
    isOnline,
    updatedAt: new Date(roomActivityTime(room) || Date.now()),
  };
}
