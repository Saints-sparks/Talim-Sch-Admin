/**
 * Read model: which position to acknowledge, messages-read, room-read and ticks.
 */
import { buildPendingMessage, normalizeMessage } from "@/lib/chat/messages";
import {
  applyMessagesRead,
  deliveryState,
  latestOwnStoredMessageId,
  nextReadMarker,
  readByCount,
} from "@/lib/chat/readReceipts";
import { clearRoomUnread, normalizeRoom } from "@/lib/chat/rooms";
import type { ChatMessage } from "@/types/chat.types";

const ME = "u-admin";
const TEACHER = "u-teacher";
const PARENT = "u-parent";

function msg(id: string, senderId: string, createdAt: string, readBy: string[] = []): ChatMessage {
  return normalizeMessage({
    _id: id,
    roomId: "r1",
    senderId,
    sender: { _id: senderId, name: senderId, role: "teacher", avatar: null },
    text: id,
    type: "text",
    attachments: [],
    readBy,
    createdAt,
  });
}

const thread = [
  msg("m1", TEACHER, "2026-09-13T10:00:00Z"),
  msg("m2", ME, "2026-09-13T10:01:00Z"),
  msg("m3", PARENT, "2026-09-13T10:02:00Z"),
  msg("m4", ME, "2026-09-13T10:03:00Z"),
];

describe("nextReadMarker", () => {
  it("picks the newest stored message from someone else", () => {
    expect(nextReadMarker(thread, ME)).toEqual({
      messageId: "m3",
      createdAt: new Date("2026-09-13T10:02:00Z").getTime(),
    });
  });

  it("returns null when that position was already sent", () => {
    const sent = nextReadMarker(thread, ME)!;
    expect(nextReadMarker(thread, ME, sent)).toBeNull();
  });

  it("never goes backwards (an older page loaded after a newer read)", () => {
    const sent = { messageId: "m9", createdAt: new Date("2026-09-13T11:00:00Z").getTime() };
    expect(nextReadMarker(thread, ME, sent)).toBeNull();
  });

  it("moves forward when a newer message arrives", () => {
    const sent = nextReadMarker(thread, ME)!;
    const next = [...thread, msg("m5", TEACHER, "2026-09-13T10:05:00Z")];
    expect(nextReadMarker(next, ME, sent)?.messageId).toBe("m5");
  });

  it("breaks equal timestamps by id", () => {
    const at = "2026-09-13T10:02:00Z";
    const sent = { messageId: "m3", createdAt: new Date(at).getTime() };
    expect(nextReadMarker([...thread, msg("m3b", TEACHER, at)], ME, sent)?.messageId).toBe("m3b");
  });

  it("ignores my own messages and pending bubbles", () => {
    const pending = buildPendingMessage({
      clientMessageId: "c1",
      roomId: "r1",
      senderId: TEACHER,
      senderName: "x",
      text: "hi",
      type: "text",
    });
    expect(nextReadMarker([msg("m2", ME, "2026-09-13T10:01:00Z"), pending], ME)).toBeNull();
  });
});

describe("applyMessagesRead", () => {
  it("adds the reader to messages from others up to readAt, without duplicates", () => {
    const next = applyMessagesRead(thread, { userId: TEACHER, readAt: "2026-09-13T10:02:30Z" });
    expect(next.find((m) => m._id === "m1")!.readBy).toEqual([]); // the reader's own message
    expect(next.find((m) => m._id === "m2")!.readBy).toEqual([TEACHER]);
    expect(next.find((m) => m._id === "m3")!.readBy).toEqual([TEACHER]);
    expect(next.find((m) => m._id === "m4")!.readBy).toEqual([]); // after readAt

    const again = applyMessagesRead(next, { userId: TEACHER, readAt: "2026-09-13T10:02:30Z" });
    expect(again).toBe(next);
  });

  it("returns the same array when nothing changes", () => {
    expect(applyMessagesRead(thread, { userId: TEACHER, readAt: "2026-09-12T00:00:00Z" })).toBe(thread);
    expect(applyMessagesRead(thread, { userId: "", readAt: "2026-09-13T12:00:00Z" })).toBe(thread);
  });
});

describe("room-read", () => {
  it("clears that room's unread count", () => {
    const rooms = [normalizeRoom({ _id: "r1", type: "one_to_one", participants: [ME, TEACHER], unreadCount: 4 })];
    expect(clearRoomUnread(rooms, "r1")[0].unreadCount).toBe(0);
  });
});

describe("ticks", () => {
  const mine = msg("m4", ME, "2026-09-13T10:03:00Z");

  it("pending → clock, failed, stored → one tick", () => {
    expect(deliveryState({ ...mine, status: "pending" }, TEACHER)).toBe("pending");
    expect(deliveryState({ ...mine, status: "failed" }, TEACHER)).toBe("failed");
    expect(deliveryState(mine, TEACHER)).toBe("sent");
  });

  it("1:1 is read when the other person is in readBy", () => {
    expect(deliveryState({ ...mine, readBy: [PARENT] }, TEACHER)).toBe("sent");
    expect(deliveryState({ ...mine, readBy: [TEACHER] }, TEACHER)).toBe("read");
  });

  it("groups count readers other than the sender", () => {
    const read = { ...mine, readBy: [ME, TEACHER, PARENT, TEACHER] };
    expect(readByCount(read)).toBe(2);
    expect(deliveryState(read)).toBe("read");
    expect(deliveryState({ ...mine, readBy: [ME] })).toBe("sent");
  });

  it("finds my latest stored message", () => {
    const pending = buildPendingMessage({
      clientMessageId: "c2",
      roomId: "r1",
      senderId: ME,
      senderName: "me",
      text: "later",
      type: "text",
    });
    expect(latestOwnStoredMessageId([...thread, pending], ME)).toBe("m4");
    expect(latestOwnStoredMessageId([thread[0]], ME)).toBeNull();
  });
});
