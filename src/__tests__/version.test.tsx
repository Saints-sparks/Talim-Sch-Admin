/** @jest-environment jsdom */
/**
 * v1.5 §3: the app is version 1.5.0, read from package.json, and shows
 * "Version 1.5.0" at the foot of the sidebar.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import packageJson from "../../package.json";
import { APP_VERSION, versionLabel } from "@/lib/appVersion";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe("version 1.5.0", () => {
  it("package.json is 1.5.0 and the app reads it from there", () => {
    expect(packageJson.version).toBe("1.5.0");
    expect(APP_VERSION).toBe("1.5.0");
  });

  it("is shown as Version 1.5.0", () => {
    expect(versionLabel()).toBe("Version 1.5.0");
    render(<SidebarFooter />);
    expect(screen.getByText("Version 1.5.0")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Help & support/ })).toHaveAttribute("href", "/help");
  });
});
