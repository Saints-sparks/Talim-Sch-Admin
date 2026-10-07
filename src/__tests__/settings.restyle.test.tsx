/** @jest-environment jsdom */
/**
 * Settings and Profile in the tl design system: the settings page has its
 * heading, the sections as 44px buttons (the current one marked) and the
 * version; the profile page shows a labelled skeleton while it loads.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, mockAdmin } from "@/test-utils/render";
import SettingsPage from "@/app/settings/page";
import ProfilePage from "@/app/profile/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/settings",
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/components/settings/SchoolProfileSection", () => ({
  SchoolProfileSection: () => <p>School profile form</p>,
}));
jest.mock("@/components/settings/AppearanceSection", () => ({
  AppearanceSection: () => <p>Appearance form</p>,
}));
jest.mock("@/components/profile/useProfileData", () => ({
  useProfileSnapshot: () => ({
    admin: null,
    school: null,
    isLoading: true,
    isError: false,
    retry: jest.fn(),
  }),
}));

describe("settings, restyled", () => {
  it("lists the sections as buttons, marks the current one and shows the version", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />, { user: mockAdmin });
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent("School Profile");
    expect(screen.getByText("School profile form")).toBeTruthy();
    expect(screen.getByText("Version 1.5.0")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Appearance/ }));
    expect(screen.getByText("Appearance form")).toBeTruthy();
  });
});

describe("profile, restyled", () => {
  it("shows a labelled skeleton while the profile loads", () => {
    render(<ProfilePage />, { user: mockAdmin });
    expect(screen.getByRole("status", { name: "Loading Profile" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });
});
