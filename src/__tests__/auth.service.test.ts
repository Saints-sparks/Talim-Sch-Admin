/** @jest-environment jsdom */
import { authService } from "@/app/services/auth.service";
import { ApiError } from "@/lib/apiError";

// auth.service goes through the shared API client, which calls fetch.
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

function respond(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)),
  });
}
const lastCall = () => {
  const [url, options] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
  return { url: String(url), options, body: options.body ? JSON.parse(options.body) : undefined };
};

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("accessToken", "stored-token");
});

describe("authService.login", () => {
  it("posts credentials without the stored bearer token and returns the access token", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { access_token: "abc" }));
    await expect(authService.login({ email: "a@b.com", password: "pass", rememberMe: true })).resolves.toEqual({
      access_token: "abc",
    });
    const { url, options, body } = lastCall();
    expect(url).toMatch(/\/auth\/login$/);
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(options.headers.Authorization).toBeUndefined();
    expect(body).toEqual({ platform: "web", email: "a@b.com", password: "pass", rememberMe: true });
  });

  it("does not invent a device token", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { access_token: "abc" }));
    await authService.login({ email: "a@b.com", password: "p" });
    expect(lastCall().body.deviceToken).toBeUndefined();
  });

  it("reports wrong credentials as an ApiError without attempting a token refresh", async () => {
    mockFetch.mockReturnValueOnce(
      respond(401, { error: { code: "UNAUTHENTICATED", message: "Invalid credentials" } }),
    );
    const error = await authService.login({ email: "x@y.com", password: "wrong" }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "UNAUTHENTICATED", message: "Invalid credentials" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("authService.introspectToken", () => {
  it("sends the given token as the bearer, not the stored one", async () => {
    const result = { active: true, user: { userId: "u1", email: "a@b.com", role: "school_admin" } };
    mockFetch.mockReturnValueOnce(respond(200, result));
    await expect(authService.introspectToken("tok")).resolves.toEqual(result);
    expect(lastCall().options.headers.Authorization).toBe("Bearer tok");
  });
});

describe("password reset", () => {
  it("forgotPassword posts the email", async () => {
    mockFetch.mockReturnValueOnce(respond(201, { message: "sent" }));
    await authService.forgotPassword("a@b.com");
    expect(lastCall().url).toMatch(/\/auth\/forgot-password$/);
    expect(lastCall().body).toEqual({ email: "a@b.com" });
  });

  it("verifyResetCode checks the code with the server", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { valid: true }));
    await expect(authService.verifyResetCode("a@b.com", "123456")).resolves.toEqual({ valid: true });
    expect(lastCall().url).toMatch(/\/auth\/verify-reset-code$/);
    expect(lastCall().body).toEqual({ email: "a@b.com", token: "123456" });
  });

  it("verifyResetCode surfaces an invalid code as an ApiError", async () => {
    mockFetch.mockReturnValueOnce(respond(400, { error: { code: "BAD_REQUEST", message: "Invalid or expired code" } }));
    await expect(authService.verifyResetCode("a@b.com", "000000")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid or expired code",
    });
  });

  it("resetPassword posts email, token and new password", async () => {
    mockFetch.mockReturnValueOnce(respond(201, { message: "ok" }));
    await authService.resetPassword("a@b.com", "123456", "N3w-Passw0rd!");
    expect(lastCall().body).toEqual({ email: "a@b.com", token: "123456", newPassword: "N3w-Passw0rd!" });
  });
});

describe("authService.changePassword", () => {
  it("posts all three fields with the session token and returns the new access token", async () => {
    mockFetch.mockReturnValueOnce(respond(201, { access_token: "fresh", message: "changed" }));
    await expect(authService.changePassword("Temp#1234", "N3w-Passw0rd!", "N3w-Passw0rd!")).resolves.toEqual({
      access_token: "fresh",
      message: "changed",
    });
    const { url, options, body } = lastCall();
    expect(url).toMatch(/\/auth\/change-password$/);
    expect(options.headers.Authorization).toBe("Bearer stored-token");
    expect(body).toEqual({ currentPassword: "Temp#1234", newPassword: "N3w-Passw0rd!", confirmPassword: "N3w-Passw0rd!" });
  });

  it("maps field errors from the server", async () => {
    mockFetch.mockReturnValueOnce(
      respond(400, {
        error: {
          code: "VALIDATION_FAILED",
          message: "Some fields need attention.",
          details: [{ field: "currentPassword", reason: "Current password is incorrect" }],
        },
      }),
    );
    const error = (await authService.changePassword("bad", "N3w-Passw0rd!", "N3w-Passw0rd!").catch((e) => e)) as ApiError;
    expect(error.fieldErrors()).toEqual({ currentPassword: "Current password is incorrect" });
  });
});

describe("profile", () => {
  it("updateUserProfile sends only the payload it is given", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { firstName: "Ada" }));
    await authService.updateUserProfile({ firstName: "Ada", userAvatar: "https://cdn.x.com/a.png" });
    const { url, options, body } = lastCall();
    expect(url).toMatch(/\/auth\/profile\/update$/);
    expect(options.method).toBe("PUT");
    expect(body).toEqual({ firstName: "Ada", userAvatar: "https://cdn.x.com/a.png" });
  });

  it("getUserProfile encodes the user id into the path", async () => {
    mockFetch.mockReturnValueOnce(respond(200, { userId: "u 1" }));
    await authService.getUserProfile("u 1");
    expect(lastCall().url).toMatch(/\/auth\/profile\/u%201$/);
  });
});

describe("authService.logout", () => {
  it("posts to the logout endpoint with the session token", async () => {
    mockFetch.mockReturnValueOnce(respond(201, { message: "Logged out" }));
    await authService.logout();
    const { url, options } = lastCall();
    expect(url).toMatch(/\/auth\/logout$/);
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer stored-token");
  });
});
