/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/Sidebar";
import { Permission } from "@/lib/permissions";

let mockPathname = "/dashboard";
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

let mockChatUnread = 0;
jest.mock("@/context/ChatAlertsContext", () => ({
  useChatAlerts: () => ({ unreadTotal: mockChatUnread }),
}));

const sidebarState = {
  isMobile: false,
  isMobileOpen: false,
  isCollapsed: false,
  setMobileOpen: jest.fn(),
  toggleCollapse: jest.fn(),
};
jest.mock("@/context/SidebarContext", () => ({ useSidebar: () => sidebarState }));

const sub = (...permissions: string[]) => ({ ...mockSubAdmin, permissions });

beforeEach(() => {
  mockPathname = "/dashboard";
  mockChatUnread = 0;
  Object.assign(sidebarState, { isMobile: false, isMobileOpen: false, isCollapsed: false });
  jest.clearAllMocks();
});

describe("Sidebar", () => {
  it("shows the primary admin every section", () => {
    render(<Sidebar />, { user: mockAdmin });
    for (const label of [
      "Dashboard",
      "Classes",
      "Curriculum",
      "Assessments",
      "Timetable",
      "Fees Management",
      "Payments",
      "Finance",
      "Users",
      "Announcements",
      "Leave Requests",
      "Transit",
      "Messages",
      "Settings",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("shows a sub-admin only what their permissions open", () => {
    render(<Sidebar />, { user: sub(Permission.MANAGE_FEES) });
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Fees Management")).toBeTruthy();
    expect(screen.queryByText("Classes")).toBeNull();
    expect(screen.queryByText("Users")).toBeNull();
    expect(screen.queryByText("Transit")).toBeNull();
  });

  it("opens the Users group by itself under /users and lists only the permitted pages", async () => {
    mockPathname = "/users/teachers";
    render(<Sidebar />, { user: sub(Permission.MANAGE_TEACHERS, Permission.MANAGE_SUB_ADMINS) });
    expect(await screen.findByText("Teachers")).toBeTruthy();
    expect(screen.queryByText("Students")).toBeNull();
    expect(screen.queryByText("Sub-Admins")).toBeNull();
  });

  it("lists Sub-Admins for the primary admin", async () => {
    mockPathname = "/users/students";
    render(<Sidebar />, { user: mockAdmin });
    expect(await screen.findByText("Sub-Admins")).toBeTruthy();
  });

  it("toggles a group by hand and closes it again when the route leaves it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Sidebar />, { user: mockAdmin });
    expect(screen.queryByText("Students")).toBeNull();

    await user.click(screen.getByText("Users"));
    expect(await screen.findByText("Students")).toBeTruthy();

    mockPathname = "/classes";
    rerender(<Sidebar />);
    await waitFor(() => expect(screen.queryByText("Students")).toBeNull());
  });

  it("shows the unread count on Messages, capped at 99+", () => {
    mockChatUnread = 120;
    render(<Sidebar />, { user: mockAdmin });
    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("collapses to an icon rail that still gates by permission", () => {
    sidebarState.isCollapsed = true;
    render(<Sidebar />, { user: sub(Permission.MANAGE_CLASSES) });
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeTruthy();
    // Labels live in tooltips on the rail, not as text.
    expect(screen.queryByText("Classes")).toBeNull();
    expect(screen.queryByText("Logout Account")).toBeNull();
  });

  it("closes the mobile drawer when a link is chosen", async () => {
    Object.assign(sidebarState, { isMobile: true, isMobileOpen: true });
    const user = userEvent.setup();
    render(<Sidebar />, { user: mockAdmin });
    await user.click(screen.getByText("Classes"));
    expect(sidebarState.setMobileOpen).toHaveBeenCalledWith(false);
  });

  it("renders nothing on mobile while the drawer is shut", () => {
    Object.assign(sidebarState, { isMobile: true, isMobileOpen: false });
    render(<Sidebar />, { user: mockAdmin });
    expect(screen.queryByText("Dashboard")).toBeNull();
  });
});
