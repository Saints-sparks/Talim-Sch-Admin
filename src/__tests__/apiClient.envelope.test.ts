/**
 * The backend wraps success bodies as `{ success: true, data, meta? }` once
 * `API_ENVELOPE_SUCCESS` is on, and sends them bare while it is off. Every
 * caller must see the same payload either way, or switching the flag on would
 * blank every page. These tests run the real client over both shapes.
 */
import { api, unwrapEnvelope } from "@/lib/apiClient";
import { chatService } from "@/app/services/chat.service";

function respondWith(body: unknown, status = 200): jest.Mock {
  const fn = jest.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("unwrapEnvelope", () => {
  it("unwraps exactly { success: true, data } and { success, data, meta }", () => {
    expect(unwrapEnvelope({ success: true, data: [1, 2] })).toEqual([1, 2]);
    expect(unwrapEnvelope({ success: true, data: { a: 1 }, meta: { page: 1 } })).toEqual({ a: 1 });
    expect(unwrapEnvelope({ success: true, data: null })).toBeNull();
  });

  it("leaves legacy bodies alone, including { success: true, ...fields }", () => {
    const legacy = { success: true, fees: [{ id: 1 }] };
    expect(unwrapEnvelope(legacy)).toBe(legacy);
    expect(unwrapEnvelope({ data: [1], total: 1 })).toEqual({ data: [1], total: 1 });
    expect(unwrapEnvelope([1, 2])).toEqual([1, 2]);
    expect(unwrapEnvelope("text")).toBe("text");
    expect(unwrapEnvelope(null)).toBeNull();
  });

  it("does not unwrap a body that only looks like an envelope", () => {
    const notOne = { success: true, data: [1], extra: true };
    expect(unwrapEnvelope(notOne)).toBe(notOne);
    expect(unwrapEnvelope({ success: false, data: [1] })).toEqual({ success: false, data: [1] });
  });
});

describe("typed client (api.*) gives the same payload with the envelope on or off", () => {
  it("a bare list (flag off)", async () => {
    respondWith({ data: [{ _id: "c1" }], total: 1 });
    await expect(api.get("/classes")).resolves.toEqual({ data: [{ _id: "c1" }], total: 1 });
  });

  it("the same list enveloped (flag on) — the payload the bare body had", async () => {
    respondWith({ success: true, data: { data: [{ _id: "c1" }], total: 1 } });
    await expect(api.get("/classes")).resolves.toEqual({ data: [{ _id: "c1" }], total: 1 });
  });

  it("an object payload, enveloped with meta", async () => {
    respondWith({ success: true, data: { name: "Ada" }, meta: { requestId: "r1" } });
    await expect(api.get<{ name: string }>("/auth/profile/1")).resolves.toEqual({ name: "Ada" });
  });

  it("errors still become typed ApiErrors, enveloped or not", async () => {
    respondWith({ success: false, error: { code: "NOT_FOUND", message: "Class not found" } }, 404);
    await expect(api.get("/classes/x")).rejects.toMatchObject({ code: "NOT_FOUND", message: "Class not found" });
  });
});

describe("legacy raw-Response readers (chat REST) unwrap too", () => {
  it("reads a count from a bare body", async () => {
    respondWith(7);
    await expect(chatService.getUnreadMessageCount()).resolves.toBe(7);
  });

  it("reads the same count from an enveloped body", async () => {
    respondWith({ success: true, data: 7 });
    await expect(chatService.getUnreadMessageCount()).resolves.toBe(7);
  });
});

describe("file upload (raw XMLHttpRequest, so it reads its own body)", () => {
  class FakeXhr {
    static instances: FakeXhr[] = [];
    status = 200;
    responseText = "";
    withCredentials = false;
    upload = { addEventListener: jest.fn() };
    private listeners: Record<string, () => void> = {};
    constructor() {
      FakeXhr.instances.push(this);
    }
    open = jest.fn();
    setRequestHeader = jest.fn();
    addEventListener(name: string, cb: () => void) {
      this.listeners[name] = cb;
    }
    send() {
      this.listeners.load?.();
    }
  }

  async function uploadReturning(body: unknown): Promise<string> {
    FakeXhr.instances = [];
    (global as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = class extends FakeXhr {
      constructor() {
        super();
        this.responseText = JSON.stringify(body);
      }
    };
    const { uploadImage } = await import("@/app/services/files.service");
    return uploadImage(new File(["x"], "a.png", { type: "image/png" }));
  }

  it("finds the URL in a bare body", async () => {
    await expect(uploadReturning({ url: "https://cdn/x.png" })).resolves.toBe("https://cdn/x.png");
  });

  it("finds the URL in an enveloped body", async () => {
    await expect(uploadReturning({ success: true, data: { url: "https://cdn/x.png" } })).resolves.toBe(
      "https://cdn/x.png",
    );
  });
});
