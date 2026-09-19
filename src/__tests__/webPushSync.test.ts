/**
 * @jest-environment jsdom
 */
import {
  CONFIG_URL,
  PENDING_URL,
  SYNC_CACHE,
  USER_STORAGE_PREFIX,
  reconcileWebPush,
  reconcileWebPushForUser,
  revokeWebPushOnSignOut,
  dropLocalWebPush,
} from "@/lib/webPushSync";
import { api } from "@/lib/apiClient";
import { sessionStore } from "@/lib/session";

jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

// jsdom ships no fetch primitives; the shared-cache notes are stored as Responses.
if (typeof globalThis.Response === "undefined") {
  class TestResponse {
    constructor(private readonly body: string) {}
    text = async () => this.body;
    json = async () => JSON.parse(this.body);
  }
  Object.defineProperty(globalThis, "Response", { value: TestResponse, configurable: true });
}

const USER = "u1";
const deleteMock = api.delete as jest.Mock;
const postMock = api.post as jest.Mock;
const getMock = api.get as jest.Mock;

/** An in-memory stand-in for `caches`, holding JSON notes by URL. */
function fakeCaches(): { notes: Map<string, string>; api: unknown } {
  const notes = new Map<string, string>();
  const cache = {
    match: async (url: string) => (notes.has(url) ? new Response(notes.get(url)) : undefined),
    put: async (url: string, response: Response) => void notes.set(url, await response.text()),
    delete: async (url: string) => notes.delete(url),
  };
  return { notes, api: { open: async (name: string) => (name === SYNC_CACHE ? cache : Promise.reject(new Error(name))) } };
}

interface Browser {
  subscription: { endpoint: string; toJSON: () => unknown; unsubscribe: jest.Mock } | null;
  subscribe: jest.Mock;
  requestPermission: jest.Mock;
  notes: Map<string, string>;
  messageListeners: Array<(event: MessageEvent) => void>;
}

/** Makes `navigator.serviceWorker`, `PushManager`, `Notification` and `caches` behave like a push-capable browser. */
function stubBrowser(options: { permission: NotificationPermission; endpoint: string | null }): Browser {
  const makeSub = (endpoint: string) => ({
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: "p", auth: "a" } }),
    unsubscribe: jest.fn().mockResolvedValue(true),
  });
  const browser = {
    subscription: options.endpoint ? makeSub(options.endpoint) : null,
    subscribe: jest.fn(),
    requestPermission: jest.fn(),
    notes: new Map<string, string>(),
    messageListeners: [] as Array<(event: MessageEvent) => void>,
  } as Browser;
  browser.subscribe.mockImplementation(async () => {
    browser.subscription = makeSub("https://push.example/new");
    return browser.subscription;
  });

  const { notes, api: cachesApi } = fakeCaches();
  browser.notes = notes;
  Object.defineProperty(globalThis, "caches", { value: cachesApi, configurable: true });
  Object.defineProperty(window, "PushManager", { value: class {}, configurable: true });
  Object.defineProperty(window, "Notification", {
    value: { permission: options.permission, requestPermission: browser.requestPermission },
    configurable: true,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      getRegistration: jest.fn().mockResolvedValue({
        pushManager: { getSubscription: async () => browser.subscription, subscribe: browser.subscribe },
      }),
      register: jest.fn(),
      addEventListener: (_: string, listener: (event: MessageEvent) => void) => browser.messageListeners.push(listener),
      removeEventListener: (_: string, listener: (event: MessageEvent) => void) => {
        browser.messageListeners = browser.messageListeners.filter((l) => l !== listener);
      },
    },
  });
  Object.defineProperty(navigator, "permissions", { configurable: true, value: undefined });
  return browser;
}

/** Records that `USER` turned browser push on, last registered at `endpoint`. */
function optedIn(endpoint: string): void {
  localStorage.setItem(`${USER_STORAGE_PREFIX}${USER}`, endpoint);
}

