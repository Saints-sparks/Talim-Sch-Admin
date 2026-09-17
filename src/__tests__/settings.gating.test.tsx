/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { Permission } from "@/lib/permissions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("@/hooks/usePermissions");
import { usePermissions } from "@/hooks/usePermissions";
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

jest.mock("@/hooks/settings/useSchoolProfile", () => ({
  useSchoolProfile: jest.fn(),
  useUpdateSchoolProfile: () => ({ save: jest.fn(), saving: false }),
}));
import { useSchoolProfile } from "@/hooks/settings/useSchoolProfile";
const mockUseSchoolProfile = useSchoolProfile as jest.Mock;

jest.mock("@/hooks/settings/useDataExport", () => ({
  useDataExport: () => ({ exporting: null, run: jest.fn() }),
}));

import { SchoolProfileSection } from "@/components/settings/SchoolProfileSection";
import { ClassesCurriculumSection } from "@/components/settings/ClassesCurriculumSection";
import { DataSystemSection } from "@/components/settings/DataSystemSection";

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
  _id: "s1",
  name: "Talim High",
  email: "info@talim.test",
  physicalAddress: "12 Lagos Road",
  schoolPrefix: "TLH",
  active: true,
  logo: "",
  primaryContacts: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  withPermissions([]);
  mockUseSchoolProfile.mockReturnValue({
    data: school,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
});

// ─── School Profile ───────────────────────────────────────────────────────────

describe("SchoolProfileSection", () => {
  it("offers editing and a logo change with manage:settings", () => {
    render(<SchoolProfileSection canManage />);
    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Change Logo")).toBeTruthy();
  });

  it("hides every edit control without it", () => {
    render(<SchoolProfileSection canManage={false} />);
    expect(screen.queryByText("Edit")).toBeNull();
    expect(screen.queryByText("Change Logo")).toBeNull();
    // The school is still readable.
    expect(screen.getByText("Talim High")).toBeTruthy();
    expect(screen.getByText("12 Lagos Road")).toBeTruthy();
  });

  it("shows a retry instead of a spinner when the profile fails to load", () => {
    const refetch = jest.fn();
    mockUseSchoolProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("nope"),
      refetch,
    });
    render(<SchoolProfileSection canManage />);
    expect(screen.getByText("Try again")).toBeTruthy();
  });
});

// ─── Classes & Curriculum ─────────────────────────────────────────────────────

describe("ClassesCurriculumSection", () => {
  it("only lists the modules the role can open", () => {
    withPermissions([Permission.MANAGE_CLASSES]);
    render(<ClassesCurriculumSection />);
    expect(screen.getByText("Manage Classes")).toBeTruthy();
    expect(screen.queryByText("Curriculum Library")).toBeNull();
  });

  it("says so when the role manages neither", () => {
    withPermissions([]);
    render(<ClassesCurriculumSection />);
    expect(screen.getByText(/doesn't manage classes or curriculum/i)).toBeTruthy();
  });
});

// ─── Data & System ────────────────────────────────────────────────────────────

describe("DataSystemSection", () => {
  it("offers the CSV exports with manage:settings", () => {
    withPermissions([Permission.MANAGE_SETTINGS]);
    render(<DataSystemSection />);
    expect(screen.getByText("Export Students")).toBeTruthy();
    expect(screen.getByText("Export Staff")).toBeTruthy();
    expect(screen.queryByText("Finance Statement")).toBeNull();
  });

  it("shows the finance statement only with manage:finance", () => {
    withPermissions([Permission.MANAGE_FINANCE]);
    render(<DataSystemSection />);
    expect(screen.getByText("Finance Statement")).toBeTruthy();
    expect(screen.queryByText("Export Students")).toBeNull();
  });

  it("never invents backup timestamps", () => {
    withPermissions([Permission.MANAGE_SETTINGS]);
    render(<DataSystemSection />);
    expect(screen.queryByText(/Last Backup/i)).toBeNull();
    expect(screen.queryByText(/Next Backup/i)).toBeNull();
    expect(screen.getByText(/Backups are managed by Talim/i)).toBeTruthy();
  });
});
