/** @jest-environment jsdom */
import { ApiError } from "@/lib/apiError";
import {
  dispatchAuthChanged,
  isAdminPortalRole,
  loginFailure,
  portalAccessDeniedMessage,
  portalUserFromIntrospection,
  userHasPermission,
  type AuthUser,
} from "@/lib/authPolicy";
import {
  clearStoredSession,
  keepSignedInPreference,
  readStoredAccessToken,
  readStoredUser,
  saveEditedUser,
  saveIntrospectedUser,
  saveRefreshedToken,
  saveRotatedToken,
  saveSession,
} from "@/lib/authStorage";

const user: AuthUser = { userId: "u1", email: "a@b.c", role: "school_admin" };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("authStorage", () => {
  it("treats only an explicit false as session-only", () => {
    expect(keepSignedInPreference()).toBe(true);
    localStorage.setItem("keepSignedIn", "true");
    expect(keepSignedInPreference()).toBe(true);
    localStorage.setItem("keepSignedIn", "false");
    expect(keepSignedInPreference()).toBe(false);
  });

  it("saves a kept session to localStorage and empties sessionStorage", () => {
    sessionStorage.setItem("accessToken", "old");
    sessionStorage.setItem("user", "{}");
    saveSession("tok", user, true);
    expect(localStorage.getItem("accessToken")).toBe("tok");
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(user);
    expect(localStorage.getItem("keepSignedIn")).toBe("true");
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("user")).toBeNull();
  });

  it("saves a session-only session to sessionStorage and empties localStorage", () => {
    localStorage.setItem("accessToken", "old");
    localStorage.setItem("user", "{}");
    saveSession("tok", user, false);
    expect(sessionStorage.getItem("accessToken")).toBe("tok");
    expect(JSON.parse(sessionStorage.getItem("user")!)).toEqual(user);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("keepSignedIn")).toBe("false");
  });

  it("reads the token and user from whichever storage holds them", () => {
    expect(readStoredAccessToken()).toBeNull();
    expect(readStoredUser()).toBeNull();
    sessionStorage.setItem("accessToken", "s");
    sessionStorage.setItem("user", JSON.stringify(user));
    expect(readStoredAccessToken()).toBe("s");
    expect(readStoredUser<AuthUser>()).toEqual(user);
    localStorage.setItem("accessToken", "l");
    expect(readStoredAccessToken()).toBe("l");
  });

  it("discards a stored user that no longer parses", () => {
    localStorage.setItem("user", "{oops");
    expect(readStoredUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("puts a refreshed token where the session lives and removes the other copy", () => {
    localStorage.setItem("keepSignedIn", "false");
    localStorage.setItem("accessToken", "stale");
    saveRefreshedToken("fresh");
    expect(sessionStorage.getItem("accessToken")).toBe("fresh");
    expect(localStorage.getItem("accessToken")).toBeNull();

    localStorage.setItem("keepSignedIn", "true");
    saveRefreshedToken("fresher");
    expect(localStorage.getItem("accessToken")).toBe("fresher");
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });

  it("writes a rotated token to the preferred storage only", () => {
    sessionStorage.setItem("accessToken", "other");
    saveRotatedToken("rotated");
    expect(localStorage.getItem("accessToken")).toBe("rotated");
    expect(sessionStorage.getItem("accessToken")).toBe("other");
  });

  it("stores the re-introspected user in the preferred storage and drops the other", () => {
    localStorage.setItem("keepSignedIn", "false");
    localStorage.setItem("user", "{}");
    saveIntrospectedUser(user);
    expect(JSON.parse(sessionStorage.getItem("user")!)).toEqual(user);
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("stores an edited user in localStorage", () => {
    saveEditedUser({ ...user, firstName: "Ada" });
    expect(JSON.parse(localStorage.getItem("user")!).firstName).toBe("Ada");
  });

  it("forgets the whole session, including the keep-signed-in choice", () => {
    saveSession("tok", user, true);
    sessionStorage.setItem("accessToken", "x");
    clearStoredSession();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe("authPolicy", () => {
  it("admits school admins and sub-admins only", () => {
    expect(isAdminPortalRole("school_admin")).toBe(true);
    expect(isAdminPortalRole("school_sub_admin")).toBe(true);
    expect(isAdminPortalRole("teacher")).toBe(false);
    expect(isAdminPortalRole("")).toBe(false);
  });

  it("names the wrong role in plain words", () => {
    expect(portalAccessDeniedMessage("school_teacher")).toContain('registered as "school teacher"');
  });

  it("rewrites a 401 as wrong credentials and passes anything else through", () => {
    expect(loginFailure(new ApiError("UNAUTHENTICATED", "x", 401))).toEqual(
      new Error("Incorrect email or password. Please check your credentials and try again."),
    );
    expect(loginFailure(new ApiError("BAD_REQUEST", "x", 401))).toBeInstanceOf(Error);
    const offline = ApiError.offline();
    expect(loginFailure(offline)).toBe(offline);
    const plain = new Error("boom");
    expect(loginFailure(plain)).toBe(plain);
  });

  it("builds a portal user only from an active token of an allowed role", () => {
    expect(portalUserFromIntrospection({ active: true, user })).toEqual(user);
    expect(() => portalUserFromIntrospection({ active: false, user })).toThrow("Token introspection failed");
    expect(() => portalUserFromIntrospection({ active: true })).toThrow("Token introspection failed");
    expect(() => portalUserFromIntrospection({ active: true, user: { ...user, role: "teacher" } })).toThrow(
      "Access denied for this portal",
    );
  });

  it("gives the primary admin everything and a sub-admin what is listed", () => {
    const sub: AuthUser = { ...user, role: "school_sub_admin", permissions: ["manage:students"] };
    expect(userHasPermission(null, "manage:students")).toBe(false);
    expect(userHasPermission(user, "anything")).toBe(true);
    expect(userHasPermission(sub, "manage:students")).toBe(true);
    expect(userHasPermission(sub, "manage:fees")).toBe(false);
    expect(userHasPermission({ ...sub, permissions: undefined }, "manage:students")).toBe(false);
  });

  it("announces session changes on window", () => {
    const seen: unknown[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener("auth-changed", listener);
    dispatchAuthChanged({ type: "logout" });
    dispatchAuthChanged({ type: "login", user });
    window.removeEventListener("auth-changed", listener);
    expect(seen).toEqual([{ type: "logout" }, { type: "login", user }]);
  });
});
