import {
  getIncomingNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/services/notification.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), put: jest.fn(), patch: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockPatch = api.patch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("getIncomingNotifications", () => {
  it("asks for the signed-in user's own notifications", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await getIncomingNotifications("user-1");

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("/notifications?");
    expect(url).toContain("recipientId=user-1");
  });

  it("keeps the server's read state instead of guessing", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { _id: "n1", title: "A", isRead: true, createdAt: "2026-01-02T00:00:00.000Z" },
        { _id: "n2", title: "B", createdAt: "2026-01-01T00:00:00.000Z" },
      ],
    });

    const inbox = await getIncomingNotifications("user-1");
    expect(inbox.map((item) => item.isRead)).toEqual([true, false]);
  });

  it("sorts newest first", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { _id: "old", createdAt: "2026-01-01T00:00:00.000Z" },
        { _id: "new", createdAt: "2026-02-01T00:00:00.000Z" },
      ],
    });

    expect((await getIncomingNotifications("user-1")).map((n) => n.id)).toEqual(["new", "old"]);
  });

  it("falls back to known enum members when the API sends something unfamiliar", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ _id: "n1", source: "martian", category: "sports", priority: "urgent", status: "???" }],
    });

    const [item] = await getIncomingNotifications("user-1");
    expect(item.source).toBe("system");
    expect(item.category).toBe("other");
    expect(item.priority).toBe("medium");
    expect(item.status).toBe("sent");
  });

  it("merges the single attachment field into the attachments list", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ _id: "n1", attachments: ["a.pdf"], attachment: "b.pdf" }],
    });

    expect((await getIncomingNotifications("user-1"))[0].attachments).toEqual(["a.pdf", "b.pdf"]);
  });

  it("names the sender from the populated sender document", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ _id: "n1", senderId: { firstName: "Ada", lastName: "Lovelace", email: "a@b.c" } }],
    });

    const [item] = await getIncomingNotifications("user-1");
    expect(item.sentBy).toBe("Ada Lovelace");
    expect(item.sentByEmail).toBe("a@b.c");
  });

  it("copes with an empty body", async () => {
    mockGet.mockResolvedValueOnce({});
    await expect(getIncomingNotifications("user-1")).resolves.toEqual([]);
  });

  it("lets an ApiError through so the inbox can show an error state", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("SERVICE_UNAVAILABLE", "Try later.", 503));
    await expect(getIncomingNotifications("user-1")).rejects.toThrow(ApiError);
  });
});

describe("getUnreadNotificationCount", () => {
  it("counts an array of unread notifications", async () => {
    mockGet.mockResolvedValueOnce([{ _id: "a" }, { _id: "b" }]);
    await expect(getUnreadNotificationCount("user-1")).resolves.toBe(2);
  });

  it("reads a count object", async () => {
    mockGet.mockResolvedValueOnce({ count: 7 });
    await expect(getUnreadNotificationCount("user-1")).resolves.toBe(7);
  });

  it("falls back to zero for a shape it doesn't recognise", async () => {
    mockGet.mockResolvedValueOnce({});
    await expect(getUnreadNotificationCount("user-1")).resolves.toBe(0);
  });
});

describe("markNotificationAsRead", () => {
  it("PUTs to the notification's read endpoint, with the reader taken from the token", async () => {
    mockPut.mockResolvedValueOnce(undefined);
    await markNotificationAsRead("n1");
    expect(mockPut).toHaveBeenCalledWith("/notifications/n1/read");
  });
});

describe("markAllNotificationsAsRead", () => {
  it("clears the inbox in one request rather than one per notification", async () => {
    mockPatch.mockResolvedValueOnce(undefined);
    await markAllNotificationsAsRead();
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch).toHaveBeenCalledWith("/notifications/read-all");
  });
});
