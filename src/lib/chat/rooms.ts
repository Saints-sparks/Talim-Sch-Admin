/**
 * Chat room list helpers: one normalizer for `GET /chat/rooms` and
 * `chat-rooms-update`, live updates from `chat-room-activity`, ordering,
 * and the sidebar display shape.
 */
import { ChatRoomType } from "@/types/chat.types";
import type { ChatRoom, ChatRoomLastMessage, OfficeOwnerRole, Participant } from "@/types/chat.types";
import type { ChatRoomCategory, RoomAdmin } from "@/types/round4Contract";
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
  /** What the room is to me: the API's `category`, or worked out from the room when it has none. */
  category: ChatRoomCategory;
  /** One line under the name, e.g. "Office thread · Tolu Ade"; absent when there is nothing useful to say. */
  subtitle?: string;
  /** A thread with the school office (members are managed by the server). */
  isOffice: boolean;
  /** Office threads only: whether a teacher or a parent owns it (B10). */
  officeOwnerRole?: OfficeOwnerRole;
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

/**
 * Reads a room from REST or `chat-rooms-update` (`_id` or the `roomId` alias).
 * The Round 4 fields (`category`, `subtitle`, `callPhone`, `admins`) are set
 * only when the payload carries them, so a mutation response without them
 * doesn't wipe what the list already has (see {@link upsertRoom}).
 *
 * @param raw - A room in any of the shapes the API and socket send.
 * @returns The room.
 */
export function normalizeRoom(raw: unknown): ChatRoom {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const room = rec(r.data || r.chatRoom || r.room || r);
  const id = idOf(room._id) || idOf(room.roomId) || idOf(room.id);
  const normalized = {
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
    category: isRoomCategory(room.category) ? room.category : undefined,
    subtitle: typeof room.subtitle === "string" && room.subtitle.trim() ? room.subtitle.trim() : undefined,
    callPhone: typeof room.callPhone === "string" && room.callPhone ? room.callPhone : null,
    admins: normalizeAdmins(room.admins),
    officeTeacherId: idOf(room.officeTeacherId) || undefined,
    officeOwnerId: idOf(room.officeOwnerId) || undefined,
    ownerRole: room.ownerRole === "teacher" || room.ownerRole === "parent" ? room.ownerRole : undefined,
  } as ChatRoom;
  // Absent means "not sent": leave the keys off so merging keeps known values.
  (["category", "subtitle", "admins", "officeTeacherId", "officeOwnerId", "ownerRole"] as const).forEach((key) => {
    if (normalized[key] === undefined) delete normalized[key];
  });
  if (!("callPhone" in room)) delete normalized.callPhone;
  return normalized;
}

/**
 * Reads the room view's `admins` (Round 4 group info).
 *
 * @param value - `admins` from a payload: `{ id, name }` entries (a bare id or `_id` is accepted).
 * @returns The admins with an id, or undefined when the payload has no list.
 */
export function normalizeAdmins(value: unknown): RoomAdmin[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((entry) => {
      const r = rec(entry);
      const id = typeof entry === "string" ? entry : idOf(r.id) || idOf(r._id) || idOf(r.userId);
      return { id, name: str(r.name) ?? "" };
    })
    .filter((admin) => admin.id);
}

/**
 * Whether a person is one of the group's admins.
 *
 * @param room - The room (its `admins`, when the API sent them).
 * @param userId - The person.
 * @returns True when listed in `admins`.
 */
export function isGroupAdmin(room: Pick<ChatRoom, "admins"> | null | undefined, userId: string): boolean {
  return Boolean(userId) && Boolean(room?.admins?.some((admin) => admin.id === userId));
}

const ROOM_CATEGORIES: readonly ChatRoomCategory[] = ["parent", "colleague", "class_group", "office", "group"];

/**
 * Narrows a payload value to a known room category (an unknown one is ignored).
 *
 * @param value - `category` from a payload.
 * @returns True for one of {@link ROOM_CATEGORIES}.
 */
