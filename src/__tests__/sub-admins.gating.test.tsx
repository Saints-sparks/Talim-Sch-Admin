/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { Permission } from "@/lib/permissions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("@/hooks/usePermissions");
import { usePermissions } from "@/hooks/usePermissions";
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

jest.mock("@/app/services/sub-admin.service", () => ({
  subAdminService: { getSubAdmins: jest.fn() },
}));
import { subAdminService } from "@/app/services/sub-admin.service";
const getSubAdmins = subAdminService.getSubAdmins as jest.Mock;

jest.mock("@/components/sub-admin/CreateSubAdminModal", () => ({
  CreateSubAdminModal: () => null,
}));
jest.mock("@/components/sub-admin/PromoteTeacherModal", () => ({
  PromoteTeacherModal: () => null,
}));
jest.mock("@/components/sub-admin/EditPermissionsModal", () => ({
  EditPermissionsModal: () => null,
}));

import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";

/** Makes usePermissions answer for a role holding exactly `granted`. */
function withPermissions(granted: string[], isFullAdmin = false) {
  mockUsePermissions.mockReturnValue({
    isFullAdmin,
    isSubAdmin: !isFullAdmin,
    hasPermission: (p: string) => isFullAdmin || granted.includes(p),
    hasAllPermissions: (...ps: string[]) => isFullAdmin || ps.every((p) => granted.includes(p)),
    hasAnyPermission: (...ps: string[]) => isFullAdmin || ps.some((p) => granted.includes(p)),
    permissions: granted,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  getSubAdmins.mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, lastPage: 1, limit: 10 },
  });
});

describe("SubAdminsSection access", () => {
  it("refuses a sub-admin even when they hold manage:sub_admins", async () => {
    // The backend's @Roles(SCHOOL_ADMIN) refuses them whatever their
    // permissions, so the section must not offer the actions either.
    withPermissions([Permission.MANAGE_SUB_ADMINS]);
    render(<SubAdminsSection />);

    expect(screen.getByText(/Reserved for the school administrator/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new sub-admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /promote teacher/i })).not.toBeInTheDocument();
    // Nothing is even requested for a role that cannot read the list.
    expect(getSubAdmins).not.toHaveBeenCalled();
  });

  it("refuses a full admin who has had manage:sub_admins revoked", () => {
    mockUsePermissions.mockReturnValue({
      isFullAdmin: true,
      isSubAdmin: false,
      hasPermission: () => false,
      hasAllPermissions: () => false,
      hasAnyPermission: () => false,
      permissions: [],
    });
    render(<SubAdminsSection />);
    expect(screen.getByText(/Reserved for the school administrator/i)).toBeInTheDocument();
  });

  it("gives the primary school admin the create and promote actions", async () => {
    withPermissions([Permission.MANAGE_SUB_ADMINS], true);
    render(<SubAdminsSection />);

    expect(await screen.findByRole("button", { name: /new sub-admin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /promote teacher/i })).toBeInTheDocument();
    expect(getSubAdmins).toHaveBeenCalledWith(1, 10);
  });
});
