/** @jest-environment jsdom */
/**
 * The support desk and "Contact Talim support" (v1.5 §1): who may open the
 * desk, internal notes (marked at the desk, never shown to the requester),
 * the reply / internal-note / status / priority / assign / escalate flows,
 * the requester's reopen and close, and what a 409 does (says why, reloads
 * the ticket, keeps the draft). The backend is hand-typed from the contract,
 * so the requests' paths and bodies are pinned here too.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { act, render, screen, waitFor, within, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import { api } from "@/lib/apiClient";
import { Permission } from "@/lib/permissions";
import { requiredPermissionFor } from "@/lib/routePermissions";
import { toast } from "@/components/CustomToast";
import RouteGuard from "@/components/RouteGuard";
import Sidebar from "@/components/Sidebar";
import { DeskQueue, deskTabs } from "@/components/support/DeskQueue";
import { DeskTicketScreen, deskReadOnlyReason } from "@/components/support/DeskTicketScreen";
import { HelpScreen } from "@/components/support/HelpScreen";
import { MyTicketScreen, requesterReplyBlocked } from "@/components/support/MyTicketScreen";
import { legacyComplaintTarget } from "@/components/support/LegacyComplaintsRedirect";
import { assigneeOptions } from "@/hooks/support/useDeskAssignees";
import { NotificationDetail } from "@/components/notifications/NotificationDetail";
import type { AdminNotification } from "@/app/services/notification.service";
import { deskQueryString } from "@/app/services/ticket.service";
import {
  acceptAttachments,
  canReopen,
  statusLabel,
  statusesForTab,
  ticketConflictCode,
  ticketErrorMessage,
  visibleMessages,
} from "@/components/support/ticket.presentation";
import {
  DESK_SUB_ADMIN,
  deskCounts,
  deskStaff,
  deskTicket,
  escalatedTicket,
  myTicket,
  ticketConflict,
  ticketPage,
} from "@/test-utils/fixtures/tickets";
import type { Ticket } from "@/types/tickets";

let mockPathname = "/support";
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useParams: () => ({}),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: React.forwardRef<HTMLAnchorElement, { href: string; children: React.ReactNode }>(
    function Link({ href, children, ...rest }, ref) {
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      );
    }
  ),
}));
jest.mock("next/image", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockUpload = jest.fn();
jest.mock("@/app/services/files.service", () => ({
  uploadFileAttachment: (...args: unknown[]) => mockUpload(...args),
}));
jest.mock("@/context/ChatAlertsContext", () => ({
  useChatAlerts: () => ({ unreadTotal: 0 }),
  NOTIFICATION_RECEIVED_EVENT: "talim:notification-received",
}));
const sidebarState = {
  isMobile: false,
  isMobileOpen: false,
  isCollapsed: false,
  setMobileOpen: jest.fn(),
  toggleCollapse: jest.fn(),
};
jest.mock("@/context/SidebarContext", () => ({ useSidebar: () => sidebarState }));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;

const admin = { ...mockAdmin, firstName: "Sade", lastName: "Admin" };
const deskSub = {
  ...mockSubAdmin,
  userId: DESK_SUB_ADMIN.id,
  firstName: "Dayo",
  lastName: "Desk",
  permissions: [Permission.MANAGE_SUPPORT],
};
const plainSub = { ...mockSubAdmin, permissions: [Permission.MANAGE_STUDENTS] };

/**
 * Answers the GETs the screens make.
 *
 * @param tickets - What `GET /tickets/:id` returns, by id (a function lets a test change it later).
 * @param lists - The queue and the requester's list.
 * @param lists.desk - The desk queue.
 * @param lists.mine - The requester's list.
 */