function isRoomCategory(value: unknown): value is ChatRoomCategory {
  return typeof value === "string" && (ROOM_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Whether a room is a teacher's office thread (Round 4 §28). Its members are
 * the teacher, every admin and every sub-admin with `manage:messages`; the
 * server keeps that list, so nobody adds, removes or leaves.
 *
 * @param room - A room, or its type and category.
 * @returns True for `type: 'office'` or `category: 'office'`.
 */
export function isOfficeRoom(room: Pick<ChatRoom, "type"> & Partial<Pick<ChatRoom, "category">> | null | undefined): boolean {
  return Boolean(room) && (room!.type === ChatRoomType.OFFICE || room!.category === "office");
}

/**
 * What a room is to the viewer: the API's `category` (Round 4 §27), or, from
 * an API that doesn't send one yet, a guess from the room type and the other
 * person's role.
 *
 * @param room - The room.
 * @param currentUserId - The viewer.
 * @returns The category.
 */
export function roomCategory(room: ChatRoom, currentUserId: string): ChatRoomCategory {
  if (room.category) return room.category;
  switch (room.type) {
    case ChatRoomType.OFFICE:
      return "office";
    case ChatRoomType.ONE_TO_ONE:
      return otherParticipant(room, currentUserId)?.role === "parent" ? "parent" : "colleague";
    case ChatRoomType.CLASS_GROUP:
    case ChatRoomType.COURSE_GROUP:
      return "class_group";
    default:
      return "group";
  }
}

/** The start of an admin's office-thread subtitle (Round 4 §27). */
export const OFFICE_SUBTITLE_PREFIX = "Office thread · ";

/** A parent owner's subtitle ends "(parent of …)" (B10). */
const PARENT_OF = /\s*\(parent of\b[^)]*\)\s*$/i;

/** Roles that staff the office; never an office room's owner. */
const OFFICE_STAFF_ROLES = new Set(["school_admin", "school_sub_admin", "admin", "super_admin"]);

/**
 * Who owns an office room: the API's `ownerRole` (B10); else a room from
 * before Part B, which has `officeTeacherId` and so a teacher; else what the
 * subtitle or the members say. Defaults to a teacher, the only owner before B10.
 *
 * @param room - An office room.
 * @returns `teacher` or `parent`.
 */
export function officeOwnerRole(room: ChatRoom): OfficeOwnerRole {
  if (room.ownerRole) return room.ownerRole;
  if (room.officeTeacherId) return "teacher";
  if (room.subtitle && PARENT_OF.test(room.subtitle)) return "parent";
  const ownerId = room.officeOwnerId;
  const owner = ownerId ? room.participants.find((p) => p.userId === ownerId || p._id === ownerId) : undefined;
  if (owner?.role === "parent" || owner?.role === "teacher") return owner.role;
  const members = new Set(room.participants.map((p) => p.role));
  return members.has("parent") && !members.has("teacher") ? "parent" : "teacher";
}

/**
 * The member who owns an office room: by `officeOwnerId` (B10) or
 * `officeTeacherId` (Round 4), else the first member with the owner's role,
 * else the first member who is not office staff.
 *
 * @param room - An office room.
 * @returns The owner, or undefined when the members are bare ids.
 */
export function officeOwner(room: ChatRoom): Participant | undefined {
  const ownerId = room.officeOwnerId ?? room.officeTeacherId;
  if (ownerId) {
    const byId = room.participants.find((p) => p.userId === ownerId || p._id === ownerId);
    if (byId) return byId;
  }
  const role = officeOwnerRole(room);
  return (
    room.participants.find((p) => p.role === role) ??
    room.participants.find((p) => p.role && !OFFICE_STAFF_ROLES.has(p.role))
  );
}

/**
 * The name an office thread is listed under: its owner's (a teacher or a
 * parent), from the members, else from the API's subtitle, else the room name.
 *
 * @param room - An office room.
 * @returns The owner's name.
 */
export function officeOwnerName(room: ChatRoom): string {
  const owner = officeOwner(room);
  const fromMembers = owner ? participantName(owner) || owner.email : "";
  if (fromMembers) return fromMembers;
  if (room.subtitle?.startsWith(OFFICE_SUBTITLE_PREFIX)) {
    const fromSubtitle = room.subtitle.slice(OFFICE_SUBTITLE_PREFIX.length).replace(PARENT_OF, "").trim();
    if (fromSubtitle) return fromSubtitle;
  }
  return room.name || (officeOwnerRole(room) === "parent" ? "Parent" : "Teacher");
}

/**
 * Round 4's name for {@link officeOwnerName}, kept for callers from before B10.
 *
 * @param room - An office room.
 * @returns The owner's name.
 */
export function officeTeacherName(room: ChatRoom): string {
  return officeOwnerName(room);
}

/**
 * The office thread's subtitle: the API's (staff get "Office thread ·
 * {teacher}", or "Office thread · {parent} (parent of …)" from B10), else one
 * built from the owner when an older API sends none.
 *
 * @param room - An office room.
 * @param ownerName - The owner's name, from {@link officeOwnerName}.
 * @returns The subtitle.
 */
export function officeSubtitle(room: ChatRoom, ownerName: string): string {
  if (room.subtitle) return room.subtitle;
  return officeOwnerRole(room) === "parent"
    ? `${OFFICE_SUBTITLE_PREFIX}${ownerName} (parent)`
    : `${OFFICE_SUBTITLE_PREFIX}${ownerName}`;
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
 * member of are dropped, except office threads (the server lists them for
 * every office staff member before adding them); the room being viewed keeps
 * an unread count of 0.
 *
 * @param rawRooms - `GET /chat/rooms` or `chat-rooms-update`, in any payload shape.
 * @param currentUserId - The viewer.
 * @param viewingRoomId - The room open and focused on screen, if any.
 * @returns The rooms, newest activity first.
 */
export function mergeRoomList(rawRooms: unknown[], currentUserId: string, viewingRoomId: string | null): ChatRoom[] {
  const rooms = rawRooms
    .map(normalizeRoom)
    // An office thread is listed for every admin even before the server adds
    // them to its members (it does so on the next read or post).
    .filter((room) => room._id && (isRoomMember(room, currentUserId) || isOfficeRoom(room)))
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
  /** Not sent yet; applied when a later API includes the group's admins. */
  admins?: unknown;
  updatedBy?: string;
}

/**
 * Applies `room-updated` to the list: name, description, picture, and the
 * admins when the event carries them. Every open view of the room (header,
 * group info) reads the list, so they update live.
 *
 * @param rooms - The room list.
 * @param event - The socket event.
 * @returns A new list, or the same one when the room isn't in it.
 */
export function applyRoomUpdated(rooms: ChatRoom[], event: RoomUpdatedEvent): ChatRoom[] {
  const roomId = idOf(event?.roomId);
  if (!roomId || !rooms.some((r) => r._id === roomId)) return rooms;
  return rooms.map((r) => {
    if (r._id !== roomId) return r;
    const next: ChatRoom = { ...r };
    if (typeof event.name === "string" && event.name) next.name = event.name;
    if ("description" in event) next.description = event.description || undefined;
    if ("avatarUrl" in event) next.avatarUrl = event.avatarUrl || undefined;
    const admins = normalizeAdmins(event.admins);
    if (admins) next.admins = admins;
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

/**
 * Whether to show group controls (add and remove members, and the picture):
 * never for direct messages or office threads, whose members the server
 * manages; managers by role, or the creator. The name and description follow
 * {@link canEditRoomDetails}.
 *
 * @param room - The room's type, creator and (when known) category.
 * @param user - The viewer's id and role.
 * @returns True when the controls are offered (the server has the final say).
 */
export function canManageRoom(
  room: (Pick<ChatRoom, "type" | "createdBy"> & Partial<Pick<ChatRoom, "category">>) | null | undefined,
  user: { id: string; role?: string | null }
): boolean {
  if (!room || room.type === ChatRoomType.ONE_TO_ONE || isOfficeRoom(room)) return false;
  if (user.role && GROUP_MANAGER_ROLES.includes(user.role)) return true;
  return Boolean(user.id) && idOf(room.createdBy) === user.id;
}

/**
 * Whether the group's name and description can be edited: school staff and
 * whoever may manage the group (see {@link canManageRoom}), and the group's
 * admins; never a direct message or an office thread. The server has the
 * final say (`PATCH /chat/rooms/:id`).
 *
 * @param room - The room, with its `admins` when known.
 * @param user - The viewer's id and role.
 * @returns True when the name and description editors are offered.
 */
export function canEditRoomDetails(
  room: (Pick<ChatRoom, "type" | "createdBy"> & Partial<Pick<ChatRoom, "category" | "admins">>) | null | undefined,
  user: { id: string; role?: string | null }
): boolean {
  if (!room || room.type === ChatRoomType.ONE_TO_ONE || isOfficeRoom(room)) return false;
  return canManageRoom(room, user) || isGroupAdmin(room, user.id);
}

/**
 * Whether "Leave group" is offered: only in rooms members may leave, never an
 * office thread.
 *
 * @param room - The room's type and (when known) category.
 * @returns True when the viewer may leave.
 */
export function canLeaveRoom(room: (Pick<ChatRoom, "type"> & Partial<Pick<ChatRoom, "category">>) | null | undefined): boolean {
  return Boolean(room) && !isOfficeRoom(room) && LEAVABLE_ROOM_TYPES.includes(room!.type);
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

/**
 * The sidebar / header shape for a room. An office thread is named after its
 * owner, a teacher or a parent (B10), with the API's subtitle ("Office thread ·
 * {teacher}" or "Office thread · {parent} (parent of …)").
 *
 * @param room - The room.
 * @param currentUserId - The viewer (for a direct message's other person).
 * @returns What the list and the thread header render.
 */
export function toDisplayRoom(room: ChatRoom, currentUserId: string): DisplayChatRoom {
  const isGroup = room.type !== ChatRoomType.ONE_TO_ONE;
  const isOffice = isOfficeRoom(room);
  const category = roomCategory(room, currentUserId);
  let displayName = room.name || (isGroup ? "Group Chat" : "Chat");
  let subtitle = room.subtitle;
  let isOnline = false;

  if (isOffice) {
    // Listed under the teacher or parent it belongs to.
    const ownerName = officeOwnerName(room);
    displayName = ownerName;
    subtitle = officeSubtitle(room, ownerName);
  } else if (!isGroup) {
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
      isGroup && !isOffice && room.avatarUrl
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
    category,
    subtitle,
    isOffice,
    ...(isOffice ? { officeOwnerRole: officeOwnerRole(room) } : {}),
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

/**
 * A person came online or went offline: updates them in every room they are in.
 * Returns the same array when nobody in the list is that person or nothing changes.
 *
 * @param rooms - The room list.
 * @param userId - Who changed.
 * @param isOnline - Their new state.
 */
export function applyPresenceChanged(rooms: ChatRoom[], userId: string, isOnline: boolean): ChatRoom[] {
  let changed = false;
  const next = rooms.map((room) => {
    const at = room.participants.findIndex((p) => p.userId === userId || p._id === userId);
    if (at === -1 || Boolean(room.participants[at].isOnline) === isOnline) return room;
    changed = true;
    const participants = room.participants.slice();
    participants[at] = { ...participants[at], isOnline };
    return { ...room, participants };
  });
  return changed ? next : rooms;
}
