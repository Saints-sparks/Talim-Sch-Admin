/**
 * Room list: normalizer, live activity, ordering and the "other person".
 */
import {
  applyMessageDeletedToRooms,
  applyPresenceChanged,
  DELETED_PREVIEW,
  applyRoomActivity,
  clearRoomUnread,
  mergeRoomList,
  normalizeRoom,
  otherParticipant,
  toDisplayRoom,
  upsertRoom,
} from "@/lib/chat/rooms";
import {
  chatRoomUrl,
  isRoomOpen,
  shouldAlertForActivity,
  toInAppPath,
} from "@/lib/chat/openRoom";

const ME = "u-admin";
const TEACHER = "u-teacher";
const PARENT = "u-parent";

function roomView(id: string, overrides: Record<string, unknown> = {}) {
  return {
    _id: id,
    roomId: id,
    type: "one_to_one",
    name: "",
    participants: [
      { _id: ME, userId: ME, firstName: "Sam", lastName: "Admin", role: "school_admin", userAvatar: null, isOnline: true },
      { _id: TEACHER, userId: TEACHER, firstName: "Tola", lastName: "Teacher", role: "teacher", userAvatar: null, isOnline: false },
    ],
    lastMessage: null,
    unreadCount: 0,
    updatedAt: "2026-09-13T09:00:00Z",
    ...overrides,
  };
}

describe("normalizeRoom", () => {
  it("accepts the roomId alias and participants with only _id", () => {
    const room = normalizeRoom({
      roomId: "r1",
      type: "custom_group",
      participants: [{ _id: ME, firstName: "Sam" }, TEACHER],
      lastMessage: { _id: "m1", senderId: TEACHER, senderName: "Tola", type: "voice", preview: "Voice note · 0:12", createdAt: "2026-09-13T10:00:00Z" },
    });
    expect(room._id).toBe("r1");
    expect(room.participants.map((p) => p.userId)).toEqual([ME, TEACHER]);
    expect(room.lastMessage?.preview).toBe("Voice note · 0:12");
  });
});

describe("otherParticipant / toDisplayRoom", () => {
  it("picks the participant who isn't me, whoever created the room", () => {
    const room = normalizeRoom(roomView("r1", { createdBy: TEACHER }));
    expect(otherParticipant(room, ME)?.userId).toBe(TEACHER);
    expect(toDisplayRoom(room, ME).displayName).toBe("Tola Teacher");
  });

  it("uses lastMessage.preview for voice and photo messages", () => {
    const room = normalizeRoom(
      roomView("r1", {
        lastMessage: { _id: "m1", senderId: TEACHER, senderName: "Tola", type: "image", preview: "Photo", content: "Photo", createdAt: "2026-09-13T10:00:00Z" },
      })
    );
    const display = toDisplayRoom(room, ME);
    expect(display.lastMessage?.content).toBe("Photo");
    expect(display.lastMessage?.timestamp.toISOString()).toBe("2026-09-13T10:00:00.000Z");
  });
});

describe("mergeRoomList", () => {
  it("sorts by lastMessage.createdAt and drops rooms I'm not in", () => {
    const rooms = mergeRoomList(
      [
        roomView("old", { lastMessage: { _id: "a", senderId: TEACHER, preview: "a", createdAt: "2026-09-10T10:00:00Z" } }),
        roomView("new", { lastMessage: { _id: "b", senderId: TEACHER, preview: "b", createdAt: "2026-09-13T10:00:00Z" } }),
        roomView("foreign", { participants: [{ _id: PARENT, userId: PARENT }] }),
      ],
      ME,
      null
    );
    expect(rooms.map((r) => r._id)).toEqual(["new", "old"]);
  });

  it("keeps the viewed room at zero unread", () => {
    const rooms = mergeRoomList([roomView("r1", { unreadCount: 3 })], ME, "r1");
    expect(rooms[0].unreadCount).toBe(0);
  });
});

