import {
  createAnnouncement,
  getAnnouncementsBySender,
  getAnnouncementStatsBySender,
} from "@/app/services/announcement.service";
import { apiClient } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}
function err(message: string, status = 400) {
  return new Response(JSON.stringify({ message }), { status });
}

beforeEach(() => jest.clearAllMocks());

// ─── createAnnouncement ───────────────────────────────────────────────────────

describe("createAnnouncement", () => {
  it("posts to announcements endpoint and returns created announcement", async () => {
    const announcement = { title: "Hello", content: "World" };
    const created = { id: "ann1", title: "Hello", content: "World", createdAt: "2025-01-01", reactions: {} };
    mockPost.mockResolvedValueOnce(ok(created));
    await expect(createAnnouncement(announcement)).resolves.toEqual(created);
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining("/notifications/announcements"), announcement);
  });

  it("throws with server error message", async () => {
    mockPost.mockResolvedValueOnce(err("Title is required", 422));
    await expect(createAnnouncement({ title: "", content: "" })).rejects.toThrow("Title is required");
  });

  it("joins array error messages", async () => {
    mockPost.mockResolvedValueOnce(new Response(
      JSON.stringify({ message: ["title must not be empty", "content must not be empty"] }),
      { status: 422 }
    ));
    await expect(createAnnouncement({ title: "", content: "" }))
      .rejects.toThrow("title must not be empty, content must not be empty");
  });
});

// ─── getAnnouncementsBySender ─────────────────────────────────────────────────

describe("getAnnouncementsBySender", () => {
  it("fetches with default page and limit when called with no query", async () => {
    mockGet.mockResolvedValueOnce(ok({ data: [], meta: {} }));
    await getAnnouncementsBySender("user1");
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });

  it("accepts AnnouncementQuery object", async () => {
    mockGet.mockResolvedValueOnce(ok({ data: [], meta: {} }));
    await getAnnouncementsBySender("user1", { page: 2, limit: 5, status: "PUBLISHED" });
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("limit=5");
    expect(url).toContain("status=PUBLISHED");
  });

  it("accepts legacy (page, limit) number arguments", async () => {
    mockGet.mockResolvedValueOnce(ok({ data: [], meta: {} }));
    await getAnnouncementsBySender("user1", 3, 15);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=3");
    expect(url).toContain("limit=15");
  });

  it("appends search param when provided", async () => {
    mockGet.mockResolvedValueOnce(ok({ data: [], meta: {} }));
    await getAnnouncementsBySender("user1", { search: "sports day" });
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("search=sports+day");
  });

  it("returns announcement response", async () => {
    const response = { data: [{ id: "a1", title: "Test", content: "", createdAt: "", reactions: {} }], meta: { total: 1, page: 1, lastPage: 1, limit: 10 } };
    mockGet.mockResolvedValueOnce(ok(response));
    await expect(getAnnouncementsBySender("user1")).resolves.toEqual(response);
  });

  it("throws on server error", async () => {
    mockGet.mockResolvedValueOnce(err("Unauthorized", 401));
    await expect(getAnnouncementsBySender("user1")).rejects.toThrow();
  });
});

// ─── getAnnouncementStatsBySender ─────────────────────────────────────────────

describe("getAnnouncementStatsBySender", () => {
  it("calls stats endpoint with senderId", async () => {
    const stats = { totalAnnouncements: 10, published: 5, scheduled: 2, drafts: 2, archived: 1, readRate: 0.7, parentEngagement: 0.6, studentEngagement: 0.5, dailyViews: [] };
    mockGet.mockResolvedValueOnce(ok(stats));
    await expect(getAnnouncementStatsBySender("user1")).resolves.toEqual(stats);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("user1");
    expect(url).toContain("stats");
  });

  it("throws on failure", async () => {
    mockGet.mockResolvedValueOnce(err("Sender not found", 404));
    await expect(getAnnouncementStatsBySender("ghost")).rejects.toThrow();
  });
});
