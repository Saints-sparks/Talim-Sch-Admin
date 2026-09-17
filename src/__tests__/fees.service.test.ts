/**
 * Fees service — endpoint, payload and query-string contract.
 *
 * Money moves through these calls, so each test pins the exact URL and body
 * sent to the API against the backend DTOs in
 * `talimBE-V2/src/modules/fees/data/dtos`.
 */
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
  uploadReceiptSignature,
} from "@/app/services/fees.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

jest.mock("@/lib/apiClient", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── Categories ───────────────────────────────────────────────────────────────

describe("createFeeCategory", () => {
  it("posts to categories and returns the created category", async () => {
    const cat = { _id: "cat1", name: "Tuition", description: "", status: "active", createdAt: "", updatedAt: "" };
    mockPost.mockResolvedValueOnce(cat);
    await expect(createFeeCategory({ name: "Tuition" })).resolves.toEqual(cat);
    expect(mockPost).toHaveBeenCalledWith("/fees/categories", { name: "Tuition" });
  });

  it("propagates the ApiError the client throws", async () => {
    mockPost.mockRejectedValueOnce(new ApiError("CONFLICT", "Name already exists", 409));
    await expect(createFeeCategory({ name: "Tuition" })).rejects.toThrow("Name already exists");
  });
});

describe("getFeeCategories", () => {
  it("excludes archived by default", async () => {
    mockGet.mockResolvedValueOnce([]);
    await getFeeCategories();
    expect(mockGet).toHaveBeenCalledWith("/fees/categories?includeArchived=false");
  });

  it("includes archived when asked", async () => {
    mockGet.mockResolvedValueOnce([]);
    await getFeeCategories(true);
    expect(mockGet).toHaveBeenCalledWith("/fees/categories?includeArchived=true");
  });

  it("returns the array of categories", async () => {
    const cats = [{ _id: "c1", name: "Tuition" }];
    mockGet.mockResolvedValueOnce(cats);
    await expect(getFeeCategories()).resolves.toEqual(cats);
  });
});

describe("updateFeeCategory", () => {
  it("patches the category by id", async () => {
    const updated = { _id: "c1", name: "Updated" };
    mockPatch.mockResolvedValueOnce(updated);
    await expect(updateFeeCategory("c1", { name: "Updated" })).resolves.toEqual(updated);
    expect(mockPatch).toHaveBeenCalledWith("/fees/categories/c1", { name: "Updated" });
  });
});

describe("archiveFeeCategory / restoreFeeCategory", () => {
  it("patches the archive endpoint", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "c1", status: "archived" });
    await archiveFeeCategory("c1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/categories/c1/archive");
  });

  it("patches the restore endpoint", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "c1", status: "active" });
    await restoreFeeCategory("c1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/categories/c1/restore");
  });
});

// ─── Fee Items ────────────────────────────────────────────────────────────────

describe("createFeeItem", () => {
  it("posts the DTO payload unchanged", async () => {
    const payload = {
      name: "School Fee",
      categoryId: "c1",
      feeType: "annual" as const,
      defaultAmount: 5000,
    };
    const item = { _id: "fi1", ...payload, status: "draft", createdAt: "", updatedAt: "" };
    mockPost.mockResolvedValueOnce(item);
    await expect(createFeeItem(payload)).resolves.toEqual(item);
    expect(mockPost).toHaveBeenCalledWith("/fees/items", payload);
  });
});

describe("getFeeItems", () => {
  it("builds the query string from the params", async () => {
    mockGet.mockResolvedValueOnce({ data: [], total: 0 });
    await getFeeItems({ page: 2, limit: 20, status: "active" });
    const call = mockGet.mock.calls[0][0] as string;
    expect(call).toContain("page=2");
    expect(call).toContain("limit=20");
    expect(call).toContain("status=active");
  });

  it("drops undefined and empty filters so the API never sees `status=`", async () => {
    mockGet.mockResolvedValueOnce({ data: [], total: 0 });
    await getFeeItems({ page: 1, search: "", categoryId: undefined, status: undefined });
    expect(mockGet).toHaveBeenCalledWith("/fees/items?page=1");
  });

  it("sends no query string at all when nothing is set", async () => {
    mockGet.mockResolvedValueOnce({ data: [], total: 0 });
    await getFeeItems();
    expect(mockGet).toHaveBeenCalledWith("/fees/items");
  });

  it("returns the paginated response", async () => {
    const res = { data: [{ _id: "fi1" }], total: 1 };
    mockGet.mockResolvedValueOnce(res);
    await expect(getFeeItems()).resolves.toEqual(res);
  });
});

describe("getFeeItemById", () => {
  it("calls the item endpoint", async () => {
    mockGet.mockResolvedValueOnce({ _id: "fi1" });
    await getFeeItemById("fi1");
    expect(mockGet).toHaveBeenCalledWith("/fees/items/fi1");
  });
});

describe("updateFeeItem", () => {
  it("patches only the fields it is given", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "fi1", status: "active" });
    await updateFeeItem("fi1", { status: "active" });
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1", { status: "active" });
  });
});

