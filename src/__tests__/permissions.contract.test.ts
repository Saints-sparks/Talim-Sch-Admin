/**
 * The permission vocabulary and the route map are a contract with the backend.
 * These tests fail when a page is added without deciding who may open it, or
 * when the two permission lists drift apart.
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Permission, normalizePermission } from "@/lib/permissions";
import { requiredPermissionFor, isFullAdminOnly } from "@/lib/routePermissions";

const APP_DIR = join(__dirname, "..", "app");
const BACKEND_ENUM = join(
  __dirname,
  "..",
  "..",
  "..",
  "talimBE-V2",
  "src",
  "modules",
  "auth",
  "enums",
  "permission.enum.ts",
);

/** Every `page.tsx` under src/app, as the route a browser would open. */
function routes(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      found.push(...routes(join(dir, entry.name), `${prefix}/${entry.name}`));
    } else if (entry.name === "page.tsx") {
      found.push(prefix === "" ? "/" : prefix);
    }
  }
  return found;
}

/**
 * Routes every signed-in administrator may open. Each one is listed
 * deliberately: sign-in and recovery are pre-auth, the rest are personal or
 * school-wide pages with no permission of their own.
 */
const OPEN_ROUTES = new Set([
  "/",
  "/access-denied",
  "/dashboard",
  "/forgot-password",
  "/set-password",
  "/onboarding",
  "/onboarding/setup",
  "/profile",
  "/notifications",
  "/notifications/[id]",
  "/complaints",
  "/complaints/[id]",
]);

describe("permission vocabulary", () => {
  it("matches the backend enum exactly", () => {
    if (!existsSync(BACKEND_ENUM)) {
      // The backend is a sibling checkout; skip rather than fail elsewhere.
      return;
    }
    const source = readFileSync(BACKEND_ENUM, "utf8");
    const body = source.slice(source.indexOf("export enum Permission"), source.indexOf("}", source.indexOf("export enum Permission")));
    const backend = [...body.matchAll(/=\s*'([^']+)'/g)].map((m) => m[1]).sort();
    const frontend = Object.values(Permission).sort();
    expect(frontend).toEqual(backend);
  });

  it("normalises a key name to the value the API compares", () => {
    expect(normalizePermission("MANAGE_FEES")).toBe("manage:fees");
    expect(normalizePermission("manage:fees")).toBe("manage:fees");
    // An unknown string is passed through, so it simply never matches.
    expect(normalizePermission("nonsense")).toBe("nonsense");
  });
});

describe("route permissions", () => {
  const all = routes(APP_DIR);

  it("finds the app's pages", () => {
    expect(all.length).toBeGreaterThan(20);
  });

  it("gates every page that is not deliberately open", () => {
    const ungated = all.filter((route) => !OPEN_ROUTES.has(route) && requiredPermissionFor(route) === null);
    expect(ungated).toEqual([]);
  });

  it("requires a permission the backend knows", () => {
    const values = new Set<string>(Object.values(Permission));
    for (const route of all) {
      const required = requiredPermissionFor(route);
      if (required) expect(values.has(required)).toBe(true);
    }
  });

  it("reserves sub-admin management for the primary admin", () => {
    expect(isFullAdminOnly("/users/sub-admins")).toBe(true);
    expect(isFullAdminOnly("/users/students")).toBe(false);
  });
});