/** The endpoint recorded for `USER`, if any. */
const recorded = () => localStorage.getItem(`${USER_STORAGE_PREFIX}${USER}`);

/** The endpoints the server was told to forget. */
function forgotten(): string[] {
  return deleteMock.mock.calls.map(([, config]) => JSON.parse(config.body).endpoint);
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStore.clear();
  postMock.mockResolvedValue({});
  deleteMock.mockResolvedValue({});
  getMock.mockResolvedValue({ publicKey: "AQAB" });
});

describe("reconcileWebPush", () => {
  it("does nothing for a user who never turned push on and holds no subscription, and never prompts", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: null });

    await expect(reconcileWebPush(USER)).resolves.toBe("idle");

    expect(postMock).not.toHaveBeenCalled();
    expect(browser.requestPermission).not.toHaveBeenCalled();
  });

  it("re-registers the browser's subscription so a lost server row heals", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });
    optedIn("https://push.example/a");

    await expect(reconcileWebPush(USER)).resolves.toBe("healed");

    expect(postMock).toHaveBeenCalledWith("/notifications/web-push/subscribe", {
      endpoint: "https://push.example/a",
      keys: { p256dh: "p", auth: "a" },
      userAgent: navigator.userAgent,
    });
    expect(deleteMock).not.toHaveBeenCalled();
    expect(browser.requestPermission).not.toHaveBeenCalled();
  });

  it("follows a rotated endpoint: registers the new one and forgets the old and any the worker noted", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/b" });
    optedIn("https://push.example/a");
    // The worker left a note naming an older endpoint too (two rotations while closed).
    browser.notes.set(PENDING_URL, JSON.stringify({ staleEndpoints: ["https://push.example/z"] }));

    await expect(reconcileWebPush(USER)).resolves.toBe("healed");

    expect(postMock).toHaveBeenCalledWith(
      "/notifications/web-push/subscribe",
      expect.objectContaining({ endpoint: "https://push.example/b" }),
    );
    expect(forgotten().sort()).toEqual(["https://push.example/a", "https://push.example/z"]);
    expect(recorded()).toBe("https://push.example/b");
    expect(browser.notes.has(PENDING_URL)).toBe(false);
  });

  it("re-subscribes silently, with the server's key, when the browser lost the subscription", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: null });
    optedIn("https://push.example/a");

    await expect(reconcileWebPush(USER)).resolves.toBe("resubscribed");

    expect(browser.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(postMock).toHaveBeenCalledWith(
      "/notifications/web-push/subscribe",
      expect.objectContaining({ endpoint: "https://push.example/new" }),
    );
    expect(forgotten()).toEqual(["https://push.example/a"]);
    expect(browser.requestPermission).not.toHaveBeenCalled();
    // The service worker is told the key so it can do this alone next time.
    expect(JSON.parse(browser.notes.get(CONFIG_URL) as string)).toMatchObject({ vapidKey: "AQAB" });
  });

  it.each<NotificationPermission>(["denied", "default"])(
    "clears the flag and the server record when permission is %s while the user was subscribed",
    async (permission) => {
      const browser = stubBrowser({ permission, endpoint: null });
      optedIn("https://push.example/a");

      await expect(reconcileWebPush(USER)).resolves.toBe("cleared");

      expect(recorded()).toBeNull();
      expect(forgotten()).toEqual(["https://push.example/a"]);
      expect(postMock).not.toHaveBeenCalled();
      expect(browser.requestPermission).not.toHaveBeenCalled();
    },
  );

  it("drops a subscription another account registered on this browser", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });
    localStorage.setItem(`${USER_STORAGE_PREFIX}someone-else`, "https://push.example/a");

    await expect(reconcileWebPush(USER)).resolves.toBe("dropped");

    expect(browser.subscription?.unsubscribe).toHaveBeenCalled();
    expect(localStorage.getItem(`${USER_STORAGE_PREFIX}someone-else`)).toBeNull();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("adopts a subscription nobody claims (made before owners were recorded) and registers it", async () => {
    stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });

    await expect(reconcileWebPush(USER)).resolves.toBe("healed");

    expect(recorded()).toBe("https://push.example/a");
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("never throws: a failing API reports 'failed' and keeps the flag for the next try", async () => {
    stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });
    optedIn("https://push.example/a");
    postMock.mockRejectedValueOnce(new Error("offline"));

    await expect(reconcileWebPush(USER)).resolves.toBe("failed");

    expect(recorded()).toBe("https://push.example/a");
  });

  it("reports unsupported browsers without touching anything", async () => {
    stubBrowser({ permission: "granted", endpoint: null });
    // @ts-expect-error simulate a browser without PushManager
    delete window.PushManager;

    await expect(reconcileWebPush(USER)).resolves.toBe("unsupported");
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe("reconcileWebPushForUser", () => {
  it("reconciles now and again when the service worker reports a rotated subscription", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });
    optedIn("https://push.example/a");

    await reconcileWebPushForUser(USER);
    expect(postMock).toHaveBeenCalledTimes(1);

    browser.messageListeners.forEach((listener) =>
      listener({ data: { type: "PUSH_SUBSCRIPTION_CHANGED" } } as MessageEvent),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(postMock).toHaveBeenCalledTimes(2);

    // Unrelated messages (notification clicks) are ignored.
    browser.messageListeners.forEach((listener) => listener({ data: { type: "OPEN_URL" } } as MessageEvent));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(postMock).toHaveBeenCalledTimes(2);

    // Signing out stops listening.
    sessionStore.set({ userId: USER, email: "a@b.c", role: "school_admin" });
    await revokeWebPushOnSignOut();
    expect(browser.messageListeners).toHaveLength(0);
  });
});

