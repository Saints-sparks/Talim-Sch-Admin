/**
 * Unit tests for subAdminService
 * Uses the same node-environment + jest.fn() fetch pattern as other service tests.
 */

// ── Mock apiClient ────────────────────────────────────────────────────────────
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    patch: (...args: any[]) => mockPatch(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

import { subAdminService } from "@/services/subAdminService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function fail(message: string, status = 400) {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ message }),
    status,
  });
}

const STUB_SUB_ADMIN = {
  _id: "sa1",
  userId: "user-sa-001",
  email: "sub@school.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "school_sub_admin" as const,
  permissions: ["MANAGE_FEES", "MANAGE_STUDENTS"],
  isActive: true,
  schoolId: "school-001",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const STUB_PAGINATED = {
  data: [STUB_SUB_ADMIN],
  meta: { total: 1, page: 1, lastPage: 1, limit: 10 },
};

beforeEach(() => jest.clearAllMocks());

// ── getSubAdmins ──────────────────────────────────────────────────────────────

describe("subAdminService.getSubAdmins", () => {
  it("calls GET with correct URL and returns paginated result", async () => {
    mockGet.mockReturnValueOnce(ok(STUB_PAGINATED));
    const result = await subAdminService.getSubAdmins(1, 10);
    expect(mockGet).toHaveBeenCalledTimes(1);
    const url: string = mockGet.mock.calls[0][0];
    expect(url).toContain("/sub-admins");
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
    expect(result).toEqual(STUB_PAGINATED);
  });

  it("throws with server message on failure", async () => {
    mockGet.mockReturnValueOnce(fail("Unauthorized"));
    await expect(subAdminService.getSubAdmins()).rejects.toThrow("Unauthorized");
  });

  it("uses default page=1 limit=10 when called with no args", async () => {
    mockGet.mockReturnValueOnce(ok(STUB_PAGINATED));
    await subAdminService.getSubAdmins();
    const url: string = mockGet.mock.calls[0][0];
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });
});

// ── getSubAdminById ───────────────────────────────────────────────────────────

describe("subAdminService.getSubAdminById", () => {
  it("calls GET /sub-admins/:id and returns sub-admin", async () => {
    mockGet.mockReturnValueOnce(ok(STUB_SUB_ADMIN));
    const result = await subAdminService.getSubAdminById("user-sa-001");
    expect(mockGet.mock.calls[0][0]).toContain("/sub-admins/user-sa-001");
    expect(result).toEqual(STUB_SUB_ADMIN);
  });

  it("throws 'Sub-admin not found' on 404", async () => {
    mockGet.mockReturnValueOnce(fail("not found", 404));
    await expect(subAdminService.getSubAdminById("bad-id")).rejects.toThrow(
      "not found"
    );
  });
});

// ── createSubAdmin ────────────────────────────────────────────────────────────

describe("subAdminService.createSubAdmin", () => {
  const dto = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@school.com",
    permissions: ["MANAGE_FEES"],
  };

  it("POSTs to /sub-admins and returns created sub-admin", async () => {
    mockPost.mockReturnValueOnce(ok(STUB_SUB_ADMIN));
    const result = await subAdminService.createSubAdmin(dto);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toContain("/sub-admins");
    expect(mockPost.mock.calls[0][1]).toEqual(dto);
    expect(result).toEqual(STUB_SUB_ADMIN);
  });

  it("throws with server error message on failure", async () => {
    mockPost.mockReturnValueOnce(fail("Email already in use"));
    await expect(subAdminService.createSubAdmin(dto)).rejects.toThrow(
      "Email already in use"
    );
  });

  it("uses generic message when server returns no message", async () => {
    mockPost.mockReturnValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });
    await expect(subAdminService.createSubAdmin(dto)).rejects.toThrow(
      "Failed to create sub-admin"
    );
  });
});

// ── promoteTeacher ────────────────────────────────────────────────────────────

describe("subAdminService.promoteTeacher", () => {
  const dto = { userId: "teacher-001", permissions: ["MANAGE_STUDENTS"] };

  it("POSTs to /sub-admins/promote-teacher with correct body", async () => {
    mockPost.mockReturnValueOnce(ok(STUB_SUB_ADMIN));
    await subAdminService.promoteTeacher(dto);
    expect(mockPost.mock.calls[0][0]).toContain("promote-teacher");
    expect(mockPost.mock.calls[0][1]).toEqual(dto);
  });

  it("throws on API error", async () => {
    mockPost.mockReturnValueOnce(fail("Teacher not found"));
    await expect(subAdminService.promoteTeacher(dto)).rejects.toThrow(
      "Teacher not found"
    );
  });
});

// ── updatePermissions ─────────────────────────────────────────────────────────

describe("subAdminService.updatePermissions", () => {
  it("PATCHes /sub-admins/:id/permissions and returns updated sub-admin", async () => {
    const updated = { ...STUB_SUB_ADMIN, permissions: ["MANAGE_FINANCE"] };
    mockPatch.mockReturnValueOnce(ok(updated));
    const result = await subAdminService.updatePermissions("user-sa-001", {
      permissions: ["MANAGE_FINANCE"],
    });
    expect(mockPatch.mock.calls[0][0]).toContain(
      "/sub-admins/user-sa-001/permissions"
    );
    expect(result.permissions).toEqual(["MANAGE_FINANCE"]);
  });

  it("throws on API failure", async () => {
    mockPatch.mockReturnValueOnce(fail("Sub-admin not found"));
    await expect(
      subAdminService.updatePermissions("bad", { permissions: [] })
    ).rejects.toThrow("Sub-admin not found");
  });
});

// ── toggleStatus ──────────────────────────────────────────────────────────────

describe("subAdminService.toggleStatus", () => {
  it("PATCHes toggle-status endpoint and returns updated sub-admin", async () => {
    const toggled = { ...STUB_SUB_ADMIN, isActive: false };
    mockPatch.mockReturnValueOnce(ok(toggled));
    const result = await subAdminService.toggleStatus("user-sa-001");
    expect(mockPatch.mock.calls[0][0]).toContain("toggle-status");
    expect(result.isActive).toBe(false);
  });
});

// ── demoteSubAdmin ────────────────────────────────────────────────────────────

describe("subAdminService.demoteSubAdmin", () => {
  it("DELETEs /sub-admins/:id/demote and resolves void", async () => {
    mockDelete.mockReturnValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await expect(
      subAdminService.demoteSubAdmin("user-sa-001")
    ).resolves.toBeUndefined();
    expect(mockDelete.mock.calls[0][0]).toContain("/sub-admins/user-sa-001/demote");
  });

  it("throws on API failure", async () => {
    mockDelete.mockReturnValueOnce(fail("Cannot demote"));
    await expect(subAdminService.demoteSubAdmin("user-sa-001")).rejects.toThrow(
      "Cannot demote"
    );
  });
});
