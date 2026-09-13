/**
 * Message normalizer, thread merge and optimistic-send state transitions.
 */
import {
  buildPendingMessage,
  createClientMessageId,
  isDelivered,
  isNearBottom,
  markMessageFailed,
  markMessagePending,
  mergeMessages,
  newestStoredMessageId,
  normalizeMessage,
  pendingMessageId,
  removeLocalMessage,
} from "@/lib/chat/messages";

const ME = "64b000000000000000000001";
const PARENT = "64b000000000000000000002";
const ROOM = "64b0000000000000000000aa";

function view(overrides: Record<string, unknown> = {}) {
  return {
    _id: "m1",
    roomId: ROOM,
    senderId: PARENT,
    sender: { _id: PARENT, name: "Ada Parent", role: "parent", avatar: null },
    text: "Hello",
    type: "text",
    attachments: [],
    readBy: [],
    isRead: false,
    createdAt: "2026-09-13T10:00:00.000Z",
    content: "Hello",
    timestamp: "2026-09-13T10:00:00.000Z",
    senderName: "Ada Parent",
    chatRoomId: ROOM,
    ...overrides,
  };
}

describe("normalizeMessage", () => {
  it("reads the canonical MessageView fields", () => {
    const m = normalizeMessage(view());
    expect(m).toMatchObject({
      _id: "m1",
      roomId: ROOM,
      senderId: PARENT,
      senderName: "Ada Parent",
      content: "Hello",
      type: "text",
    });
    expect(m.createdAt.toISOString()).toBe("2026-09-13T10:00:00.000Z");
  });

  it("keeps attachments and fills a voice note's duration from the message", () => {
    const m = normalizeMessage(
      view({
        text: "",
        type: "voice",
        duration: 12,
        attachments: [{ url: "https://res.cloudinary.com/a.webm", type: "audio", name: "voice.webm" }],
      })
    );
    expect(m.type).toBe("voice");
    expect(m.attachments).toHaveLength(1);
    expect(m.attachments?.[0]).toMatchObject({ url: "https://res.cloudinary.com/a.webm", type: "audio", duration: 12 });
  });

  it("reads REST history where senderId is the populated user", () => {
    const m = normalizeMessage({
      _id: "m2",
      chatRoomId: ROOM,
      senderId: { _id: PARENT, firstName: "Ada", lastName: "Parent", userAvatar: "a.png" },
      content: "Old alias",
      timestamp: "2026-09-12T10:00:00.000Z",
    });
    expect(m.senderId).toBe(PARENT);
    expect(m.senderName).toBe("Ada Parent");
    expect(m.senderAvatar).toBe("a.png");
    expect(m.content).toBe("Old alias");
    expect(m.roomId).toBe(ROOM);
  });

  it("converts string attachments and infers the type from them", () => {
    const m = normalizeMessage(view({ type: "text", attachments: ["https://res.cloudinary.com/x/photo.jpg"] }));
    expect(m.type).toBe("image");
    expect(m.attachments?.[0]).toMatchObject({ type: "image", name: "photo.jpg" });
  });

  it("passes width, height and clientMessageId through", () => {
    const m = normalizeMessage(
      view({
        clientMessageId: "c-1",
        type: "image",
        attachments: [{ url: "https://res.cloudinary.com/p.jpg", type: "image", width: 800, height: 600 }],
      })
    );
    expect(m.clientMessageId).toBe("c-1");
    expect(m.attachments?.[0]).toMatchObject({ width: 800, height: 600 });
  });
});