describe("applyRoomActivity", () => {
  const base = mergeRoomList(
    [
      roomView("r1", { lastMessage: { _id: "a", senderId: TEACHER, preview: "hi", createdAt: "2026-09-13T10:00:00Z" } }),
      roomView("r2", { lastMessage: { _id: "b", senderId: TEACHER, preview: "yo", createdAt: "2026-09-13T09:00:00Z" } }),
    ],
    ME,
    null
  );
  const activity = {
    roomId: "r2",
    lastMessage: { _id: "c", senderId: TEACHER, senderName: "Tola", type: "voice", preview: "Voice note · 0:05", createdAt: "2026-09-13T11:00:00Z" },
  };

  it("updates the preview, moves the room up and bumps unread", () => {
    const { rooms, known } = applyRoomActivity(base, activity, { currentUserId: ME, viewingRoomId: null });
    expect(known).toBe(true);
    expect(rooms[0]._id).toBe("r2");
    expect(rooms[0].lastMessage?.preview).toBe("Voice note · 0:05");
    expect(rooms[0].unreadCount).toBe(1);
  });

  it("does not bump unread twice for the same message", () => {
    const once = applyRoomActivity(base, activity, { currentUserId: ME, viewingRoomId: null }).rooms;
    const twice = applyRoomActivity(once, activity, { currentUserId: ME, viewingRoomId: null }).rooms;
    expect(twice[0].unreadCount).toBe(1);
  });

  it("no unread for my own messages or the room I'm viewing", () => {
    const mine = { ...activity, lastMessage: { ...activity.lastMessage, senderId: ME } };
    expect(applyRoomActivity(base, mine, { currentUserId: ME, viewingRoomId: null }).rooms[0].unreadCount).toBe(0);
    expect(applyRoomActivity(base, activity, { currentUserId: ME, viewingRoomId: "r2" }).rooms[0].unreadCount).toBe(0);
  });

  it("reports unknown rooms so the list can be fetched", () => {
    expect(applyRoomActivity(base, { ...activity, roomId: "r9" }, { currentUserId: ME, viewingRoomId: null }).known).toBe(false);
  });

  it("upsertRoom and clearRoomUnread keep things tidy", () => {
    const bumped = applyRoomActivity(base, activity, { currentUserId: ME, viewingRoomId: null }).rooms;
    expect(clearRoomUnread(bumped, "r2").find((r) => r._id === "r2")?.unreadCount).toBe(0);
    const added = upsertRoom(bumped, normalizeRoom(roomView("r1", { name: "Renamed" })));
    expect(added.filter((r) => r._id === "r1")).toHaveLength(1);
  });
});

describe("chat alerts: is this room open?", () => {
  const activity = { roomId: "r1", lastMessage: { senderId: TEACHER } };

  it("alerts for someone else's message when the room isn't open", () => {
    expect(shouldAlertForActivity({ activity, currentUserId: ME, pathname: "/dashboard", openRoomId: null })).toBe(true);
    expect(shouldAlertForActivity({ activity, currentUserId: ME, pathname: "/messages", openRoomId: "r2" })).toBe(true);
  });

  it("stays quiet for the open room and for my own messages", () => {
    expect(shouldAlertForActivity({ activity, currentUserId: ME, pathname: "/messages", openRoomId: "r1" })).toBe(false);
    expect(
      shouldAlertForActivity({ activity: { roomId: "r1", lastMessage: { senderId: ME } }, currentUserId: ME, pathname: "/grades", openRoomId: null })
    ).toBe(false);
  });

  it("a room is only open on the messages page", () => {
    expect(isRoomOpen("/messages", "r1", "r1")).toBe(true);
    expect(isRoomOpen("/dashboard", "r1", "r1")).toBe(false);
  });

  it("builds and validates in-app URLs", () => {
    expect(chatRoomUrl("r 1")).toBe("/messages?room=r%201");
    expect(toInAppPath("/messages?room=r1", "https://admin.talim.app")).toBe("/messages?room=r1");
    expect(toInAppPath("https://admin.talim.app/messages?room=r1", "https://admin.talim.app")).toBe("/messages?room=r1");
    expect(toInAppPath("https://evil.example/x", "https://admin.talim.app")).toBeNull();
  });
});

describe("applyMessageDeletedToRooms", () => {
  const withLast = (id: string, lastId: string) =>
    normalizeRoom(
      roomView(id, {
        lastMessage: {
          _id: lastId,
          senderId: TEACHER,
          senderName: "Tola Teacher",
          type: "text",
          preview: "See you",
          createdAt: "2026-09-13T10:00:00Z",
          content: "See you",
        },
      })
    );

  it("previews the room as deleted when its last message was the one deleted", () => {
    const rooms = [withLast("r1", "m9")];
    const next = applyMessageDeletedToRooms(rooms, "r1", "m9");
    expect(next[0].lastMessage?.preview).toBe(DELETED_PREVIEW);
    expect(applyMessageDeletedToRooms(next, "r1", "m9")).toBe(next);
  });

  it("leaves rooms alone when an older message was deleted", () => {
    const rooms = [withLast("r1", "m9")];
    expect(applyMessageDeletedToRooms(rooms, "r1", "m1")).toBe(rooms);
    expect(applyMessageDeletedToRooms(rooms, "other", "m9")).toBe(rooms);
  });
});

describe("applyPresenceChanged", () => {
  it("updates the person in every room they are in", () => {
    const rooms = [normalizeRoom(roomView("r1")), normalizeRoom(roomView("r2"))];
    const next = applyPresenceChanged(rooms, TEACHER, true);

    expect(next[0].participants.find((p) => p.userId === TEACHER)?.isOnline).toBe(true);
    expect(next[1].participants.find((p) => p.userId === TEACHER)?.isOnline).toBe(true);
    expect(next[0].participants.find((p) => p.userId === ME)?.isOnline).toBe(true);
  });

  it("returns the same list when nothing changes or nobody matches", () => {
    const rooms = [normalizeRoom(roomView("r1"))];
    expect(applyPresenceChanged(rooms, TEACHER, false)).toBe(rooms);
    expect(applyPresenceChanged(rooms, "someone-else", true)).toBe(rooms);
  });
});
