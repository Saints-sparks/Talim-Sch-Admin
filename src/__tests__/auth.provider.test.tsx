/** @jest-environment jsdom */
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { authService } from "@/app/services/auth.service";
import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";
import { dropLocalWebPush } from "@/app/hooks/usePushNotifications";
import { sessionStore } from "@/lib/session";

jest.mock("@/app/services/auth.service", () => ({
  authService: {
    login: jest.fn(),
    introspectToken: jest.fn(),
    refresh: jest.fn(),
    changePassword: jest.fn(),
    logout: jest.fn(),
  },
}));
jest.mock("@/app/hooks/usePushNotifications", () => ({
  revokeWebPushOnSignOut: jest.fn().mockResolvedValue(undefined),
  dropLocalWebPush: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/apiClient", () => ({
  apiClient: { setAccessToken: jest.fn(), initialize: jest.fn() },
}));

const auth = authService as jest.Mocked<typeof authService>;

const ADMIN = {
  userId: "u1",
  email: "admin@school.edu",
  role: "school_admin",
  schoolId: "665f1c2a9b1e8a0012345678",
};
const SUB_ADMIN = { ...ADMIN, userId: "u2", role: "school_sub_admin", permissions: ["manage:students"] };
const TEACHER = { ...ADMIN, userId: "u3", role: "teacher" };

/** The introspection response for `user`. */
const active = (user: object) => ({ active: true, user }) as never;

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/** Mounts the provider and waits for the start-up check to finish. */
async function mount() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  sessionStore.set(null, null);
  auth.refresh.mockRejectedValue(new ApiError("UNAUTHENTICATED", "no session", 401));
});

