/** @jest-environment jsdom */
/**
 * The app shell in the portals' design: the sidebar's titled groups, the top
 * bar (school, bell, avatar, menu), the drawer below 980px, the signed-out
 * layout, and the loading, not-found and access-denied screens.
 */
import React from "react";
import { render, screen, waitFor, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/Sidebar";
import { Header, headerInitials } from "@/components/Header";
import LayoutShell from "@/components/LayoutShell";
import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import AccessDeniedPage from "@/app/access-denied/page";
import { groupNavItems, NAV_ITEMS, visibleNavItems } from "@/components/sidebar/navConfig";
import { Permission } from "@/lib/permissions";

let mockPathname = "/dashboard";
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string }) => <span data-alt={props.alt} />,
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/context/ChatAlertsContext", () => ({
  useChatAlerts: () => ({ unreadTotal: 3 }),
  NOTIFICATION_RECEIVED_EVENT: "talim:notification-received",
}));
jest.mock("@/context/WebSocketContext", () => ({
  useWebSocketContext: () => ({
    connectionStatus: "connected",
    isConnected: true,
    reconnect: jest.fn(),
  }),
}));
const mockUnread = jest.fn();
jest.mock("@/app/services/notification.service", () => ({
  getUnreadNotificationCount: (...args: unknown[]) => mockUnread(...args),
}));

const sidebarState = {
  isMobile: false,
  isMobileOpen: false,
  isCollapsed: false,
  setMobileOpen: jest.fn((open: boolean) => {
    sidebarState.isMobileOpen = open;
  }),
  toggleCollapse: jest.fn(),
};
jest.mock("@/context/SidebarContext", () => ({ useSidebar: () => sidebarState }));

const admin = {
  ...mockAdmin,
  firstName: "Sade",
  lastName: "Admin",
  schoolName: "Greenfield Academy",
};

beforeEach(() => {
  mockPathname = "/dashboard";
  Object.assign(sidebarState, { isMobile: false, isMobileOpen: false, isCollapsed: false });
  mockUnread.mockResolvedValue(0);
  jest.clearAllMocks();
});

describe("sidebar groups", () => {
  it("arranges the entries under titled groups with Settings at the foot", () => {
    render(<Sidebar />, { user: admin });
    for (const title of ["Overview", "Academics", "People", "Money", "Communication"]) {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeTruthy();
    }
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveTextContent("Greenfield Academy");
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });

  it("drops a group the sub-admin can see nothing in", () => {
    render(<Sidebar />, { user: { ...mockSubAdmin, permissions: [Permission.MANAGE_FEES] } });
    expect(screen.getByRole("heading", { name: "Money" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Academics" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "People" })).toBeNull();
  });

  it("groupNavItems keeps every visible entry exactly once", () => {
    const visible = visibleNavItems(NAV_ITEMS, { hasPermission: () => true, isFullAdmin: true });
    const { sections, account } = groupNavItems(visible);
    const placed = [...sections.flatMap((s) => s.items), ...account].map((i) => i.path).sort();
    expect(placed).toEqual(visible.map((i) => i.path).sort());
    expect(account.map((i) => i.path)).toEqual(["/settings"]);
  });

  it("marks a group's button expanded and lists its pages", async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { user: admin });
    const users = screen.getByRole("button", { name: /Users/ });
    expect(users).toHaveAttribute("aria-expanded", "false");
    await user.click(users);
    expect(await screen.findByRole("link", { name: /Students/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Users/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("the drawer closes on Escape", async () => {
    Object.assign(sidebarState, { isMobile: true, isMobileOpen: true });
    const user = userEvent.setup();
    render(<Sidebar />, { user: admin });
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(sidebarState.setMobileOpen).toHaveBeenCalledWith(false);
  });
});

describe("top bar", () => {
  it("shows the school, the date, the live status, the bell and the avatar", async () => {
    mockUnread.mockResolvedValue(7);
    render(<Header />, { user: admin });
    expect(screen.getByText("Greenfield Academy")).toBeTruthy();
    expect(screen.getByRole("status")).toHaveTextContent("Connected");
    expect(await screen.findByRole("link", { name: "Notifications, 7 unread" })).toHaveAttribute(
      "href",
      "/notifications"
    );
    expect(screen.getByRole("link", { name: "Your profile" })).toHaveTextContent("SA");
    expect(mockUnread).toHaveBeenCalledWith("user-1");
  });

  it("opens the drawer from the menu button", async () => {
    const user = userEvent.setup();
    render(<Header />, { user: admin });
    const menu = screen.getByRole("button", { name: "Open sidebar" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    await user.click(menu);
    expect(sidebarState.setMobileOpen).toHaveBeenCalledWith(true);
  });

  it("initials fall back to U", () => {
    expect(headerInitials("Sade", "Admin")).toBe("SA");
    expect(headerInitials()).toBe("U");
  });
});

describe("layout", () => {
  it("a signed-out page renders alone in a main landmark", () => {
    render(
      <LayoutShell showSidebar={false}>
        <p>Sign in</p>
      </LayoutShell>,
      { user: admin }
    );
    expect(screen.getByRole("main")).toHaveTextContent("Sign in");
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
  });

  it("a signed-in page gets the sidebar, the top bar and the page in main", async () => {
    render(
      <LayoutShell showSidebar>
        <p>Dashboard content</p>
      </LayoutShell>,
      { user: admin }
    );
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("banner")).toHaveTextContent("Greenfield Academy");
    await waitFor(() => expect(screen.getByRole("main")).toHaveTextContent("Dashboard content"));
  });
});

describe("whole-page states", () => {
  it("the route loading state is a labelled busy skeleton", () => {
    render(<Loading />);
    expect(screen.getByRole("status", { name: "Loading" })).toHaveAttribute("aria-busy", "true");
  });

  it("not found and access denied keep their headings and ways out", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Go to Dashboard/ })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    unmount();

    render(<AccessDeniedPage />, { user: { ...mockSubAdmin } });
    expect(screen.getByRole("heading", { level: 1, name: "Access Denied" })).toBeTruthy();
    expect(screen.getByText(/don't have permission/)).toBeTruthy();
    expect(screen.getByText(/limited permissions/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Go to Dashboard/ }));
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