describe("revokeWebPushOnSignOut", () => {
  it("forgets the user's flag and every endpoint they hold, on the server and in the browser", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });
    sessionStore.set({ userId: USER, email: "a@b.c", role: "school_admin" });
    optedIn("https://push.example/old");
    localStorage.setItem("talim:push-subscribed", "true");
    const subscription = browser.subscription!;

    await revokeWebPushOnSignOut();

    expect(recorded()).toBeNull();
    expect(localStorage.getItem("talim:push-subscribed")).toBeNull();
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(forgotten().sort()).toEqual(["https://push.example/a", "https://push.example/old"]);
  });

  it("never throws, so signing out cannot fail because of push cleanup", async () => {
    stubBrowser({ permission: "granted", endpoint: "https://push.example/a" });
    deleteMock.mockRejectedValue(new Error("offline"));

    await expect(revokeWebPushOnSignOut()).resolves.toBeUndefined();
  });
});

describe("dropLocalWebPush (forced sign-out: the token is already invalid)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unsubscribes the browser and clears the flag without a single request", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/mine" });
    optedIn("https://push.example/mine");

    await dropLocalWebPush(USER);

    expect(browser.subscription?.unsubscribe).toHaveBeenCalledTimes(1);
    expect(recorded()).toBeNull();
    // A request here would 401, try to refresh, fail, and trigger the same forced sign-out again.
    expect(deleteMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("clears the flag even when there is no subscription, or the user is unknown", async () => {
    stubBrowser({ permission: "granted", endpoint: null });
    optedIn("https://push.example/stale");

    await dropLocalWebPush(USER);
    expect(recorded()).toBeNull();
    await expect(dropLocalWebPush(null)).resolves.toBeUndefined();
  });

  it("never throws, so a forced sign-out cannot fail because of push cleanup", async () => {
    const browser = stubBrowser({ permission: "granted", endpoint: "https://push.example/mine" });
    browser.subscription!.unsubscribe.mockRejectedValueOnce(new Error("worker gone"));

    await expect(dropLocalWebPush(USER)).resolves.toBeUndefined();
  });
});
