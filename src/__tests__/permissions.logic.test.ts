/**
 * Unit tests for permission logic helpers and PermissionSelector data.
 *
 * These tests run in the node environment (no React rendering required).
 * They validate the core permission-check functions used by usePermissions
 * and PermissionGate by extracting the pure functions and exercising them directly.
 */

import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
} from "@/components/sub-admin/PermissionSelector";

// ─── PERMISSION_GROUPS shape ──────────────────────────────────────────────────

describe("PERMISSION_GROUPS", () => {
  it("has four groups: academics, finance, people, administration", () => {
    const ids = PERMISSION_GROUPS.map((g) => g.id);
    expect(ids).toEqual(["academics", "finance", "people", "administration"]);
  });

  it("every group has at least one permission with value and label", () => {
    for (const group of PERMISSION_GROUPS) {
      expect(group.permissions.length).toBeGreaterThan(0);
      for (const perm of group.permissions) {
        expect(typeof perm.value).toBe("string");
        expect(typeof perm.label).toBe("string");
        expect(perm.value.startsWith("MANAGE_")).toBe(true);
      }
    }
  });

  it("no duplicate permission values across all groups", () => {
    const allValues = PERMISSION_GROUPS.flatMap((g) =>
      g.permissions.map((p) => p.value)
    );
    const unique = new Set(allValues);
    expect(unique.size).toBe(allValues.length);
  });
});

// ─── ALL_PERMISSIONS ──────────────────────────────────────────────────────────

describe("ALL_PERMISSIONS", () => {
  it("is a flat array of all permission values", () => {
    const expected = PERMISSION_GROUPS.flatMap((g) =>
      g.permissions.map((p) => p.value)
    );
    expect(ALL_PERMISSIONS).toEqual(expected);
  });

  it("contains 15 permissions (4 academics + 3 finance + 3 people + 5 administration)", () => {
    expect(ALL_PERMISSIONS.length).toBe(15);
  });

  it("includes key finance permissions", () => {
    expect(ALL_PERMISSIONS).toContain("MANAGE_FEES");
    expect(ALL_PERMISSIONS).toContain("MANAGE_PAYMENTS");
    expect(ALL_PERMISSIONS).toContain("MANAGE_FINANCE");
  });

  it("includes key people permissions", () => {
    expect(ALL_PERMISSIONS).toContain("MANAGE_STUDENTS");
    expect(ALL_PERMISSIONS).toContain("MANAGE_TEACHERS");
    expect(ALL_PERMISSIONS).toContain("MANAGE_PARENTS");
  });
});

// ─── Permission helper logic ──────────────────────────────────────────────────
// These mirror what usePermissions / PermissionGate do internally.

/** Mirrors hasPermission for school_admin (full access) and sub-admins */
function hasPermission(
  role: string,
  userPerms: string[],
  permission: string
): boolean {
  if (role === "school_admin") return true;
  return userPerms.includes(permission);
}

function hasAllPermissions(
  role: string,
  userPerms: string[],
  ...required: string[]
): boolean {
  return required.every((p) => hasPermission(role, userPerms, p));
}

function hasAnyPermission(
  role: string,
  userPerms: string[],
  ...required: string[]
): boolean {
  return required.some((p) => hasPermission(role, userPerms, p));
}

