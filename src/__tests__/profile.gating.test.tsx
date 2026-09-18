/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { Permission } from "@/lib/permissions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("@/hooks/usePermissions");
import { usePermissions } from "@/hooks/usePermissions";
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

const save = jest.fn().mockResolvedValue(undefined);
const saveLogo = jest.fn().mockResolvedValue(undefined);
jest.mock("@/components/profile/useProfileData", () => ({
  ...jest.requireActual("@/components/profile/useProfileData"),
  useSaveSchoolDetails: () => ({ save, saveLogo, saving: false }),
}));

import { SchoolDetailsCard } from "@/components/profile/SchoolDetailsCard";

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

const school = {
  name: "Talim High",
  prefix: "TLH",
  street: "12 Lagos Road",
  state: "Lagos State",
  country: "Nigeria",
  logo: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  withPermissions([]);
});

describe("SchoolDetailsCard access", () => {
  it("hides the editing controls from a role without manage:settings", () => {
    render(<SchoolDetailsCard school={school} />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/change logo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/manage settings/i)).toBeInTheDocument();
  });

  it("offers editing to a role that holds manage:settings", () => {
    withPermissions([Permission.MANAGE_SETTINGS]);
    render(<SchoolDetailsCard school={school} />);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByText(/change logo/i)).toBeInTheDocument();
  });

  it("offers editing to a full admin", () => {
    withPermissions([], true);
    render(<SchoolDetailsCard school={school} />);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("never lets the school prefix be edited", () => {
    withPermissions([], true);
    render(<SchoolDetailsCard school={school} />);
    screen.getByRole("button", { name: /edit/i }).click();
    // Even while editing, the prefix stays a read-only value.
    expect(screen.queryByDisplayValue("TLH")).not.toBeInTheDocument();
    expect(screen.getByText(/contact Talim support/i)).toBeInTheDocument();
  });
});