function answerGets(
  tickets: Record<string, Ticket> | (() => Record<string, Ticket>),
  lists: { desk?: Ticket[]; mine?: Ticket[] } = {}
) {
  mockGet.mockImplementation(async (path: string) => {
    const url = new URL(path, "http://api.test");
    const byId = typeof tickets === "function" ? tickets() : tickets;
    if (url.pathname === "/tickets/desk/school/counts") return deskCounts();
    if (url.pathname === "/tickets/desk/school") return ticketPage(lists.desk ?? []);
    if (url.pathname === "/tickets/mine") return ticketPage(lists.mine ?? []);
    if (url.pathname === "/tickets/desk/school/staff") return deskStaff();
    const id = url.pathname.match(/^\/tickets\/([^/]+)$/)?.[1];
    if (id && byId[id]) return byId[id];
    throw new Error(`unexpected GET ${path}`);
  });
}

/** How many times `GET /tickets/:id` was asked for. */
const ticketReads = (id: string) =>
  mockGet.mock.calls.filter(([path]) => path === `/tickets/${id}`).length;

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/support";
  mockUpload.mockResolvedValue("https://cdn.test/upload/screenshot.png");
});

// ─── Gating ─────────────────────────────────────────────────────────────────

describe("who may open the desk", () => {
  it("the route needs manage:support; Help and the old complaints links are open", () => {
    expect(requiredPermissionFor("/support")).toBe(Permission.MANAGE_SUPPORT);
    expect(requiredPermissionFor("/support/t1")).toBe(Permission.MANAGE_SUPPORT);
    expect(requiredPermissionFor("/help")).toBeNull();
    expect(requiredPermissionFor("/help/tickets/t9")).toBeNull();
    expect(requiredPermissionFor("/complaints")).toBeNull();
  });

  it("the sidebar offers the desk to the school admin and a sub-admin with manage:support, and Help to everyone", () => {
    const { unmount } = render(<Sidebar />, { user: admin });
    expect(screen.getByRole("link", { name: /Support desk/ })).toHaveAttribute("href", "/support");
    expect(screen.getByRole("link", { name: /Help & support/ })).toHaveAttribute("href", "/help");
    unmount();

    const second = render(<Sidebar />, { user: deskSub });
    expect(screen.getByRole("link", { name: /Support desk/ })).toBeTruthy();
    second.unmount();

    render(<Sidebar />, { user: plainSub });
    expect(screen.queryByRole("link", { name: /Support desk/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Help & support/ })).toBeTruthy();
  });

  it("a sub-admin without manage:support is refused the desk and nothing is requested", () => {
    answerGets({}, { desk: [deskTicket()] });
    render(
      <RouteGuard>
        <DeskQueue />
      </RouteGuard>,
      { user: plainSub }
    );
    expect(screen.getByRole("heading", { name: "Access Denied" })).toBeTruthy();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("old complaints links go to the desk for desk staff and to Help for everyone else", () => {
    expect(legacyComplaintTarget(true)).toBe("/support");
    expect(legacyComplaintTarget(false)).toBe("/help");
    expect(legacyComplaintTarget(true, "t1")).toBe("/support/t1");
    expect(legacyComplaintTarget(false, "t1")).toBe("/help/tickets/t1");
  });
});

// ─── The queue ──────────────────────────────────────────────────────────────

describe("the desk queue", () => {
  it("shows the status tabs with counts and the queue's rows", async () => {
    answerGets({}, { desk: [deskTicket(), escalatedTicket()] });
    render(<DeskQueue />, { user: admin });
    expect(screen.getByRole("status")).toHaveTextContent("Loading tickets");
    const row = (await screen.findByText("CMP-10042")).closest("tr")!;
    expect(row).toHaveTextContent("Wrong maths score on Ada's result");
    expect(row).toHaveTextContent("Paul Parent");
    expect(row).toHaveTextContent("for Ada Student");
    expect(row).toHaveTextContent("Results");
    expect(row).toHaveTextContent("Unassigned");
    expect(screen.getByText("With Talim support · read only")).toBeTruthy();
    const tabs = screen.getByRole("tablist", { name: "Ticket status" });
    await waitFor(() =>
      expect(within(tabs).getByRole("tab", { name: /Active/ })).toHaveTextContent("6")
    );
    expect(screen.getAllByRole("link", { name: /Wrong maths score/ })[0]).toHaveAttribute(
      "href",
      "/support/t1"
    );
  });

  it("sends the filters with the request: tab, area, the Unassigned shortcut and a debounced search", async () => {
    const user = userEvent.setup();
    answerGets({}, { desk: [deskTicket()] });
    render(<DeskQueue />, { user: admin });
    await screen.findByText("CMP-10042");
    const lastDeskGet = () =>
      [...mockGet.mock.calls]
        .reverse()
        .find(([path]) => String(path).startsWith("/tickets/desk/school?"))?.[0] as string;
    expect(lastDeskGet()).toBe(
      "/tickets/desk/school?status=open%2Cin_progress%2Cwaiting_on_user&page=1&limit=20"
    );

    await user.click(screen.getByRole("tab", { name: /Resolved/ }));
    await waitFor(() => expect(lastDeskGet()).toContain("status=resolved"));
    await user.selectOptions(screen.getByLabelText("Area"), "fees");
    await waitFor(() => expect(lastDeskGet()).toContain("area=fees"));
    await user.click(screen.getByRole("button", { name: /Unassigned \(2\)/ }));
    await waitFor(() => expect(lastDeskGet()).toContain("assigneeId=none"));
    await user.type(screen.getByRole("searchbox", { name: "Search tickets" }), "CMP-10042");
    await waitFor(() => expect(lastDeskGet()).toContain("q=CMP-10042"), { timeout: 2000 });
  });

  it("says when nothing waits for the desk", async () => {
    answerGets({}, { desk: [] });
    render(<DeskQueue />, { user: admin });
    expect(await screen.findByText("Nothing waiting for the desk")).toBeTruthy();
  });

  it("deskTabs adds the working statuses for Active", () => {
    const tabs = deskTabs(deskCounts());
    expect(tabs.find((t) => t.value === "active")?.count).toBe(6);
    expect(tabs.find((t) => t.value === "closed")?.count).toBe(5);
    expect(tabs.find((t) => t.value === "all")?.count).toBe(15);
    expect(statusesForTab("all")).toBeUndefined();
  });
});

// ─── Internal notes ─────────────────────────────────────────────────────────

describe("internal notes", () => {
  it("are marked at the desk, distinct from replies", async () => {
    answerGets({ t1: deskTicket() });
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    const note = (
      await screen.findByText("Checked the gradebook: the CA score was entered twice.")
    ).closest("li")!;
    expect(note).toHaveAttribute("data-internal", "true");
    expect(within(note).getByText("Internal note")).toBeTruthy();
    const reply = screen
      .getByText("Thanks, Paul. We're correcting it with the class teacher.")
      .closest("li")!;
    expect(reply).not.toHaveAttribute("data-internal");
    expect(screen.getByRole("link", { name: /result.png/ })).toHaveAttribute(
      "href",
      "https://cdn.test/result.png"
    );
  });

  it("are never shown to the requester, even if the payload carries one", async () => {
    answerGets({ t9: myTicket() });
    render(<MyTicketScreen ticketId="t9" />, { user: admin });
    expect(
      await screen.findByText("It's confirmed now. Reopen this if it happens again.")
    ).toBeTruthy();
    expect(screen.queryByText("Provider delay; it cleared overnight.")).toBeNull();
    expect(screen.queryByText("Internal note")).toBeNull();
    expect(screen.queryByRole("switch", { name: "Internal note" })).toBeNull();
  });

  it("visibleMessages drops them for the requester only", () => {
    const messages = myTicket().messages;
    expect(visibleMessages(messages, "desk")).toHaveLength(3);
    expect(visibleMessages(messages, "requester").map((m) => m.id)).toEqual(["a1", "a3"]);
  });
});

// ─── Desk flows ─────────────────────────────────────────────────────────────

describe("desk flows", () => {
  it("replies to the requester, then adds an internal note with a file", async () => {
    const user = userEvent.setup();
    answerGets({ t1: deskTicket() });
    mockPost.mockResolvedValue(deskTicket({ status: "in_progress" }));
    const { container } = render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");

    await user.type(screen.getByLabelText("Reply to the requester"), "We've fixed the score.");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/tickets/t1/messages", {
        body: "We've fixed the score.",
        attachments: [],
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Reply sent");
    await waitFor(() => expect(screen.getByLabelText("Reply to the requester")).toHaveValue(""));

    await user.click(screen.getByRole("switch", { name: "Internal note" }));
    expect(screen.getByRole("form", { name: "Add an internal note" })).toBeTruthy();
    const file = new File(["png"], "screenshot.png", { type: "image/png" });
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, file);
    expect(screen.getByRole("list", { name: "Files to attach" })).toHaveTextContent(
      "screenshot.png"
    );
    await user.type(
      screen.getByLabelText("Internal note", { selector: "textarea" }),
      "Asked the class teacher."
    );
    await user.click(screen.getByRole("button", { name: "Add internal note" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenLastCalledWith("/tickets/t1/messages", {
        body: "Asked the class teacher.",
        attachments: [
          {
            url: "https://cdn.test/upload/screenshot.png",
            name: "screenshot.png",
            mimeType: "image/png",
            size: 3,
          },
        ],
        internal: true,
      })
    );
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenLastCalledWith("Internal note added");
  });

  it("an empty reply is not sent", async () => {
    const user = userEvent.setup();
    answerGets({ t1: deskTicket() });
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Write a message first.");
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("sets status, priority and the assignee (the desk's staff list, and unassigning)", async () => {
    const user = userEvent.setup();
    answerGets({ t1: deskTicket() });
    mockPatch.mockImplementation(async (_path: string, body: object) =>
      deskTicket(body as Partial<Ticket>)
    );
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");

    await user.selectOptions(screen.getByLabelText("Status"), "waiting_on_user");
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/tickets/t1", { status: "waiting_on_user" })
    );
    expect(toast.success).toHaveBeenCalledWith("Status set to Waiting on requester");

    await user.selectOptions(screen.getByLabelText("Priority"), "urgent");
    await waitFor(() =>
      expect(mockPatch).toHaveBeenLastCalledWith("/tickets/t1", { priority: "urgent" })
    );

    const assignee = screen.getByLabelText("Assignee");
    await waitFor(() =>
      expect(within(assignee).getByRole("option", { name: "Dayo Desk" })).toBeTruthy()
    );
    // Only the desk's staff are offered (with Unassigned).
    expect(within(assignee).getAllByRole("option")).toHaveLength(3);
    expect(within(assignee).getByRole("option", { name: "Sade Admin (you)" })).toBeTruthy();
    await user.selectOptions(assignee, DESK_SUB_ADMIN.id);
    await waitFor(() =>
      expect(mockPatch).toHaveBeenLastCalledWith("/tickets/t1", { assigneeId: DESK_SUB_ADMIN.id })
    );
    await user.selectOptions(screen.getByLabelText("Assignee"), "");
    await waitFor(() =>
      expect(mockPatch).toHaveBeenLastCalledWith("/tickets/t1", { assigneeId: null })
    );
    // One read of the staff list, not one per option.
    expect(
      mockGet.mock.calls.filter(([path]) => path === "/tickets/desk/school/staff")
    ).toHaveLength(1);
  });

  it("escalates to Talim with a required note, then the ticket is read-only", async () => {
    const user = userEvent.setup();
    answerGets({ t1: deskTicket() });
    mockPost.mockResolvedValue(escalatedTicket({ id: "t1" }));
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");

    await user.click(screen.getByRole("button", { name: "Escalate to Talim" }));
    const sheet = screen.getByRole("dialog", { name: "Escalate to Talim" });
    await user.click(within(sheet).getByRole("button", { name: "Escalate to Talim" }));
    expect(within(sheet).getByText("Say why this needs Talim support.")).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();

    await user.type(
      within(sheet).getByLabelText(/Why does this need Talim/),
      "Gradebook bug: the CA saves twice."
    );
    await user.click(within(sheet).getByRole("button", { name: "Escalate to Talim" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/tickets/t1/escalate", {
        note: "Gradebook bug: the CA saves twice.",
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Replies are closed")).toBeTruthy();
    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Escalate to Talim" })).toBeNull();
  });

  it("offers only the transitions the backend allows: a resolved ticket goes back, or closes", async () => {
    answerGets({ t1: deskTicket({ status: "resolved", resolvedAt: "2026-10-06T00:00:00.000Z" }) });
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    const status = await screen.findByLabelText("Status");
    const offered = within(status)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value);
    expect(offered).toEqual(["open", "in_progress", "resolved", "closed"]);
  });

  it("a sub-admin on the desk can act too, assigning among the people already on tickets", async () => {
    answerGets({ t1: deskTicket({ assignee: { id: "sub-7", name: "Kemi Kind" } }) });
    render(<DeskTicketScreen ticketId="t1" />, { user: deskSub });
    await screen.findByText("Wrong maths score on Ada's result");
    const assignee = screen.getByLabelText("Assignee");
    expect(assignee).toHaveValue("sub-7");
    expect(within(assignee).getByRole("option", { name: "Dayo Desk (you)" })).toBeTruthy();
    expect(within(assignee).getByRole("option", { name: "Sade Admin" })).toBeTruthy();
    expect(within(assignee).getByRole("option", { name: "Kemi Kind" })).toBeTruthy();
  });
});

// ─── 409 handling ───────────────────────────────────────────────────────────

describe("409 handling", () => {
  it("a reply that meets a concurrent change says so, reloads the ticket and keeps the draft", async () => {
    const user = userEvent.setup();
    let current = deskTicket();
    answerGets(() => ({ t1: current }));
    mockPost.mockRejectedValueOnce(ticketConflict("TICKET_CHANGED"));
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");
    const readsBefore = ticketReads("t1");
    current = deskTicket({
      status: "waiting_on_user",
      assignee: { id: DESK_SUB_ADMIN.id, name: DESK_SUB_ADMIN.name },
    });

    await user.type(screen.getByLabelText("Reply to the requester"), "Here's the fix.");
    await user.click(screen.getByRole("button", { name: "Send reply" }));

    expect(await screen.findByText(/Someone else changed this ticket/)).toBeTruthy();
    await waitFor(() => expect(ticketReads("t1")).toBeGreaterThan(readsBefore));
    await waitFor(() =>
      expect(screen.getAllByText("Waiting on requester").length).toBeGreaterThan(0)
    );
    expect(screen.getByLabelText("Reply to the requester")).toHaveValue("Here's the fix.");
  });

  it("a change to a ticket closed meanwhile says it is closed", async () => {
    const user = userEvent.setup();
    answerGets({ t1: deskTicket() });
    mockPatch.mockRejectedValueOnce(ticketConflict("TICKET_CLOSED"));
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");
    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    expect(
      await screen.findByText("This ticket is closed, so it can't take replies or changes.")
    ).toBeTruthy();
  });

  it("escalating a ticket Talim already holds says so", async () => {
    const user = userEvent.setup();
    answerGets({ t1: deskTicket() });
    mockPost.mockRejectedValueOnce(ticketConflict("TICKET_ALREADY_TALIM"));
    render(<DeskTicketScreen ticketId="t1" />, { user: admin });
    await screen.findByText("Wrong maths score on Ada's result");
    await user.click(screen.getByRole("button", { name: "Escalate to Talim" }));
    await user.type(screen.getByLabelText(/Why does this need Talim/), "Needs Talim.");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Escalate to Talim" })
    );
    expect(await screen.findByText("This ticket is already with Talim support.")).toBeTruthy();
  });

  it("a reopen after the 7 days says to raise a new ticket", async () => {
    const user = userEvent.setup();
    answerGets({ t9: myTicket() });
    mockPost.mockRejectedValueOnce(ticketConflict("REOPEN_WINDOW_PASSED"));
    render(<MyTicketScreen ticketId="t9" />, { user: admin });
    await user.click(await screen.findByRole("button", { name: "Reopen ticket" }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/tickets/t9/reopen", {}));
    expect(await screen.findByText(/only be reopened within 7 days/)).toBeTruthy();
  });

  it("ticketErrorMessage and ticketConflictCode read the sub-code", () => {
    expect(ticketConflictCode(ticketConflict("MESSAGE_CAP"))).toBe("MESSAGE_CAP");
    expect(ticketConflictCode(new Error("x"))).toBeNull();
    expect(ticketErrorMessage(ticketConflict("TICKET_ESCALATED"))).toMatch(
      /escalated to Talim support/
    );
  });
});

// ─── Contact Talim support ──────────────────────────────────────────────────

describe("Contact Talim support (Help)", () => {
  it("lists the admin's tickets, shows the version and raises a new ticket to Talim", async () => {
    const user = userEvent.setup();
    answerGets({}, { mine: [myTicket()] });
    mockPost.mockResolvedValue(myTicket({ id: "t10", reference: "TS-9ZZ1A", status: "open" }));
    mockPathname = "/help";
    render(<HelpScreen />, { user: plainSub });
    expect(await screen.findByText("Bank transfer stuck on pending")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bank transfer stuck/ })).toHaveAttribute(
      "href",
      "/help/tickets/t9"
    );
    expect(screen.getByTestId("help-version")).toHaveTextContent("Version 1.5.0");
    // A sub-admin without the desk is not offered it.
    expect(screen.queryByRole("link", { name: /Open the support desk/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "New ticket" }));
    const sheet = screen.getByRole("dialog", { name: "New ticket" });
    await user.click(within(sheet).getByRole("button", { name: "Send to Talim support" }));
    expect(within(sheet).getByText("Choose what it's about.")).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();

    await user.selectOptions(within(sheet).getByLabelText(/What is it about/), "payments");
    await user.type(within(sheet).getByLabelText(/Subject/), "Receipts missing");
    await user.type(
      within(sheet).getByLabelText(/^Message/),
      "Receipts for last week's payments are missing."
    );
    await user.click(within(sheet).getByRole("button", { name: "Send to Talim support" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/tickets", {
        desk: "talim",
        area: "payments",
        subject: "Receipts missing",
        body: "Receipts for last week's payments are missing.",
      })
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/help/tickets/t10"));
    expect(toast.success).toHaveBeenCalledWith("Ticket TS-9ZZ1A sent to Talim support");
  });

  it("filters the list by status", async () => {
    const user = userEvent.setup();
    answerGets({}, { mine: [] });
    render(<HelpScreen />, { user: admin });
    expect(await screen.findByText("No open tickets")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Resolved" }));
    await waitFor(() =>
      expect(mockGet).toHaveBeenLastCalledWith("/tickets/mine?status=resolved&page=1&limit=15")
    );
  });

  it("replies, reopens within the 7 days and closes after confirming", async () => {
    const user = userEvent.setup();
    answerGets({ t9: myTicket() });
    mockPost.mockImplementation(async (path: string) =>
      path.endsWith("/close") ? myTicket({ status: "closed" }) : myTicket({ status: "open" })
    );
    render(<MyTicketScreen ticketId="t9" />, { user: admin });
    await screen.findByText("Bank transfer stuck on pending");
    expect(screen.getByText("Resolved")).toBeTruthy();

    await user.type(screen.getByLabelText("Your reply"), "It happened again today.");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/tickets/t9/messages", {
        body: "It happened again today.",
        attachments: [],
      })
    );

    await user.click(screen.getByRole("button", { name: "Close ticket" }));
    const confirm = screen.getByRole("dialog", { name: "Close this ticket?" });
    await user.click(within(confirm).getByRole("button", { name: "Close ticket" }));
    await waitFor(() => expect(mockPost).toHaveBeenLastCalledWith("/tickets/t9/close", {}));
    await waitFor(() => expect(screen.getByText("Replies are closed")).toBeTruthy());
  });

  it("a closed ticket takes no replies and offers no reopen", () => {
    expect(requesterReplyBlocked({ status: "closed" })).toMatch(/closed/);
    expect(requesterReplyBlocked({ status: "resolved" })).toBeNull();
    expect(
      canReopen(
        { status: "resolved", reopenableUntil: "2026-10-01T00:00:00Z" },
        Date.parse("2026-10-06T00:00:00Z")
      )
    ).toBe(false);
    expect(
      canReopen(
        { status: "resolved", reopenableUntil: "2026-10-10T00:00:00Z" },
        Date.parse("2026-10-06T00:00:00Z")
      )
    ).toBe(true);
  });
});

// ─── Deep links ─────────────────────────────────────────────────────────────

describe("deep links", () => {
  it("a support notification opens the ticket on the desk for desk staff and in Help for others", () => {
    const notification = {
      id: "n1",
      title: "New reply on CMP-10042",
      message: "Paul replied.",
      source: "school",
      sourceLabel: "School",
      category: "other",
      priority: "medium",
      status: "sent",
      sentBy: "Talim",
      isRead: true,
      createdAt: "2026-10-06T09:00:00.000Z",
      attachments: [],
      supportTicketId: "t1",
    } as unknown as AdminNotification;
    const props = { onMarkRead: jest.fn(), isMarkingRead: false };
    const { unmount } = render(<NotificationDetail notification={notification} {...props} />, {
      user: admin,
    });
    expect(screen.getByRole("link", { name: /Open ticket/ })).toHaveAttribute(
      "href",
      "/support/t1"
    );
    unmount();
    render(<NotificationDetail notification={notification} {...props} />, { user: plainSub });
    expect(screen.getByRole("link", { name: /Open ticket/ })).toHaveAttribute(
      "href",
      "/help/tickets/t1"
    );
  });

  it("the desk sends the admin's own ticket on to Help & support, and Help sends a desk ticket to the desk", async () => {
    answerGets({ t9: myTicket(), t1: deskTicket() });
    const { unmount } = render(<DeskTicketScreen ticketId="t9" />, { user: admin });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/help/tickets/t9"));
    unmount();
    render(<MyTicketScreen ticketId="t1" />, { user: admin });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/support/t1"));
  });
});

// ─── Pure rules ─────────────────────────────────────────────────────────────

describe("rules", () => {
  it("the desk query string sends only what is set", () => {
    expect(deskQueryString({})).toBe("");
    expect(
      deskQueryString({
        status: ["open", "in_progress"],
        assigneeId: "me",
        q: "  maths  ",
        page: 2,
        limit: 20,
      })
    ).toBe("?status=open%2Cin_progress&assigneeId=me&q=maths&page=2&limit=20");
  });

  it("read-only reasons: escalated or closed", () => {
    expect(deskReadOnlyReason(escalatedTicket())).toMatch(/escalated to Talim/);
    expect(deskReadOnlyReason(deskTicket({ status: "closed" }))).toMatch(/closed/);
    expect(deskReadOnlyReason(deskTicket())).toBeNull();
  });

  it("each side reads 'waiting' its own way", () => {
    expect(statusLabel("waiting_on_user", "desk")).toBe("Waiting on requester");
    expect(statusLabel("waiting_on_user", "requester")).toBe("Waiting on you");
  });

  it("attachments: at most 5, 25 MB each", () => {
    const small = (n: number) => Array.from({ length: n }, (_, i) => new File(["x"], `f${i}.txt`));
    expect(acceptAttachments(small(3), 3)).toMatchObject({
      problem: "Attach up to 5 files per message.",
    });
    expect(acceptAttachments(small(3), 3).accepted).toHaveLength(2);
    const huge = new File(["x"], "big.mov");
    Object.defineProperty(huge, "size", { value: 26 * 1024 * 1024 });
    expect(acceptAttachments([huge], 0)).toEqual({
      accepted: [],
      problem: "Files over 25 MB can't be attached.",
    });
  });

  it("assignee options put the viewer first and list each person once", () => {
    expect(
      assigneeOptions({ id: "me", name: "Sade Admin" }, [
        { id: "b", name: "Bola" },
        { id: "me", name: "Sade Admin" },
        { id: "a", name: "Ade" },
        { id: "b", name: "Bola" },
      ])
    ).toEqual([
      { value: "me", label: "Sade Admin (you)" },
      { value: "a", label: "Ade" },
      { value: "b", label: "Bola" },
    ]);
  });
});

afterAll(() => {
  act(() => undefined);
});
