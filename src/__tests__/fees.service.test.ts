import {
  createFeeCategory,
  getFeeCategories,
  updateFeeCategory,
  archiveFeeCategory,
  restoreFeeCategory,
  createFeeItem,
  getFeeItems,
  getFeeItemById,
  updateFeeItem,
  updateFeeItemStatus,
  duplicateFeeItem,
  archiveFeeItem,
  restoreFeeItem,
  assignFeeToClasses,
  getFeeAssignments,
  updateFeeAssignment,
  publishFeeAssignment,
  unpublishFeeAssignment,
  archiveFeeAssignment,
  restoreFeeAssignment,
  getFeesDashboardSummary,
  getCategoriesSummary,
  getReceiptSettings,
  updateReceiptSettings,
} from "@/app/services/fees.service";
import { apiClient } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}
function err(message: string, status = 400) {
  return new Response(JSON.stringify({ message }), { status });
}

beforeEach(() => jest.clearAllMocks());

// ─── Categories ───────────────────────────────────────────────────────────────

describe("createFeeCategory", () => {
  it("posts to categories and returns created category", async () => {
    const cat = { _id: "cat1", name: "Tuition", description: "", status: "active", createdAt: "", updatedAt: "" };
    mockPost.mockResolvedValueOnce(ok(cat));
    await expect(createFeeCategory({ name: "Tuition" })).resolves.toEqual(cat);
    expect(mockPost).toHaveBeenCalledWith("/fees/categories", { name: "Tuition" });
  });

  it("throws on error", async () => {
    mockPost.mockResolvedValueOnce(err("Name already exists", 409));
    await expect(createFeeCategory({ name: "Tuition" })).rejects.toThrow("Name already exists");
  });
});

describe("getFeeCategories", () => {
  it("fetches without archived by default", async () => {
    mockGet.mockResolvedValueOnce(ok([]));
    await getFeeCategories();
    expect(mockGet).toHaveBeenCalledWith("/fees/categories?includeArchived=false");
  });

  it("includes archived when flag is true", async () => {
    mockGet.mockResolvedValueOnce(ok([]));
    await getFeeCategories(true);
    expect(mockGet).toHaveBeenCalledWith("/fees/categories?includeArchived=true");
  });

  it("returns array of categories", async () => {
    const cats = [{ _id: "c1", name: "Tuition" }];
    mockGet.mockResolvedValueOnce(ok(cats));
    await expect(getFeeCategories()).resolves.toEqual(cats);
  });
});

describe("updateFeeCategory", () => {
  it("patches category by id", async () => {
    const updated = { _id: "c1", name: "Updated" };
    mockPatch.mockResolvedValueOnce(ok(updated));
    await expect(updateFeeCategory("c1", { name: "Updated" })).resolves.toEqual(updated);
    expect(mockPatch).toHaveBeenCalledWith("/fees/categories/c1", { name: "Updated" });
  });
});

describe("archiveFeeCategory / restoreFeeCategory", () => {
  it("patches archive endpoint", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "c1", status: "archived" }));
    await archiveFeeCategory("c1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/categories/c1/archive");
  });

  it("patches restore endpoint", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "c1", status: "active" }));
    await restoreFeeCategory("c1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/categories/c1/restore");
  });
});

// ─── Fee Items ────────────────────────────────────────────────────────────────

describe("createFeeItem", () => {
  it("posts and returns fee item", async () => {
    const payload = { name: "School Fee", categoryId: "c1", feeType: "annual", defaultAmount: 5000 };
    const item = { _id: "fi1", ...payload, status: "draft", createdAt: "", updatedAt: "" };
    mockPost.mockResolvedValueOnce(ok(item));
    await expect(createFeeItem(payload)).resolves.toEqual(item);
  });
});

describe("getFeeItems", () => {
  it("builds query string from params", async () => {
    mockGet.mockResolvedValueOnce(ok({ data: [], total: 0 }));
    await getFeeItems({ page: 2, limit: 20, status: "active" });
    const call = mockGet.mock.calls[0][0] as string;
    expect(call).toContain("page=2");
    expect(call).toContain("limit=20");
    expect(call).toContain("status=active");
  });

  it("returns paginated response", async () => {
    const res = { data: [{ _id: "fi1" }], total: 1 };
    mockGet.mockResolvedValueOnce(ok(res));
    await expect(getFeeItems()).resolves.toEqual(res);
  });
});

describe("getFeeItemById", () => {
  it("calls correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(ok({ _id: "fi1" }));
    await getFeeItemById("fi1");
    expect(mockGet).toHaveBeenCalledWith("/fees/items/fi1");
  });
});

