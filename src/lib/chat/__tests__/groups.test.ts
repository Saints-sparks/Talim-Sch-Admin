/**
 * Group details and membership: room-updated, participants-changed, who can
 * manage / leave, and the display shape.
 */
import {
  applyParticipantsChanged,
  applyRoomUpdated,
  canLeaveRoom,
  canManageRoom,
  normalizeRoom,
  toDisplayRoom,
  upsertRoom,
} from "@/lib/chat/rooms";
import { ChatRoomType } from "@/types/chat.types";

const ME = "u-admin";
const TEACHER = "u-teacher";
const PARENT = "u-parent";

function group(overrides: Record<string, unknown> = {}) {
  return normalizeRoom({
    _id: "g1",
    type: "custom_group",
    name: "Staff",
    description: "Planning",
    avatarUrl: "https://res.cloudinary.com/g.png",
    createdBy: TEACHER,
    participants: [
      { _id: ME, userId: ME, firstName: "Sam", lastName: "Admin", role: "school_admin", isOnline: true },
      { _id: TEACHER, userId: TEACHER, firstName: "Tola", lastName: "Teacher", role: "teacher", isOnline: false },
    ],
    unreadCount: 2,
    ...overrides,
  });
}

describe("room-updated", () => {
  it("patches name, description and picture; null clears", () => {
    const rooms = [group()];
    const renamed = applyRoomUpdated(rooms, { roomId: "g1", name: "Staff 2026", description: "New", avatarUrl: null });
    expect(renamed[0]).toMatchObject({ name: "Staff 2026", description: "New", avatarUrl: undefined, unreadCount: 2 });
    expect(applyRoomUpdated(renamed, { roomId: "g1", description: "" })[0].description).toBeUndefined();
  });

  it("ignores unknown rooms", () => {
    const rooms = [group()];
    expect(applyRoomUpdated(rooms, { roomId: "nope", name: "x" })).toBe(rooms);
  });
});

describe("participants-changed", () => {
  const profiles = [
    { _id: ME, userId: ME, firstName: "Sam", lastName: "Admin", role: "school_admin", isOnline: true },
    { _id: TEACHER, userId: TEACHER, firstName: "Tola", lastName: "Teacher", role: "teacher", isOnline: true },
    { _id: PARENT, userId: PARENT, firstName: "Pat", lastName: "Parent", role: "parent", isOnline: false },
  ];

  it("replaces the room's participants", () => {
    const result = applyParticipantsChanged([group()], { roomId: "g1", added: [PARENT], participants: profiles }, ME);
    expect(result.removedMe).toBe(false);
    expect(result.rooms[0].participants.map((p) => p.userId)).toEqual([ME, TEACHER, PARENT]);
  });

  it("drops the room when I'm removed", () => {
    const result = applyParticipantsChanged(
      [group(), group({ _id: "g2" })],
      { roomId: "g1", removed: [ME], by: TEACHER, participants: profiles.slice(1) },
      ME
    );
    expect(result.removedMe).toBe(true);
    expect(result.room?.name).toBe("Staff");
    expect(result.rooms.map((r) => r._id)).toEqual(["g2"]);
  });

  it("reports an unknown room (fetch the list if I was added)", () => {
    const result = applyParticipantsChanged([], { roomId: "g9", added: [ME], participants: profiles }, ME);
    expect(result.known).toBe(false);
  });
});

describe("who sees group controls", () => {
  it("managers by role, or the creator; never in direct messages", () => {
    const custom = group();
    expect(canManageRoom(custom, { id: ME, role: "school_admin" })).toBe(true);
    expect(canManageRoom(custom, { id: ME, role: "school_sub_admin" })).toBe(true);
    expect(canManageRoom(custom, { id: PARENT, role: "parent" })).toBe(false);
    expect(canManageRoom(group({ createdBy: PARENT }), { id: PARENT, role: "parent" })).toBe(true);
    expect(canManageRoom(group({ type: "one_to_one" }), { id: ME, role: "school_admin" })).toBe(false);
  });

  it("Leave only in custom and parent groups", () => {
    expect(canLeaveRoom(group())).toBe(true);
    expect(canLeaveRoom(group({ type: ChatRoomType.PARENT_GROUP }))).toBe(true);
    expect(canLeaveRoom(group({ type: ChatRoomType.CLASS_GROUP }))).toBe(false);
    expect(canLeaveRoom(group({ type: ChatRoomType.COURSE_GROUP }))).toBe(false);
    expect(canLeaveRoom(group({ type: ChatRoomType.ADMIN_PARENT_GROUP }))).toBe(false);
  });
});

describe("room details", () => {
  it("shows a group's picture and description", () => {
    const display = toDisplayRoom(group(), ME);
    expect(display.avatarInfo).toMatchObject({ type: "image", value: "https://res.cloudinary.com/g.png" });
    expect(display.description).toBe("Planning");
  });

  it("keeps known profiles when a mutation returns bare participant ids", () => {
    const rooms = [group()];
    const updated = upsertRoom(rooms, normalizeRoom({ _id: "g1", type: "custom_group", name: "Staff", participants: [ME, TEACHER, PARENT] }));
    expect(updated[0].participants.map((p) => p.firstName)).toEqual(["Sam", "Tola", undefined]);
    expect(updated[0].unreadCount).toBe(2);
  });

  it("keeps the reused flag from POST /chat/groups", () => {
    expect(normalizeRoom({ _id: "g1", type: "class_group", participants: [], reused: true }).reused).toBe(true);
  });
});