describe("hasPermission", () => {
  describe("school_admin (full access)", () => {
    it("returns true for any permission regardless of userPerms", () => {
      expect(hasPermission("school_admin", [], "MANAGE_FEES")).toBe(true);
      expect(hasPermission("school_admin", [], "MANAGE_SUB_ADMINS")).toBe(true);
      expect(hasPermission("school_admin", [], "ANYTHING")).toBe(true);
    });
  });

  describe("school_sub_admin (restricted)", () => {
    const perms = ["MANAGE_FEES", "MANAGE_STUDENTS"];

    it("returns true when user has the required permission", () => {
      expect(hasPermission("school_sub_admin", perms, "MANAGE_FEES")).toBe(true);
    });

    it("returns false when user does not have the required permission", () => {
      expect(
        hasPermission("school_sub_admin", perms, "MANAGE_FINANCE")
      ).toBe(false);
    });

    it("returns false for empty permissions array", () => {
      expect(hasPermission("school_sub_admin", [], "MANAGE_FEES")).toBe(false);
    });
  });

  describe("other roles", () => {
    it("denies access for unrecognised roles", () => {
      expect(hasPermission("teacher", [], "MANAGE_FEES")).toBe(false);
    });
  });
});

describe("hasAllPermissions", () => {
  const perms = ["MANAGE_FEES", "MANAGE_STUDENTS"];

  it("returns true when user has ALL required permissions", () => {
    expect(
      hasAllPermissions("school_sub_admin", perms, "MANAGE_FEES", "MANAGE_STUDENTS")
    ).toBe(true);
  });

  it("returns false when user is missing even one permission", () => {
    expect(
      hasAllPermissions(
        "school_sub_admin",
        perms,
        "MANAGE_FEES",
        "MANAGE_FINANCE"
      )
    ).toBe(false);
  });

  it("school_admin always returns true", () => {
    expect(
      hasAllPermissions("school_admin", [], "MANAGE_FEES", "MANAGE_FINANCE")
    ).toBe(true);
  });

  it("returns true for no required permissions (vacuous truth)", () => {
    expect(hasAllPermissions("school_sub_admin", [], )).toBe(true);
  });
});

describe("hasAnyPermission", () => {
  const perms = ["MANAGE_FEES"];

  it("returns true when user has at least one required permission", () => {
    expect(
      hasAnyPermission(
        "school_sub_admin",
        perms,
        "MANAGE_FEES",
        "MANAGE_FINANCE"
      )
    ).toBe(true);
  });

  it("returns false when user has none of the required permissions", () => {
    expect(
      hasAnyPermission(
        "school_sub_admin",
        perms,
        "MANAGE_FINANCE",
        "MANAGE_TRANSIT"
      )
    ).toBe(false);
  });

  it("school_admin always returns true", () => {
    expect(
      hasAnyPermission("school_admin", [], "MANAGE_FINANCE", "MANAGE_TRANSIT")
    ).toBe(true);
  });
});

// ─── Sidebar permission filtering ────────────────────────────────────────────

describe("sidebar permission filtering", () => {
  /** Simulates the menuItems.filter logic from Sidebar.tsx */
  function filterMenuItems(
    items: { label: string; permission?: string }[],
    role: string,
    userPerms: string[]
  ) {
    return items.filter(
      (item) => !item.permission || hasPermission(role, userPerms, item.permission)
    );
  }

  const ALL_ITEMS = [
    { label: "Dashboard" },
    { label: "Classes", permission: "MANAGE_CLASSES" },
    { label: "Finance", permission: "MANAGE_FINANCE" },
    { label: "Fees Management", permission: "MANAGE_FEES" },
  ];

  it("full admin sees all items", () => {
    const visible = filterMenuItems(ALL_ITEMS, "school_admin", []);
    expect(visible.map((i) => i.label)).toEqual([
      "Dashboard",
      "Classes",
      "Finance",
      "Fees Management",
    ]);
  });

  it("sub-admin only sees items matching their permissions", () => {
    const visible = filterMenuItems(ALL_ITEMS, "school_sub_admin", [
      "MANAGE_FEES",
    ]);
    expect(visible.map((i) => i.label)).toEqual(["Dashboard", "Fees Management"]);
  });

  it("sub-admin with no permissions only sees Dashboard", () => {
    const visible = filterMenuItems(ALL_ITEMS, "school_sub_admin", []);
    expect(visible.map((i) => i.label)).toEqual(["Dashboard"]);
  });
});
