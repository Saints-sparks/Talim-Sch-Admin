import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PermissionGate } from "./PermissionGate";
import { AuthContext } from "@/context/AuthContext";

// ─── Mock usePermissions per story via a module-level mock ───────────────────
// Storybook's mock system lets us override the module for individual stories.
// Each story that needs a specific role uses a `beforeEach` loader to set up
// the mock, or a decorator that wraps with a mocked context.
//
// Since PermissionGate uses the usePermissions hook which pulls from AuthContext,
// we mock the hook module directly in each story's `parameters.moduleMock`.

const meta: Meta<typeof PermissionGate> = {
  title: "Auth/PermissionGate",
  component: PermissionGate,
  tags: ["autodocs"],
  parameters: {
    // Default: render as full admin so content always shows in the Docs tab
    moduleMock: {
      mock: () => ({
        usePermissions: () => ({
          isFullAdmin: true,
          isSubAdmin: false,
          hasPermission: () => true,
          hasAllPermissions: () => true,
          hasAnyPermission: () => true,
          permissions: [],
        }),
      }),
    },
  },
  args: {
    permission: "manage:fees",
    children: (
      <div className="p-3 bg-green-50 rounded text-green-800 font-medium">
        Protected content visible ✓
      </div>
    ),
    fallback: (
      <div className="p-3 bg-red-50 rounded text-red-800 font-medium">
        Access denied — no permission
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof PermissionGate>;

// ─── Full admin always sees content ──────────────────────────────────────────

export const AdminAlwaysSees: Story = {
  parameters: {
    moduleMock: {
      mock: () => ({
        usePermissions: () => ({
          isFullAdmin: true,
          isSubAdmin: false,
          hasPermission: () => true,
          hasAllPermissions: () => true,
          hasAnyPermission: () => true,
          permissions: [],
        }),
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Protected content visible/i)).toBeInTheDocument();
    await expect(canvas.queryByText(/Access denied/i)).not.toBeInTheDocument();
  },
};

// ─── Sub-admin with the required permission ───────────────────────────────────

export const SubAdminWithPermission: Story = {
  parameters: {
    moduleMock: {
      mock: () => ({
        usePermissions: () => ({
          isFullAdmin: false,
          isSubAdmin: true,
          hasPermission: (p: string) => p === "manage:fees",
          hasAllPermissions: (...ps: string[]) => ps.every((p) => p === "manage:fees"),
          hasAnyPermission: (...ps: string[]) => ps.some((p) => p === "manage:fees"),
          permissions: ["manage:fees"],
        }),
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Protected content visible/i)).toBeInTheDocument();
  },
};

// ─── Sub-admin without the required permission ────────────────────────────────

const subAdminBlockedAuth = {
  user: {
    userId: "sub-user",
    email: "sub@talim.test",
    firstName: "Sub",
    lastName: "Admin",
    role: "school_sub_admin",
    schoolId: "school-1",
    schoolName: "Talim Demo School",
    permissions: ["manage:students"] as string[],
    isSubAdmin: true,
  },
  accessToken: "mock-token",
  isAuthenticated: true,
  isLoading: false,
  isFullAdmin: false,
  isSubAdmin: true,
  hasPermission: () => false,
  login: async () => true,
  logout: async () => {},
  refreshToken: async () => true,
  setAccessToken: () => {},
  updateUser: () => {},
};

export const SubAdminBlocked: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider value={subAdminBlockedAuth}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/Protected content visible/i)).not.toBeInTheDocument();
    await expect(canvas.getByText(/Access denied/i)).toBeInTheDocument();
  },
};

// ─── No permission requirement — always visible ───────────────────────────────

export const NoRequirement: Story = {
  args: { permission: undefined },
  parameters: {
    moduleMock: {
      mock: () => ({
        usePermissions: () => ({
          isFullAdmin: false,
          isSubAdmin: true,
          hasPermission: () => false,
          hasAllPermissions: () => false,
          hasAnyPermission: () => false,
          permissions: [],
        }),
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Protected content visible/i)).toBeInTheDocument();
  },
};

// ─── No fallback — renders nothing when blocked ───────────────────────────────

export const BlockedNoFallback: Story = {
  args: { fallback: undefined },
  decorators: [
    (Story) => (
      <AuthContext.Provider value={subAdminBlockedAuth}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/Protected content visible/i)).not.toBeInTheDocument();
    await expect(canvas.queryByText(/Access denied/i)).not.toBeInTheDocument();
  },
};