describe("updateFeeItem", () => {
  it("patches item", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "fi1", status: "active" }));
    await updateFeeItem("fi1", { status: "active" });
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1", { status: "active" });
  });
});

describe("updateFeeItemStatus", () => {
  it("delegates to updateFeeItem with status field", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "fi1", status: "inactive" }));
    await updateFeeItemStatus("fi1", "inactive");
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1", { status: "inactive" });
  });
});

describe("duplicateFeeItem", () => {
  it("posts to duplicate endpoint", async () => {
    mockPost.mockResolvedValueOnce(ok({ _id: "fi2" }));
    await duplicateFeeItem("fi1");
    expect(mockPost).toHaveBeenCalledWith("/fees/items/fi1/duplicate");
  });
});

describe("archiveFeeItem / restoreFeeItem", () => {
  it("archives item", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "fi1", status: "archived" }));
    await archiveFeeItem("fi1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1/archive");
  });

  it("restores item", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "fi1", status: "active" }));
    await restoreFeeItem("fi1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1/restore");
  });
});

// ─── Assignments ──────────────────────────────────────────────────────────────

describe("assignFeeToClasses", () => {
  it("posts assignment payload", async () => {
    const payload = { feeItemId: "fi1", classes: [{ classId: "c1", amount: 5000, dueDate: "2025-09-01" }] };
    const result = { assigned: 1, skipped: 0, assignments: [] };
    mockPost.mockResolvedValueOnce(ok(result));
    await expect(assignFeeToClasses(payload)).resolves.toEqual(result);
    expect(mockPost).toHaveBeenCalledWith("/fees/assignments", payload);
  });
});

describe("getFeeAssignments", () => {
  it("builds query from params", async () => {
    mockGet.mockResolvedValueOnce(ok({ data: [], total: 0 }));
    await getFeeAssignments({ classId: "c1", status: "active" });
    const call = mockGet.mock.calls[0][0] as string;
    expect(call).toContain("classId=c1");
    expect(call).toContain("status=active");
  });
});

describe("assignment lifecycle actions", () => {
  it("updateFeeAssignment patches the assignment", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "a1" }));
    await updateFeeAssignment("a1", { amount: 6000 });
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1", { amount: 6000 });
  });

  it("publishFeeAssignment calls publish endpoint", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "a1", status: "active" }));
    await publishFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/publish");
  });

  it("unpublishFeeAssignment calls unpublish endpoint", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "a1", status: "inactive" }));
    await unpublishFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/unpublish");
  });

  it("archiveFeeAssignment calls archive endpoint", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "a1" }));
    await archiveFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/archive");
  });

  it("restoreFeeAssignment calls restore endpoint", async () => {
    mockPatch.mockResolvedValueOnce(ok({ _id: "a1" }));
    await restoreFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/restore");
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("getFeesDashboardSummary", () => {
  it("returns dashboard summary", async () => {
    const summary = { totalFeeItems: 10, activeFeeItems: 5, totalExpectedAmount: 50000, paidAmount: 30000, outstandingAmount: 20000, feeCategories: 3, activeAssignments: 8 };
    mockGet.mockResolvedValueOnce(ok(summary));
    await expect(getFeesDashboardSummary()).resolves.toEqual(summary);
    expect(mockGet).toHaveBeenCalledWith("/fees/dashboard/summary");
  });
});

describe("getCategoriesSummary", () => {
  it("calls categories-summary endpoint", async () => {
    mockGet.mockResolvedValueOnce(ok([]));
    await getCategoriesSummary();
    expect(mockGet).toHaveBeenCalledWith("/fees/dashboard/categories-summary");
  });
});

// ─── Receipt Settings ─────────────────────────────────────────────────────────

describe("getReceiptSettings", () => {
  it("fetches receipt settings", async () => {
    const settings = { signatureUrl: "", signatureName: "Principal", signatureTitle: "Head", showSchoolLogo: true, allowParentDownload: false };
    mockGet.mockResolvedValueOnce(ok(settings));
    await expect(getReceiptSettings()).resolves.toEqual(settings);
  });
});

describe("updateReceiptSettings", () => {
  it("patches receipt settings", async () => {
    const patch = { signatureName: "New Principal" };
    mockPatch.mockResolvedValueOnce(ok({ ...patch, signatureUrl: "" }));
    await updateReceiptSettings(patch);
    expect(mockPatch).toHaveBeenCalledWith("/fees/receipt-settings", patch);
  });
});
