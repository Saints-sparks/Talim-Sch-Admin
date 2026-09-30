/**
 * The Messages sidebar's filter and search, kept out of the component so the
 * rules are testable on their own.
 */
import type { DisplayChatRoom } from "@/lib/chat/rooms";

/** The sidebar's filters. `office` is the shared "School office" inbox (Round 4 §28). */
export type RoomFilter = "all" | "teachers" | "office" | "groups";

/** The filters in menu order, with their labels. */
export const ROOM_FILTERS: ReadonlyArray<{ id: RoomFilter; label: string }> = [
  { id: "all", label: "All chats" },
  { id: "teachers", label: "Teachers" },
  { id: "office", label: "Teachers · Office" },
  { id: "groups", label: "Groups" },
];

/**
 * Whether a room belongs under a filter.
 *
 * @param room - A sidebar room.
 * @param filter - The chosen filter.
 * @returns True when the room is shown under it.
 */
export function matchesRoomFilter(room: DisplayChatRoom, filter: RoomFilter): boolean {
  switch (filter) {
    case "office":
      return room.isOffice;
    case "groups":
      return room.type === "group" && !room.isOffice;
    case "teachers":
      return room.type === "private" && room.participants.some((p) => p.role === "teacher");
    default:
      return true;
  }
}

/**
 * Whether a room matches what was typed in the search box: its name, its
 * subtitle, its last message or a member's name.
 *
 * @param room - A sidebar room.
 * @param search - The search text.
 * @returns True when the search is blank or anything matches.
 */
export function matchesRoomSearch(room: DisplayChatRoom, search: string): boolean {
  const term = search.toLowerCase().trim();
  if (!term) return true;
  return (
    room.displayName.toLowerCase().includes(term) ||
    Boolean(room.subtitle?.toLowerCase().includes(term)) ||
    Boolean(room.lastMessage?.content?.toLowerCase().includes(term)) ||
    room.participants.some((p) => p.name?.toLowerCase().includes(term))
  );
}

/**
 * The rooms to list.
 *
 * @param rooms - Every room, in order.
 * @param filter - The chosen filter.
 * @param search - The search text.
 * @returns The rooms that pass both, in the same order.
 */
export function filterRooms(rooms: DisplayChatRoom[], filter: RoomFilter, search: string): DisplayChatRoom[] {
  return rooms.filter((room) => matchesRoomFilter(room, filter) && matchesRoomSearch(room, search));
}

/**
 * Unread office threads, for the count beside the office filter.
 *
 * @param rooms - Every room.
 * @returns How many office threads have unread messages.
 */
export function unreadOfficeThreads(rooms: DisplayChatRoom[]): number {
  return rooms.filter((room) => room.isOffice && room.unreadCount > 0).length;
}
