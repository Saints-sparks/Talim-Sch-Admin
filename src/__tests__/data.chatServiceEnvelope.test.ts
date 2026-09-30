/**
 * The room list and a new group read the same with the API's success
 * envelope on (`{ success: true, data }`) as off. With it on, the list came
 * back empty (every REST refresh cleared the sidebar) and creating a group
 * failed with "missing room id" (found by the Round 4 browser run).
 */
import { chatService } from "@/app/services/chat.service";
import { apiClient } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  ...jest.requireActual("@/lib/apiClient"),
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() },
}));

const client = apiClient as unknown as { get: jest.Mock; post: jest.Mock };
const room = {
  _id: "68c0a1b2c3d4e5f6000000c1",
  roomId: "68c0a1b2c3d4e5f6000000c1",
  type: "office",
  name: "School office",
  participants: [],
  category: "office",
  subtitle: "Office thread · Tolu Teacher",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => jest.clearAllMocks());

describe("chatService with the success envelope on or off", () => {
  it.each([
    ["off", [room]],
    ["on", { success: true, data: [room] }],
  ])("lists the rooms with the envelope %s", async (_mode, body) => {
    client.get.mockResolvedValue(json(body));
    const rooms = await chatService.getUserChatRooms();
    expect(rooms.map((r) => r._id)).toEqual([room._id]);
  });

  it.each([
    ["off", { ...room, type: "custom_group", name: "Staff room" }],
    ["on", { success: true, data: { ...room, type: "custom_group", name: "Staff room" } }],
  ])("creates a group with the envelope %s", async (_mode, body) => {
    client.post.mockResolvedValue(json(body, 201));
    const created = await chatService.createGroupChat({ type: "custom_group", name: "Staff room", participants: [] } as never);
    expect(created._id).toBe(room._id);
  });
});
