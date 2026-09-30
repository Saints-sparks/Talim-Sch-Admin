/**
 * Push while the room is open (Round 4): the backend pushes every chat
 * message to every member with `roomId` in the data, so the service worker
 * (`public/sw.js`) must skip the notification while a focused, visible window
 * shows that room, and the in-app banner rule does the same.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { isPageFocused, shouldAlertForActivity } from "@/lib/chat/openRoom";

type Listener = (event: unknown) => void;
interface FakeClient {
  url: string;
  focused: boolean;
  visibilityState?: "visible" | "hidden";
}

const ORIGIN = "https://school.mytalim.com";
const SW_SOURCE = fs.readFileSync(path.join(__dirname, "../../public/sw.js"), "utf8");

/** Loads the real service worker with fake browser globals. */
function loadServiceWorker(windows: FakeClient[]) {
  const listeners = new Map<string, Listener>();
  const showNotification = jest.fn().mockResolvedValue(undefined);
  const context = vm.createContext({
    self: {
      location: { origin: ORIGIN },
      registration: { showNotification },
      addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    },
    clients: { matchAll: jest.fn().mockResolvedValue(windows) },
    caches: { open: jest.fn() },
    fetch: jest.fn(),
    atob: (s: string) => Buffer.from(s, "base64").toString("binary"),
    URL,
    Response,
    Set,
    Uint8Array,
    JSON,
  });
  vm.runInContext(SW_SOURCE, context);

  /** Delivers one push and waits for the worker to finish with it. */
  const push = async (body: Record<string, unknown>) => {
    let done: Promise<unknown> = Promise.resolve();
    listeners.get("push")!({ data: { json: () => body, text: () => "" }, waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  };
  return { push, showNotification };
}

const chatPush = (roomId: string, extra: Record<string, unknown> = {}) => ({
  title: "Tola Teacher",
  body: "Can I leave early?",
  tag: `chat:${roomId}`,
  data: { type: "chat_message", roomId, chatId: roomId, url: `/messages?room=${roomId}`, ...extra },
});

describe("service worker: chat pushes", () => {
  it("skips the notification while a focused, visible window shows that room", async () => {
    const sw = loadServiceWorker([{ url: `${ORIGIN}/messages?room=r1`, focused: true, visibilityState: "visible" }]);
    await sw.push(chatPush("r1"));
    expect(sw.showNotification).not.toHaveBeenCalled();
  });

  it("goes by roomId even when the push has no URL", async () => {
    const sw = loadServiceWorker([{ url: `${ORIGIN}/messages?room=r1`, focused: true, visibilityState: "visible" }]);
    await sw.push({ title: "x", data: { type: "chat_message", roomId: "r1" } });
    expect(sw.showNotification).not.toHaveBeenCalled();
  });

  it("shows it when the room is open but the window isn't focused or visible", async () => {
    for (const win of [
      { url: `${ORIGIN}/messages?room=r1`, focused: false, visibilityState: "visible" as const },
      { url: `${ORIGIN}/messages?room=r1`, focused: true, visibilityState: "hidden" as const },
    ]) {
      const sw = loadServiceWorker([win]);
      await sw.push(chatPush("r1"));
      expect(sw.showNotification).toHaveBeenCalledTimes(1);
    }
  });

  it("shows it when a focused window shows another room, the room list or another page", async () => {
    for (const url of [`${ORIGIN}/messages?room=r2`, `${ORIGIN}/messages`, `${ORIGIN}/dashboard`]) {
      const sw = loadServiceWorker([{ url, focused: true, visibilityState: "visible" }]);
      await sw.push(chatPush("r1"));
      expect(sw.showNotification).toHaveBeenCalledWith(
        "Tola Teacher",
        expect.objectContaining({ body: "Can I leave early?", tag: "chat:r1", data: expect.objectContaining({ roomId: "r1" }) })
      );
    }
  });

  it("uses the older chatId when roomId is missing", async () => {
    const sw = loadServiceWorker([{ url: `${ORIGIN}/messages?room=r9`, focused: true, visibilityState: "visible" }]);
    await sw.push({ title: "x", data: { type: "chat_message", chatId: "r9" } });
    expect(sw.showNotification).not.toHaveBeenCalled();
  });

  it("keeps the page rule for other pushes", async () => {
    const sw = loadServiceWorker([{ url: `${ORIGIN}/leave-requests`, focused: true, visibilityState: "visible" }]);
    await sw.push({ title: "Leave request", data: { type: "leave_request", url: "/leave-requests" } });
    expect(sw.showNotification).not.toHaveBeenCalled();
    await sw.push({ title: "Payment", data: { type: "payment", url: "/payments" } });
    expect(sw.showNotification).toHaveBeenCalledTimes(1);
  });
});

describe("in-app banner", () => {
  const activity = { roomId: "r1", lastMessage: { senderId: "u-teacher" } };
  const base = { activity, currentUserId: "u-admin", pathname: "/messages", openRoomId: "r1" };

  it("is skipped for the open room while the page is focused", () => {
    expect(shouldAlertForActivity({ ...base, focused: true })).toBe(false);
  });

  it("shows for the open room while the page is in the background", () => {
    expect(shouldAlertForActivity({ ...base, focused: false })).toBe(true);
  });

  it("shows for another room even when focused", () => {
    expect(shouldAlertForActivity({ ...base, openRoomId: "r2", focused: true })).toBe(true);
  });

  it("reads focus from visibility and hasFocus", () => {
    const doc = (visibilityState: string, focused: boolean) =>
      ({ visibilityState, hasFocus: () => focused }) as unknown as Document;
    expect(isPageFocused(doc("visible", true))).toBe(true);
    expect(isPageFocused(doc("visible", false))).toBe(false);
    expect(isPageFocused(doc("hidden", true))).toBe(false);
  });
});
