import { authService } from "@/app/services/auth.service";

// auth.service uses fetch directly (not apiClient)
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Mock nookies so logout can read/destroy cookies without a browser
jest.mock("nookies", () => ({
  get: jest.fn(() => ({ access_token: "tok123" })),
  destroy: jest.fn(),
}));

// Provide localStorage stub for the Node test environment
Object.defineProperty(global, "localStorage", {
  value: { removeItem: jest.fn(), getItem: jest.fn(), setItem: jest.fn(), clear: jest.fn() },
  writable: true,
});

// Mock localStorage helpers used by getUserProfile / updateUserProfile
jest.mock("@/app/utils/localStorage", () => ({
  getLocalStorageItem: jest.fn(() => "access_token_value"),
}));

function ok(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}
function err(message: string, status = 400) {
  return Promise.resolve(new Response(JSON.stringify({ message }), { status }));
}

beforeEach(() => jest.clearAllMocks());

// ─── login ────────────────────────────────────────────────────────────────────

describe("authService.login", () => {
  it("posts credentials and returns tokens", async () => {
    const tokens = { access_token: "abc", refresh_token: "xyz" };
    mockFetch.mockReturnValueOnce(ok(tokens));
    await expect(authService.login({ email: "a@b.com", password: "pass" })).resolves.toEqual(tokens);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.email).toBe("a@b.com");
    expect(body.deviceToken).toBe("web");
    expect(body.platform).toBe("web");
  });

  it("uses provided deviceToken and platform", async () => {
    mockFetch.mockReturnValueOnce(ok({ access_token: "a", refresh_token: "b" }));
    await authService.login({ email: "a@b.com", password: "p", deviceToken: "mobile123", platform: "ios" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.deviceToken).toBe("mobile123");
    expect(body.platform).toBe("ios");
  });

  it("throws with server message on failure", async () => {
    mockFetch.mockReturnValueOnce(err("Invalid credentials", 401));
    await expect(authService.login({ email: "x@y.com", password: "wrong" })).rejects.toThrow("Invalid credentials");
  });
});

// ─── introspectToken ─────────────────────────────────────────────────────────

describe("authService.introspectToken", () => {
  it("posts token and returns introspect result", async () => {
    const result = { active: true, exp: 9999, iat: 1000, user: { userId: "u1", email: "a@b.com", firstName: "A", lastName: "B", role: "ADMIN", schoolId: "sc1", phoneNumber: "", isActive: true, isEmailVerified: true } };
    mockFetch.mockReturnValueOnce(ok(result));
    await expect(authService.introspectToken("tok")).resolves.toEqual(result);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer tok");
  });

  it("throws when token is invalid", async () => {
    mockFetch.mockReturnValueOnce(err("Invalid token", 401));
    await expect(authService.introspectToken("bad")).rejects.toThrow("Invalid token");
  });
});

// ─── forgotPassword ───────────────────────────────────────────────────────────

describe("authService.forgotPassword", () => {
  it("posts email and returns message", async () => {
    mockFetch.mockReturnValueOnce(ok({ message: "Reset code sent" }));
    await expect(authService.forgotPassword("a@b.com")).resolves.toEqual({ message: "Reset code sent" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.email).toBe("a@b.com");
  });

  it("throws on failure", async () => {
    mockFetch.mockReturnValueOnce(err("Email not found", 404));
    await expect(authService.forgotPassword("ghost@x.com")).rejects.toThrow("Email not found");
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe("authService.resetPassword", () => {
  it("posts email, token and new password", async () => {
    mockFetch.mockReturnValueOnce(ok({ message: "Password reset" }));
    await authService.resetPassword("a@b.com", "reset123", "newPass!");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.email).toBe("a@b.com");
    expect(body.token).toBe("reset123");
    expect(body.newPassword).toBe("newPass!");
  });

  it("throws when reset token is expired", async () => {
    mockFetch.mockReturnValueOnce(err("Token expired", 410));
    await expect(authService.resetPassword("a@b.com", "old", "p")).rejects.toThrow("Token expired");
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("authService.logout", () => {
  it("posts to logout endpoint with Bearer token from cookie", async () => {
    mockFetch.mockReturnValueOnce(ok({ message: "Logged out" }));
    await authService.logout();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer tok123");
  });

  it("throws when logout request fails", async () => {
    mockFetch.mockReturnValueOnce(err("Logout failed", 500));
    await expect(authService.logout()).rejects.toThrow("Logout failed");
  });
});
