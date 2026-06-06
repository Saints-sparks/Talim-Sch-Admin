/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { PermissionGate } from "../PermissionGate";

// Mock usePermissions so we control permission state without a real AuthContext
jest.mock("@/hooks/usePermissions");
import { usePermissions } from "@/hooks/usePermissions";
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

// Helpers to configure the mock for each test
function asAdmin() {
  mockUsePermissions.mockReturnValue({
    isFullAdmin: true,
    isSubAdmin: false,
    hasPermission: () => true,
    hasAllPermissions: () => true,
    hasAnyPermission: () => true,
    permissions: [],
  });
}

function asSubAdmin(permissions: string[] = []) {
  mockUsePermissions.mockReturnValue({
    isFullAdmin: false,
    isSubAdmin: true,
    hasPermission: (p: string) => permissions.includes(p),
    hasAllPermissions: (...ps: string[]) => ps.every((p) => permissions.includes(p)),
    hasAnyPermission: (...ps: string[]) => ps.some((p) => permissions.includes(p)),
    permissions,
  });
}

// ─── PermissionGate ──────────────────────────────────────────────────────────

describe("PermissionGate", () => {
  describe("full admin", () => {
    beforeEach(asAdmin);

    it("always renders children regardless of permission", () => {
      render(
        <PermissionGate permission="manage:fees">
          <span>Fees content</span>
        </PermissionGate>
      );
      expect(screen.getByText("Fees content")).toBeInTheDocument();
    });

    it("renders children even when no permission prop is given", () => {
      render(
        <PermissionGate>
          <span>Open content</span>
        </PermissionGate>
      );
      expect(screen.getByText("Open content")).toBeInTheDocument();
    });
  });

  describe("sub-admin with matching permission", () => {
    beforeEach(() => asSubAdmin(["manage:students", "manage:fees"]));

    it("renders children when permission matches", () => {
      render(
        <PermissionGate permission="manage:students">
          <span>Student content</span>
        </PermissionGate>
      );
      expect(screen.getByText("Student content")).toBeInTheDocument();
    });

    it("renders children when all permissions match (AND logic)", () => {
      render(
        <PermissionGate permission={["manage:students", "manage:fees"]}>
          <span>Multi-perm content</span>
        </PermissionGate>
      );
      expect(screen.getByText("Multi-perm content")).toBeInTheDocument();
    });

    it("renders children when any permission matches (OR logic with any=true)", () => {
      render(
        <PermissionGate permission={["manage:students", "manage:assessments"]} any>
          <span>Any-perm content</span>
        </PermissionGate>
      );
      expect(screen.getByText("Any-perm content")).toBeInTheDocument();
    });
  });

  describe("sub-admin without matching permission", () => {
    beforeEach(() => asSubAdmin(["manage:students"]));

    it("hides children when permission is missing", () => {
      render(
        <PermissionGate permission="manage:fees">
          <span>Fees content</span>
        </PermissionGate>
      );
      expect(screen.queryByText("Fees content")).not.toBeInTheDocument();
    });

    it("renders fallback when permission is missing", () => {
      render(
        <PermissionGate permission="manage:fees" fallback={<span>No access</span>}>
          <span>Fees content</span>
        </PermissionGate>
      );
      expect(screen.queryByText("Fees content")).not.toBeInTheDocument();
      expect(screen.getByText("No access")).toBeInTheDocument();
    });

    it("hides children when not all permissions match (AND logic)", () => {
      render(
        <PermissionGate permission={["manage:students", "manage:fees"]}>
          <span>Multi-perm content</span>
        </PermissionGate>
      );
      expect(screen.queryByText("Multi-perm content")).not.toBeInTheDocument();
    });

    it("renders children when any matches (OR logic with any=true)", () => {
      render(
        <PermissionGate permission={["manage:students", "manage:fees"]} any>
          <span>Any content</span>
        </PermissionGate>
      );
      // has manage:students → should pass
      expect(screen.getByText("Any content")).toBeInTheDocument();
    });
  });

  describe("no permission requirement", () => {
    beforeEach(() => asSubAdmin([]));

    it("renders children when no permission prop given", () => {
      render(
        <PermissionGate>
          <span>Public content</span>
        </PermissionGate>
      );
      expect(screen.getByText("Public content")).toBeInTheDocument();
    });
  });
});