describe("start-up", () => {
  it("resumes a stored session: introspects the token and exposes the user", async () => {
    localStorage.setItem("accessToken", "stored-token");
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();

    expect(auth.introspectToken).toHaveBeenCalledWith("stored-token");
    expect(apiClient.setAccessToken).toHaveBeenCalledWith("stored-token");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isFullAdmin).toBe(true);
    expect(result.current.schoolId).toBe("665f1c2a9b1e8a0012345678");
    expect(sessionStore.getSchoolId()).toBe("665f1c2a9b1e8a0012345678");
  });

  it("falls back to a refresh when the stored token no longer introspects", async () => {
    localStorage.setItem("accessToken", "stale");
    auth.introspectToken.mockRejectedValueOnce(new Error("expired")).mockResolvedValue(active(ADMIN));
    auth.refresh.mockResolvedValue({ access_token: "fresh" } as never);
    const { result } = await mount();

    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBe("fresh");
    expect(result.current.accessToken).toBe("fresh");
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it("clears a stored token that neither introspects nor refreshes", async () => {
    (dropLocalWebPush as jest.Mock).mockClear();
    localStorage.setItem("accessToken", "stale");
    localStorage.setItem("user", JSON.stringify(ADMIN));
    auth.introspectToken.mockRejectedValue(new Error("expired"));
    const { result } = await mount();

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("a forced sign-out asks for this browser's push subscription to be dropped locally", async () => {
    (dropLocalWebPush as jest.Mock).mockClear();
    localStorage.setItem("accessToken", "stale");
    localStorage.setItem("user", JSON.stringify(ADMIN));
    // The app hydrates the session store from storage on first read; earlier tests in this
    // file already did, so seed it the way a real start-up would find it.
    sessionStore.set(ADMIN as Parameters<typeof sessionStore.set>[0], "stale");
    auth.introspectToken.mockRejectedValue(new Error("expired"));
    await mount();

    // Start-up clears the session on two failure paths (introspect, then refresh); the
    // cleanup is idempotent, so what matters is that it ran for the departing user.
    expect(dropLocalWebPush).toHaveBeenCalledWith(ADMIN.userId);
  });

  it("signs out (and forgets the stored user) when there is no token and the refresh fails", async () => {
    // The failed refresh clears the session before the stored-user fallback can read it.
    localStorage.setItem("user", JSON.stringify(ADMIN));
    const { result } = await mount();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("drops an unreadable stored user", async () => {
    localStorage.setItem("user", "{not json");
    const { result } = await mount();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});

describe("login", () => {
  beforeEach(() => {
    auth.login.mockResolvedValue({ access_token: "tok" } as never);
  });

  it("persists a kept-signed-in session to localStorage and announces it", async () => {
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();
    const events: Array<{ type?: string }> = [];
    window.addEventListener("auth-changed", (e) => events.push((e as CustomEvent).detail));

    await act(async () => {
      await expect(result.current.login("admin@school.edu", "pw")).resolves.toBe(true);
    });

    expect(auth.login).toHaveBeenCalledWith({ email: "admin@school.edu", password: "pw", rememberMe: true });
    expect(localStorage.getItem("accessToken")).toBe("tok");
    expect(JSON.parse(localStorage.getItem("user")!).userId).toBe("u1");
    expect(localStorage.getItem("keepSignedIn")).toBe("true");
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(apiClient.setAccessToken).toHaveBeenCalledWith("tok");
    expect(result.current.isAuthenticated).toBe(true);
    expect(events).toContainEqual(expect.objectContaining({ type: "login" }));
  });

  it("keeps a session-only login out of localStorage", async () => {
    auth.introspectToken.mockResolvedValue(active(SUB_ADMIN));
    const { result } = await mount();

    await act(async () => {
      await result.current.login("sub@school.edu", "pw", false);
    });

    expect(sessionStorage.getItem("accessToken")).toBe("tok");
    expect(sessionStorage.getItem("user")).not.toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("keepSignedIn")).toBe("false");
    expect(result.current.isSubAdmin).toBe(true);
  });

  it("turns a 401 into a plain wrong-credentials message", async () => {
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();
    auth.login.mockRejectedValue(new ApiError("UNAUTHENTICATED", "raw", 401));

    await act(async () => {
      await expect(result.current.login("a@b.c", "bad")).rejects.toThrow(
        "Incorrect email or password. Please check your credentials and try again.",
      );
    });
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("passes other login failures through untouched", async () => {
    const { result } = await mount();
    const failure = new ApiError("SERVICE_UNAVAILABLE", "down", 503);
    auth.login.mockRejectedValue(failure);
    await act(async () => {
      await expect(result.current.login("a@b.c", "pw")).rejects.toBe(failure);
    });
  });

  it("refuses an account whose token cannot be verified, storing nothing", async () => {
    const { result } = await mount();
    auth.introspectToken.mockResolvedValue({ active: false } as never);
    await act(async () => {
      await expect(result.current.login("a@b.c", "pw")).rejects.toThrow(
        "Could not verify your account. Please try again.",
      );
    });
    auth.introspectToken.mockRejectedValue(new Error("network"));
    await act(async () => {
      await expect(result.current.login("a@b.c", "pw")).rejects.toThrow(
        "Could not verify your account. Please try again.",
      );
    });
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("names the account's role when it does not belong in this portal", async () => {
    const { result } = await mount();
    auth.introspectToken.mockResolvedValue(active({ ...TEACHER, role: "school_teacher" }));
    await act(async () => {
      await expect(result.current.login("t@b.c", "pw")).rejects.toThrow(
        'Access denied. This portal is for school administrators only. Your account is registered as "school teacher". Please use the correct Talim app for your role.',
      );
    });
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("forced password change", () => {
  it("adopts the rotated token and reloads the user, clearing mustChangePassword", async () => {
    localStorage.setItem("accessToken", "temp-token");
    auth.introspectToken.mockResolvedValueOnce(active({ ...ADMIN, mustChangePassword: true }));
    const { result } = await mount();
    expect(result.current.user?.mustChangePassword).toBe(true);

    auth.changePassword.mockResolvedValue({ access_token: "new-token", message: "ok" });
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    await act(async () => {
      await result.current.changePassword("temp", "Str0ng!Pass", "Str0ng!Pass");
    });

    expect(auth.changePassword).toHaveBeenCalledWith("temp", "Str0ng!Pass", "Str0ng!Pass");
    expect(apiClient.setAccessToken).toHaveBeenCalledWith("new-token");
    expect(auth.introspectToken).toHaveBeenLastCalledWith("new-token");
    expect(localStorage.getItem("accessToken")).toBe("new-token");
    expect(result.current.accessToken).toBe("new-token");
    expect(result.current.user?.mustChangePassword).toBeUndefined();
  });

  it("stores the new token in sessionStorage for a session-only sign-in", async () => {
    localStorage.setItem("keepSignedIn", "false");
    sessionStorage.setItem("accessToken", "temp-token");
    auth.introspectToken.mockResolvedValueOnce(active({ ...ADMIN, mustChangePassword: true }));
    const { result } = await mount();

    auth.changePassword.mockResolvedValue({ access_token: "new-token", message: "ok" });
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    await act(async () => {
      await result.current.changePassword("a", "b", "b");
    });

    expect(sessionStorage.getItem("accessToken")).toBe("new-token");
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("leaves the session as it was when the change is refused", async () => {
    localStorage.setItem("accessToken", "temp-token");
    auth.introspectToken.mockResolvedValue(active({ ...ADMIN, mustChangePassword: true }));
    const { result } = await mount();

    auth.changePassword.mockRejectedValue(new ApiError("VALIDATION_FAILED", "weak", 400));
    await act(async () => {
      await expect(result.current.changePassword("a", "b", "b")).rejects.toThrow("weak");
    });
    expect(localStorage.getItem("accessToken")).toBe("temp-token");
    expect(result.current.user?.mustChangePassword).toBe(true);
  });
});

describe("token adoption and refresh", () => {
  it("adopts a pushed token into the preferred storage and re-loads the user", async () => {
    const { result } = await mount();
    localStorage.setItem("keepSignedIn", "false");
    auth.introspectToken.mockResolvedValue(active(ADMIN));

    await act(async () => {
      result.current.setAccessToken("pushed");
    });

    expect(sessionStorage.getItem("accessToken")).toBe("pushed");
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(apiClient.setAccessToken).toHaveBeenCalledWith("pushed");
    await waitFor(() => expect(auth.introspectToken).toHaveBeenCalledWith("pushed"));
    await waitFor(() => expect(sessionStorage.getItem("user")).not.toBeNull());
  });

  it("clears the session when the token is set to null", async () => {
    localStorage.setItem("accessToken", "t");
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();

    await act(async () => {
      result.current.setAccessToken(null);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("shares one refresh between concurrent callers", async () => {
    const { result } = await mount();
    auth.refresh.mockClear();
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    let release!: (v: { access_token: string }) => void;
    auth.refresh.mockReturnValue(new Promise((resolve) => (release = resolve)) as never);

    let both!: Promise<boolean[]>;
    act(() => {
      both = Promise.all([result.current.refreshToken(), result.current.refreshToken()]);
    });
    await act(async () => {
      release({ access_token: "shared" });
      await both;
    });

    expect(auth.refresh).toHaveBeenCalledTimes(1);
    await expect(both).resolves.toEqual([true, true]);
  });
});

describe("logout, permissions and profile edits", () => {
  it("signs out: server call, cleared storage, logout event", async () => {
    localStorage.setItem("accessToken", "t");
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();
    const events: Array<{ type?: string }> = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("auth-changed", listener);
    auth.logout.mockResolvedValue({});

    await act(async () => {
      await result.current.logout();
    });
    window.removeEventListener("auth-changed", listener);

    expect(auth.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("keepSignedIn")).toBeNull();
    expect(events).toContainEqual({ type: "logout" });
  });

  it("clears the local session even when the server logout fails", async () => {
    localStorage.setItem("accessToken", "t");
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();
    auth.logout.mockRejectedValue(new Error("offline"));
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
  });

  it("gives the primary admin every permission and a sub-admin only theirs", async () => {
    localStorage.setItem("accessToken", "t");
    auth.introspectToken.mockResolvedValueOnce(active(ADMIN));
    const admin = await mount();
    expect(admin.result.current.hasPermission("anything")).toBe(true);
    admin.unmount();

    localStorage.setItem("accessToken", "t");
    auth.introspectToken.mockResolvedValueOnce(active(SUB_ADMIN));
    const sub = await mount();
    expect(sub.result.current.hasPermission("manage:students")).toBe(true);
    expect(sub.result.current.hasPermission("manage:fees")).toBe(false);
  });

  it("denies everything when signed out", async () => {
    const { result } = await mount();
    expect(result.current.hasPermission("manage:students")).toBe(false);
  });

  it("merges a profile edit into the user and the stored copy", async () => {
    localStorage.setItem("accessToken", "t");
    auth.introspectToken.mockResolvedValue(active(ADMIN));
    const { result } = await mount();

    act(() => result.current.updateUser({ firstName: "Ada" }));
    expect(result.current.user?.firstName).toBe("Ada");
    expect(JSON.parse(localStorage.getItem("user")!).firstName).toBe("Ada");
  });

  it("rejects the hook outside a provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within an AuthProvider");
    spy.mockRestore();
  });
});
