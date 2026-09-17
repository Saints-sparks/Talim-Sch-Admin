import {
  getLeaveRequestById,
  getLeaveRequests,
  updateLeaveRequestStatus,
} from "@/app/services/leave.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), put: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPut = api.put as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("getLeaveRequests", () => {
  it("reads the school-admin queue endpoint", async () => {
    mockGet.mockResolvedValueOnce([]);
    await getLeaveRequests();
    expect(mockGet.mock.calls[0][0] as string).toContain("/leave-requests/school-admin/all");
  });

  it("returns the queue as the API sent it", async () => {
    const queue = [{ _id: "l1", status: "Pending" }];
    mockGet.mockResolvedValueOnce(queue);
    await expect(getLeaveRequests()).resolves.toBe(queue);
  });

  it("lets an ApiError through so the page can show it", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("FORBIDDEN", "You don't have access to this.", 403));
    await expect(getLeaveRequests()).rejects.toThrow(ApiError);
  });
});

describe("getLeaveRequestById", () => {
  it("reads /leave-requests/:id", async () => {
    mockGet.mockResolvedValueOnce({});
    await getLeaveRequestById("64aef4d2c7d2b7a91d12qrst");
    expect(mockGet).toHaveBeenCalledWith("/leave-requests/64aef4d2c7d2b7a91d12qrst");
  });

  it("escapes the id instead of building a broken path", async () => {
    mockGet.mockResolvedValueOnce({});
    await getLeaveRequestById("a/b");
    expect(mockGet).toHaveBeenCalledWith("/leave-requests/a%2Fb");
  });
});

describe("updateLeaveRequestStatus", () => {
  it("PUTs the title-cased status the backend enum uses", async () => {
    mockPut.mockResolvedValueOnce({});
    await updateLeaveRequestStatus("l1", { status: "Approved" });

    expect(mockPut).toHaveBeenCalledWith("/leave-requests/l1/status", {
      status: "Approved",
      viewed: true,
    });
  });

  it("marks the request viewed by default, so the parent app stops flagging it", async () => {
    mockPut.mockResolvedValueOnce({});
    await updateLeaveRequestStatus("l1", { status: "Rejected" });
    expect(mockPut.mock.calls[0][1]).toMatchObject({ viewed: true });
  });

  it("honours an explicit viewed flag", async () => {
    mockPut.mockResolvedValueOnce({});
    await updateLeaveRequestStatus("l1", { status: "Approved", viewed: false });
    expect(mockPut.mock.calls[0][1]).toMatchObject({ viewed: false });
  });

  it("sends a decline reason when one was given", async () => {
    mockPut.mockResolvedValueOnce({});
    await updateLeaveRequestStatus("l1", { status: "Rejected", declineReason: "No documents" });
    expect(mockPut.mock.calls[0][1]).toMatchObject({ declineReason: "No documents" });
  });

  it("omits declineReason entirely when there is none — the DTO forbids unknown empties", async () => {
    mockPut.mockResolvedValueOnce({});
    await updateLeaveRequestStatus("l1", { status: "Rejected", declineReason: "" });
    expect(mockPut.mock.calls[0][1]).not.toHaveProperty("declineReason");
  });
});
