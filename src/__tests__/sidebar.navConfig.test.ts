import {
  NAV_GROUP_PATHS,
  NAV_ITEMS,
  canSeeSubItem,
  isNavItemActive,
  isSubItemActive,
  subItemPermission,
  visibleNavItems,
  visibleSubItems,
  type NavAccess,
  type NavItem,
} from "@/components/sidebar/navConfig";
import { Permission } from "@/lib/permissions";
import {
  PROTECTED_ROUTE_PREFIXES,
  isFullAdminOnly,
  requiredPermissionFor,
} from "@/lib/routePermissions";

/** The pages the sidebar links to (a group is a container, not a page). */
function leafRoutes(): Array<{ path: string; permission?: string; fullAdminOnly: boolean }> {
  return NAV_ITEMS.flatMap((item) =>
    item.subItems
      ? item.subItems.map((sub) => ({
          path: sub.path,
          permission: subItemPermission(sub, item),
          fullAdminOnly: Boolean(sub.fullAdminOnly),
        }))
      : [{ path: item.path, permission: item.permission, fullAdminOnly: false }],
  );
}

/** A user holding exactly `held`; the primary admin holds everything. */
function access(role: "admin" | "sub", held: string[] = []): NavAccess {
  return {
    isFullAdmin: role === "admin",
    hasPermission: (permission) => role === "admin" || held.includes(permission),
  };
}

const labels = (items: readonly NavItem[]) => items.map((item) => item.label);

describe("nav config against the permission vocabulary", () => {
  const values = new Set<string>(Object.values(Permission));

  it("gives every page a permission that exists, except the open dashboard", () => {
    for (const route of leafRoutes()) {
      if (route.path === "/dashboard") {
        expect(route.permission).toBeUndefined();
      } else {
        expect(values.has(route.permission ?? "")).toBe(true);
      }
    }
  });

  it("agrees with the route guard on the permission each page needs", () => {
    for (const route of leafRoutes()) {
      expect({ path: route.path, permission: requiredPermissionFor(route.path) }).toEqual({
        path: route.path,
        permission: route.permission ?? null,
      });
    }
  });

  it("agrees with the route guard on which pages are for the primary admin only", () => {
    for (const route of leafRoutes()) {
      expect({ path: route.path, fullAdminOnly: isFullAdminOnly(route.path) }).toEqual({
        path: route.path,
        fullAdminOnly: route.fullAdminOnly,
      });
    }
  });

  it("links to every route the guard protects", () => {
    const linked = new Set(leafRoutes().map((route) => route.path));
    for (const prefix of PROTECTED_ROUTE_PREFIXES) expect(linked.has(prefix)).toBe(true);
  });

  it("lists each path once", () => {
    const paths = leafRoutes().map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("exposes the groups that open in place", () => {
    expect(NAV_GROUP_PATHS).toEqual(["/users", "/transit"]);
  });
});

describe("visibleNavItems", () => {
  it("shows the primary admin everything, sub-admin management included", () => {
    const visible = visibleNavItems(NAV_ITEMS, access("admin"));
    expect(labels(visible)).toEqual(labels(NAV_ITEMS));
    const users = visible.find((item) => item.path === "/users");
    expect(users && visibleSubItems(users, access("admin")).map((s) => s.label)).toEqual([
      "Students",
      "Teachers",
      "Parents",
      "Sub-Admins",
    ]);
  });

  it("shows a sub-admin with no permissions only the dashboard", () => {
    expect(labels(visibleNavItems(NAV_ITEMS, access("sub")))).toEqual(["Dashboard"]);
  });

  it("filters per sub-item: a teachers-only sub-admin still gets the Users group, with one link", () => {
    const who = access("sub", [Permission.MANAGE_TEACHERS]);
    const visible = visibleNavItems(NAV_ITEMS, who);
    expect(labels(visible)).toEqual(["Dashboard", "Users"]);
    const users = visible.find((item) => item.path === "/users") as NavItem;
    expect(visibleSubItems(users, who).map((s) => s.label)).toEqual(["Teachers"]);
  });

  it("never shows Sub-Admins to a sub-admin, even one holding the permission", () => {
    const who = access("sub", [Permission.MANAGE_SUB_ADMINS]);
    expect(labels(visibleNavItems(NAV_ITEMS, who))).toEqual(["Dashboard"]);
  });

  it("hides Transit, and its inherited-permission sub-items, without manage:transit", () => {
    expect(labels(visibleNavItems(NAV_ITEMS, access("sub", [Permission.MANAGE_FEES])))).toEqual([
      "Dashboard",
      "Fees Management",
    ]);
    const who = access("sub", [Permission.MANAGE_TRANSIT]);
    const transit = visibleNavItems(NAV_ITEMS, who).find((item) => item.path === "/transit") as NavItem;
    expect(visibleSubItems(transit, who)).toHaveLength(4);
  });

  it("shows a plain item only when its permission is held", () => {
    const who = access("sub", [Permission.MANAGE_FEES, Permission.MANAGE_MESSAGES]);
    expect(labels(visibleNavItems(NAV_ITEMS, who))).toEqual(["Dashboard", "Fees Management", "Messages"]);
  });

  it("falls back to the group's permission for a sub-item without its own", () => {
    const transit = NAV_ITEMS.find((item) => item.path === "/transit") as NavItem;
    const sub = { path: "/transit/x", label: "X", tooltip: "X" };
    expect(subItemPermission(sub, transit)).toBe(Permission.MANAGE_TRANSIT);
    expect(canSeeSubItem(sub, transit, access("sub"))).toBe(false);
    expect(canSeeSubItem(sub, transit, access("sub", [Permission.MANAGE_TRANSIT]))).toBe(true);
  });
});

describe("active-route rules", () => {
  it("lights a section for every page beneath it", () => {
    expect(isNavItemActive("/users/teachers/42", { path: "/users" })).toBe(true);
    expect(isNavItemActive("/classes", { path: "/users" })).toBe(false);
  });

  it("lights a sub-item only on its exact page", () => {
    expect(isSubItemActive("/transit", { path: "/transit" })).toBe(true);
    expect(isSubItemActive("/transit/transfers", { path: "/transit" })).toBe(false);
    expect(isSubItemActive("/users/teachers/42", { path: "/users/teachers" })).toBe(false);
  });
});
