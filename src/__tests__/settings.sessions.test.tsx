/** @jest-environment jsdom */
/**
 * Settings → Security → Signed-in devices (Round 4 §34): the list, "Sign out"
 * for another device, and "Sign out of other devices" behind a confirmation.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/test-utils/render";
import { toast } from "@/components/CustomToast";
import { SessionsCard } from "@/components/settings/security/SessionsCard";
import {
  deviceKind,
  lastActiveLabel,
  sessionDetails,
  sessionTitle,
} from "@/components/settings/security/sessionFormat";
import { sortSessions } from "@/hooks/settings/useSessions";
import type { AuthSession } from "@/types/round4Contract";

const listSessions = jest.fn();
const revokeSession = jest.fn();
const revokeOtherSessions = jest.fn();

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() } }));
jest.mock("@/app/services/auth.service", () => ({
  authService: {
    listSessions: () => listSessions(),
    revokeSession: (id: string) => revokeSession(id),
    revokeOtherSessions: () => revokeOtherSessions(),
  },
}));

const NOW = Date.now();
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const thisMac: AuthSession = {
  id: "s-mac",
  device: "Desktop",
  browser: "Chrome 128",
  os: "macOS 15",
  ip: "102.89.1.4",
  lastUsedAt: ago(0),
  createdAt: ago(600),
  current: true,
};
const phone: AuthSession = {
  id: "s-phone",
  device: "iPhone",
  browser: "Safari 18",
  os: "iOS 18",
  ip: "105.112.9.9",
  lastUsedAt: ago(180),
  createdAt: ago(5000),
  current: false,
};
const laptop: AuthSession = {
  id: "s-laptop",
  device: null,
  browser: "Firefox 130",
  os: "Windows 11",
  ip: null,
  lastUsedAt: ago(60 * 24 * 3),
  createdAt: ago(60 * 24 * 10),
  current: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  listSessions.mockResolvedValue([laptop, phone, thisMac]);
  revokeSession.mockResolvedValue(undefined);
  revokeOtherSessions.mockResolvedValue({ revoked: 2 });
});

const rows = () => within(screen.getByRole("list", { name: "Signed-in devices" })).getAllByRole("listitem");

describe("session formatting", () => {
  it("describes a device by browser and system, with the device and IP under it", () => {
    expect(sessionTitle(phone)).toBe("Safari 18 on iOS 18");
    expect(sessionDetails(phone)).toBe("iPhone · IP 105.112.9.9");
    expect(sessionTitle({ ...laptop, browser: null, os: null })).toBe("Unknown device");
    expect(sessionDetails(laptop)).toBe("");
    expect(deviceKind(phone)).toBe("phone");
    expect(deviceKind(thisMac)).toBe("computer");
    expect(deviceKind({ ...phone, device: "iPad", os: "iPadOS 18" })).toBe("tablet");
  });

  it("says when a device was last active", () => {
    const now = new Date(NOW);
    expect(lastActiveLabel(thisMac, now)).toBe("Active now");
    expect(lastActiveLabel(phone, now)).toBe("Last active 3 hours ago");
    expect(lastActiveLabel({ ...phone, lastUsedAt: "nonsense", createdAt: "nonsense" }, now)).toBe("Last active: unknown");
  });

  it("lists this device first, then the most recent", () => {
    expect(sortSessions([laptop, phone, thisMac]).map((s) => s.id)).toEqual(["s-mac", "s-phone", "s-laptop"]);
  });
});

describe("SessionsCard", () => {
  it("lists every device, marks this one, and offers Sign out only on the others", async () => {
    render(<SessionsCard />);
    await waitFor(() => expect(rows()).toHaveLength(3));

    const [first, second, third] = rows();
    expect(within(first).getByText("Chrome 128 on macOS 15")).toBeInTheDocument();
    expect(within(first).getByText("This device")).toBeInTheDocument();
    expect(within(first).getByText(/Active now/)).toBeInTheDocument();
    expect(within(first).queryByRole("button", { name: /Sign out/ })).not.toBeInTheDocument();

    expect(within(second).getByText(/iPhone · IP 105\.112\.9\.9/)).toBeInTheDocument();
    expect(within(second).getByRole("button", { name: "Sign out Safari 18 on iOS 18 (105.112.9.9)" })).toBeInTheDocument();
    expect(within(third).getByRole("button", { name: "Sign out Firefox 130 on Windows 11" })).toBeInTheDocument();
    expect(within(third).queryByText("This device")).not.toBeInTheDocument();
  });

  it("signs one other device out and drops it from the list", async () => {
    const user = userEvent.setup();
    listSessions.mockResolvedValueOnce([thisMac, phone, laptop]).mockResolvedValue([thisMac, laptop]);
    render(<SessionsCard />);
    await user.click(await screen.findByRole("button", { name: /Sign out Safari 18 on iOS 18/ }));

    expect(revokeSession).toHaveBeenCalledWith("s-phone");
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(screen.queryByText("Safari 18 on iOS 18")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Signed out of that device");
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("keeps the device and says so when signing it out fails", async () => {
    const user = userEvent.setup();
    revokeSession.mockRejectedValue(new Error("boom"));
    render(<SessionsCard />);
    await user.click(await screen.findByRole("button", { name: /Sign out Safari 18 on iOS 18/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText("Safari 18 on iOS 18")).toBeInTheDocument();
  });

  it("signs out of other devices only after the confirmation", async () => {
    const user = userEvent.setup();
    listSessions.mockResolvedValueOnce([thisMac, phone, laptop]).mockResolvedValue([thisMac]);
    render(<SessionsCard />);
    await waitFor(() => expect(rows()).toHaveLength(3));

    // Cancelling sends nothing.
    await user.click(screen.getByRole("button", { name: /Sign out of other devices/ }));
    const dialog = screen.getByRole("dialog", { name: "Sign out of other devices?" });
    expect(within(dialog).getByText(/2 other devices will have to sign in again\. This device stays signed in\./)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(revokeOtherSessions).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Sign out of other devices/ }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Sign out of other devices?" })).getByRole("button", {
        name: "Sign out other devices",
      })
    );
    expect(revokeOtherSessions).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(within(rows()[0]).getByText("This device")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Signed out of 2 other devices");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("can't sign out of other devices when there are none", async () => {
    listSessions.mockResolvedValue([thisMac]);
    render(<SessionsCard />);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const bulk = screen.getByRole("button", { name: /Sign out of other devices/ });
    expect(bulk).toBeDisabled();
    expect(bulk).toHaveAccessibleDescription("No other devices are signed in.");
  });

  it("when this device can't be identified, offers Sign out on each row but not the bulk action", async () => {
    listSessions.mockResolvedValue([{ ...thisMac, current: false }, phone]);
    render(<SessionsCard />);
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(screen.queryByText("This device")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Sign out .* on / })).toHaveLength(2);
    const bulk = screen.getByRole("button", { name: /Sign out of other devices/ });
    expect(bulk).toBeDisabled();
    expect(bulk).toHaveAccessibleDescription(/couldn't tell which of these is this device/);
  });

  it("shows a failed load with a retry", async () => {
    const user = userEvent.setup();
    listSessions.mockRejectedValueOnce(new Error("down")).mockResolvedValue([thisMac]);
    render(<SessionsCard />);
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    await waitFor(() => expect(rows()).toHaveLength(1));
  });
});
