/**
 * @jest-environment jsdom
 *
 * subAdminService now goes through the typed `api` facade, so these exercise
 * the real request the client builds and the real `ApiError` it throws.
 */
import { subAdminService } from "@/app/services/sub-admin.service";
import { ApiError } from "@/lib/apiError";

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

const respond = (status: number, body: unknown) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)),
    json: () => Promise.resolve(body),
  });

const last = () => {
  const [url, options] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
  return {
    url: String(url),
    method: options.method,
    body: options.body ? JSON.parse(options.body) : undefined,
  };
};

const STUB_SUB_ADMIN = {
  _id: "sa1",
  userId: "user-sa-001",
  email: "sub@school.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "school_sub_admin" as const,
  permissions: ["manage:fees", "manage:students"],
  isActive: true,
  schoolId: "school-001",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const STUB_PAGINATED = {
  data: [STUB_SUB_ADMIN],
  meta: { total: 1, page: 1, lastPage: 1, limit: 10 },
};

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.setItem("accessToken", "tok");
});

describe("subAdminService.getSubAdmins", () => {
  it("GETs the paginated list", async () => {
    mockFetch.mockReturnValueOnce(respond(200, STUB_PAGINATED));
    const result = await subAdminService.getSubAdmins(2, 25);
    expect(last().method).toBe("GET");
    expect(last().url).toContain("/sub-admins");
    expect(last().url).toContain("page=2");
    expect(last().url).toContain("limit=25");
    expect(result).toEqual(STUB_PAGINATED);
  });

  it("defaults to page 1, 10 per page", async () => {
    mockFetch.mockReturnValueOnce(respond(200, STUB_PAGINATED));
    await subAdminService.getSubAdmins();
    expect(last().url).toContain("page=1");
    expect(last().url).toContain("limit=10");
  });

  it("surfaces the API's error code and message", async () => {
    mockFetch.mockReturnValueOnce(
      respond(403, { error: { code: "FORBIDDEN", message: "Only the school admin can do this" } }),
    );
    await expect(subAdminService.getSubAdmins()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Only the school admin can do this",
    });
  });
});

describe("subAdminService.getSubAdminById", () => {
  it("GETs one sub-admin by user id", async () => {
    mockFetch.mockReturnValueOnce(respond(200, STUB_SUB_ADMIN));
    const result = await subAdminService.getSubAdminById("user-sa-001");
    expect(last().url).toContain("/sub-admins/user-sa-001");
    expect(result).toEqual(STUB_SUB_ADMIN);
  });

  it("reports a missing sub-admin as NOT_FOUND", async () => {
    mockFetch.mockReturnValueOnce(respond(404, { error: { code: "NOT_FOUND", message: "Sub-admin not found" } }));
    await expect(subAdminService.getSubAdminById("bad-id")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("subAdminService.createSubAdmin", () => {
  const dto = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@school.com",
    permissions: ["manage:fees"],
  };

  it("POSTs the DTO and unwraps the sub-admin with its temporary password", async () => {
    mockFetch.mockReturnValueOnce(
      respond(201, { message: "created", subAdmin: STUB_SUB_ADMIN, temporaryPassword: "Temp-1234" }),
    );
    const result = await subAdminService.createSubAdmin(dto);
    expect(last()).toMatchObject({ method: "POST", body: dto });
    expect(result).toMatchObject({ _id: "sa1", temporaryPassword: "Temp-1234" });
  });

  it("accepts a bare sub-admin body as well as the envelope", async () => {
    mockFetch.mockReturnValueOnce(respond(201, STUB_SUB_ADMIN));
    await expect(subAdminService.createSubAdmin(dto)).resolves.toMatchObject({ _id: "sa1" });
  });

  it("reports a taken email as CONFLICT", async () => {
    mockFetch.mockReturnValueOnce(
      respond(409, { error: { code: "CONFLICT", message: "Email already in use" } }),
    );
    await expect(subAdminService.createSubAdmin(dto)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Email already in use",
    });
  });

  it("falls back to a readable message when the server sends none", async () => {
    mockFetch.mockReturnValueOnce(respond(500, {}));
    const error = await subAdminService.createSubAdmin(dto).catch((err) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toMatch(/something went wrong/i);
  });
});

describe("subAdminService.promoteTeacher", () => {
  const dto = { userId: "teacher-001", permissions: ["manage:students"] };

  it("POSTs to promote-teacher with the teacher's user id", async () => {
    mockFetch.mockReturnValueOnce(respond(201, { subAdmin: STUB_SUB_ADMIN }));
    await subAdminService.promoteTeacher(dto);
    expect(last().url).toContain("promote-teacher");
    expect(last().body).toEqual(dto);
  });
});

describe("subAdminService.updatePermissions", () => {
  it("PATCHes the full replacement set", async () => {
    const updated = { ...STUB_SUB_ADMIN, permissions: ["manage:finance"] };
    mockFetch.mockReturnValueOnce(respond(200, { subAdmin: updated }));
    const result = await subAdminService.updatePermissions("user-sa-001", {
      permissions: ["manage:finance"],
    });
    expect(last().method).toBe("PATCH");
    expect(last().url).toContain("/sub-admins/user-sa-001/permissions");
    expect(last().body).toEqual({ permissions: ["manage:finance"] });
    expect(result.permissions).toEqual(["manage:finance"]);
  });
});

describe("subAdminService.toggleStatus", () => {
  it("PATCHes the toggle-status route and returns the updated sub-admin", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { subAdmin: { ...STUB_SUB_ADMIN, isActive: false } }));
    const result = await subAdminService.toggleStatus("user-sa-001");
    expect(last().url).toContain("toggle-status");
    expect(result.isActive).toBe(false);
  });
});

describe("subAdminService.demoteSubAdmin", () => {
  it("DELETEs the demote route and resolves with nothing", async () => {
    mockFetch.mockReturnValueOnce(respond(204, undefined));
    await expect(subAdminService.demoteSubAdmin("user-sa-001")).resolves.toBeUndefined();
    expect(last().method).toBe("DELETE");
    expect(last().url).toContain("/sub-admins/user-sa-001/demote");
  });

  it("surfaces a refusal from the API", async () => {
    mockFetch.mockReturnValueOnce(
      respond(400, { error: { code: "BAD_REQUEST", message: "Cannot demote" } }),
    );
    await expect(subAdminService.demoteSubAdmin("user-sa-001")).rejects.toMatchObject({
      message: "Cannot demote",
    });
  });
});