describe("mergeMessages", () => {
  it("dedupes by _id and keeps oldest-first order", () => {
    const a = normalizeMessage(view({ _id: "a", createdAt: "2026-09-13T10:00:00Z" }));
    const b = normalizeMessage(view({ _id: "b", createdAt: "2026-09-13T10:01:00Z" }));
    const c = normalizeMessage(view({ _id: "c", createdAt: "2026-09-13T09:59:00Z" }));
    const merged = mergeMessages([a, b], [b, c, a]);
    expect(merged.map((m) => m._id)).toEqual(["c", "a", "b"]);
  });

  it("never replaces the thread with an older page (prepend merges)", () => {
    const recent = [normalizeMessage(view({ _id: "r1", createdAt: "2026-09-13T10:00:00Z" }))];
    const olderPage = [
      normalizeMessage(view({ _id: "o2", createdAt: "2026-09-13T09:00:00Z" })),
      normalizeMessage(view({ _id: "o1", createdAt: "2026-09-13T08:00:00Z" })),
    ];
    expect(mergeMessages(recent, olderPage).map((m) => m._id)).toEqual(["o1", "o2", "r1"]);
  });

  it("returns the same array when nothing comes in", () => {
    const thread = [normalizeMessage(view())];
    expect(mergeMessages(thread, [])).toBe(thread);
  });
});

describe("optimistic sends", () => {
  const pending = buildPendingMessage({
    clientMessageId: "c-1",
    roomId: ROOM,
    senderId: ME,
    senderName: "Admin",
    text: "On my way",
    type: "text",
    now: new Date("2026-09-13T10:05:00Z"),
  });
  const stored = normalizeMessage(
    view({
      _id: "s1",
      senderId: ME,
      sender: { _id: ME, name: "Admin" },
      text: "On my way",
      clientMessageId: "c-1",
      createdAt: "2026-09-13T10:05:01Z",
    })
  );

  it("creates a pending bubble holding the text", () => {
    expect(pending).toMatchObject({ _id: pendingMessageId("c-1"), status: "pending", content: "On my way" });
  });

  it("the ack / echo replaces the pending bubble instead of adding a second copy", () => {
    const thread = mergeMessages([], [pending]);
    const afterEcho = mergeMessages(thread, [stored]);
    expect(afterEcho).toHaveLength(1);
    expect(afterEcho[0]._id).toBe("s1");
    expect(afterEcho[0].status).toBeUndefined();

    // The ack arriving after the echo changes nothing.
    const afterAck = mergeMessages(afterEcho, [stored]);
    expect(afterAck).toHaveLength(1);
    expect(isDelivered(afterAck, "c-1")).toBe(true);
  });

  it("a stale pending bubble never overwrites the stored message", () => {
    const thread = mergeMessages([], [stored]);
    expect(mergeMessages(thread, [pending]).map((m) => m._id)).toEqual(["s1"]);
  });

  it("a timeout marks the bubble failed, keeping its text; retry puts it back to pending", () => {
    const failed = markMessageFailed([pending], "c-1", "Message not sent");
    expect(failed[0]).toMatchObject({ status: "failed", error: "Message not sent", content: "On my way" });
    const retried = markMessagePending(failed, "c-1");
    expect(retried[0]).toMatchObject({ status: "pending", error: undefined, clientMessageId: "c-1" });
  });

  it("failing an already-delivered message is a no-op", () => {
    const thread = [stored];
    expect(markMessageFailed(thread, "c-1", "late timeout")).toBe(thread);
  });

  it("delete removes only the local bubble", () => {
    const other = normalizeMessage(view({ _id: "x" }));
    const failed = markMessageFailed([other, pending], "c-1", "nope");
    expect(removeLocalMessage(failed, "c-1").map((m) => m._id)).toEqual(["x"]);
  });

  it("backfills from the newest stored message, skipping pending ones", () => {
    const thread = mergeMessages([], [normalizeMessage(view({ _id: "s0" })), pending]);
    expect(newestStoredMessageId(thread)).toBe("s0");
  });

  it("generates distinct client ids of at most 64 chars", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createClientMessageId()));
    expect(ids.size).toBe(20);
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(64);
  });
});

describe("isNearBottom", () => {
  it("is true within 120px of the bottom", () => {
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 400, clientHeight: 500 })).toBe(true);
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 300, clientHeight: 500 })).toBe(false);
  });
});