describe("updateFeeItemStatus", () => {
  it("delegates to updateFeeItem with just the status", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "fi1", status: "inactive" });
    await updateFeeItemStatus("fi1", "inactive");
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1", { status: "inactive" });
  });
});

describe("duplicateFeeItem", () => {
  it("posts to the duplicate endpoint", async () => {
    mockPost.mockResolvedValueOnce({ _id: "fi2" });
    await duplicateFeeItem("fi1");
    expect(mockPost).toHaveBeenCalledWith("/fees/items/fi1/duplicate");
  });
});

describe("archiveFeeItem / restoreFeeItem", () => {
  it("archives the item", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "fi1", status: "archived" });
    await archiveFeeItem("fi1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1/archive");
  });

  it("restores the item", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "fi1", status: "active" });
    await restoreFeeItem("fi1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/items/fi1/restore");
  });
});

// ─── Assignments ──────────────────────────────────────────────────────────────

describe("assignFeeToClasses", () => {
  it("posts the assignment payload unchanged", async () => {
    const payload = {
      feeItemId: "fi1",
      classes: [{ classId: "c1", amount: 5000, dueDate: "2025-09-01" }],
    };
    const result = { assigned: 1, skipped: 0, assignments: [] };
    mockPost.mockResolvedValueOnce(result);
    await expect(assignFeeToClasses(payload)).resolves.toEqual(result);
    expect(mockPost).toHaveBeenCalledWith("/fees/assignments", payload);
  });
});

describe("getFeeAssignments", () => {
  it("builds the query from the params", async () => {
    mockGet.mockResolvedValueOnce({ data: [], total: 0 });
    await getFeeAssignments({ classId: "c1", status: "active" });
    const call = mockGet.mock.calls[0][0] as string;
    expect(call).toContain("classId=c1");
    expect(call).toContain("status=active");
  });
});

describe("assignment lifecycle actions", () => {
  it("updateFeeAssignment patches the assignment", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "a1" });
    await updateFeeAssignment("a1", { amount: 6000 });
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1", { amount: 6000 });
  });

  it("publishFeeAssignment calls the publish endpoint", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "a1", status: "active" });
    await publishFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/publish");
  });

  it("unpublishFeeAssignment calls the unpublish endpoint", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "a1", status: "inactive" });
    await unpublishFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/unpublish");
  });

  it("archiveFeeAssignment calls the archive endpoint", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "a1" });
    await archiveFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/archive");
  });

  it("restoreFeeAssignment calls the restore endpoint", async () => {
    mockPatch.mockResolvedValueOnce({ _id: "a1" });
    await restoreFeeAssignment("a1");
    expect(mockPatch).toHaveBeenCalledWith("/fees/assignments/a1/restore");
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("getFeesDashboardSummary", () => {
  it("returns the dashboard summary", async () => {
    const summary = {
      totalFeeItems: 10,
      activeFeeItems: 5,
      totalExpectedAmount: 50000,
      paidAmount: 30000,
      outstandingAmount: 20000,
      feeCategories: 3,
      activeAssignments: 8,
    };
    mockGet.mockResolvedValueOnce(summary);
    await expect(getFeesDashboardSummary()).resolves.toEqual(summary);
    expect(mockGet).toHaveBeenCalledWith("/fees/dashboard/summary");
  });
});

describe("getCategoriesSummary", () => {
  it("calls the categories-summary endpoint", async () => {
    mockGet.mockResolvedValueOnce([]);
    await getCategoriesSummary();
    expect(mockGet).toHaveBeenCalledWith("/fees/dashboard/categories-summary");
  });
});

// ─── Receipt Settings ─────────────────────────────────────────────────────────

describe("getReceiptSettings", () => {
  it("fetches the receipt settings", async () => {
    const settings = {
      signatureUrl: "",
      signatureName: "Principal",
      signatureTitle: "Head",
      showSchoolLogo: true,
      allowParentDownload: false,
    };
    mockGet.mockResolvedValueOnce(settings);
    await expect(getReceiptSettings()).resolves.toEqual(settings);
    expect(mockGet).toHaveBeenCalledWith("/fees/receipt-settings");
  });
});

describe("updateReceiptSettings", () => {
  it("patches the receipt settings", async () => {
    const patch = { signatureName: "New Principal" };
    mockPatch.mockResolvedValueOnce({ ...patch, signatureUrl: "" });
    await updateReceiptSettings(patch);
    expect(mockPatch).toHaveBeenCalledWith("/fees/receipt-settings", patch);
  });
});

describe("uploadReceiptSignature", () => {
  it("posts the file as multipart form data to the image upload endpoint", async () => {
    mockPost.mockResolvedValueOnce({ url: "https://cdn.test/sig.png" });
    const file = new File(["signature"], "sig.png", { type: "image/png" });
    await expect(uploadReceiptSignature(file)).resolves.toEqual({ url: "https://cdn.test/sig.png" });

    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe("/upload/image");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(file);
  });
});
