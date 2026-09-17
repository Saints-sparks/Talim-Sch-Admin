import {
  createAnnouncement,
  getAnnouncementsBySender,
  getAnnouncementStatsBySender,
} from "@/app/services/announcement.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

jest.mock("@/lib/apiClient", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── createAnnouncement ───────────────────────────────────────────────────────

describe("createAnnouncement", () => {
  it("posts to the announcements endpoint and returns the created announcement", async () => {
    const announcement = { title: "Hello", content: "World" };
    const created = { id: "ann1", title: "Hello", content: "World", createdAt: "2025-01-01", reactions: {} };
    mockPost.mockResolvedValueOnce(created);

    await expect(createAnnouncement(announcement)).resolves.toEqual(created);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/announcements"),
      announcement
    );
  });

  it("sends the backend audience enum values untouched", async () => {
    mockPost.mockResolvedValueOnce({});
    await createAnnouncement({
      title: "Sports day",
      content: "Saturday",
      audience: ["all_parents", "all_students"],
      status: "SCHEDULED",
      scheduledFor: "2026-10-01T09:00:00.000Z",
    });

    expect(mockPost.mock.calls[0][1]).toMatchObject({
      audience: ["all_parents", "all_students"],
      status: "SCHEDULED",
      scheduledFor: "2026-10-01T09:00:00.000Z",
    });
  });

  it("surfaces the ApiError the client throws", async () => {
    mockPost.mockRejectedValueOnce(new ApiError("VALIDATION_FAILED", "Title is required", 422));
    await expect(createAnnouncement({ title: "", content: "" })).rejects.toThrow("Title is required");
  });
});

// ─── getAnnouncementsBySender ─────────────────────────────────────────────────

describe("getAnnouncementsBySender", () => {
  it("fetches with default page and limit when called with no query", async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: {} });
    await getAnnouncementsBySender("user1");

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });

  it("puts the status filter in the query so paging stays server-side", async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: {} });
    await getAnnouncementsBySender("user1", { page: 2, limit: 5, status: "PUBLISHED" });

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("limit=5");
    expect(url).toContain("status=PUBLISHED");
  });

  it("accepts the legacy (page, limit) number arguments", async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: {} });
    await getAnnouncementsBySender("user1", 3, 15);

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=3");
    expect(url).toContain("limit=15");
  });

  it("appends the search param when provided", async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: {} });
    await getAnnouncementsBySender("user1", { search: "sports day" });

    expect(mockGet.mock.calls[0][0] as string).toContain("search=sports+day");
  });

  it("omits status and search when they are not set", async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: {} });
    await getAnnouncementsBySender("user1", { page: 1 });

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).not.toContain("status=");
    expect(url).not.toContain("search=");
  });

  it("returns the announcement page as the API sent it", async () => {
    const response = {
      data: [{ id: "a1", title: "Test", content: "", createdAt: "", reactions: {} }],
      meta: { total: 1, page: 1, lastPage: 1, limit: 10 },
    };
    mockGet.mockResolvedValueOnce(response);
    await expect(getAnnouncementsBySender("user1")).resolves.toEqual(response);
  });

  it("throws on a server error", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("UNAUTHENTICATED", "Sign in to continue.", 401));
    await expect(getAnnouncementsBySender("user1")).rejects.toThrow(ApiError);
  });
});

// ─── getAnnouncementStatsBySender ─────────────────────────────────────────────

describe("getAnnouncementStatsBySender", () => {
  it("calls the stats endpoint with the sender id", async () => {
    const stats = {
      totalAnnouncements: 10,
      published: 5,
      scheduled: 2,
      drafts: 2,
      archived: 1,
      readRate: 70,
      parentEngagement: 60,
      studentEngagement: 50,
      dailyViews: [],
    };
    mockGet.mockResolvedValueOnce(stats);

    await expect(getAnnouncementStatsBySender("user1")).resolves.toEqual(stats);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("user1");
    expect(url).toContain("stats");
  });

  it("throws on failure", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("NOT_FOUND", "We couldn't find that.", 404));
    await expect(getAnnouncementStatsBySender("ghost")).rejects.toThrow(ApiError);
  });
});
