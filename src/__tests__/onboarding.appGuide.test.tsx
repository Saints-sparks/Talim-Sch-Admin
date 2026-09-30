/**
 * @jest-environment jsdom
 *
 * The first-visit guide opens once per user, and only over the page it
 * describes: a page that never renders its targets (Access Denied for a
 * sub-admin without the permission) keeps the one-time tour for later.
 */
import React from "react";
import { act, render, screen } from "@testing-library/react";
import AppGuide, { guideButtonPosition } from "@/components/onboarding/AppGuide";

jest.mock("next/navigation", () => ({ usePathname: () => "/settings" }));
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
// The session object is stable between renders, as AuthContext's is.
const mockSession = { user: { userId: "sub-1" }, isLoading: false };
jest.mock("@/context/AuthContext", () => ({ useAuth: () => mockSession }));

const wait = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

beforeAll(() => {
  // jsdom has no scrolling.
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("AppGuide first visit", () => {
  it("stays closed over a page without its targets, and keeps the tour for later", async () => {
    render(<AppGuide />);
    await wait(600);
    expect(screen.queryByRole("button", { name: "Close guide" })).not.toBeInTheDocument();
    expect(Object.keys(localStorage).filter((k) => k.endsWith(":auto-opened"))).toEqual([]);
  });

  it("opens once the page's targets are there", async () => {
    render(
      <>
        <div data-guide="settings-header" />
        <AppGuide />
      </>,
    );
    await wait(300);
    expect(await screen.findByRole("button", { name: "Close guide" })).toBeInTheDocument();
    await wait(300);
    expect(screen.getByRole("button", { name: "Close guide" })).toBeInTheDocument();
    expect(Object.keys(localStorage).some((k) => k.endsWith("sub-1:auto-opened"))).toBe(true);
  });
});

describe("the Guide button's place", () => {
  it("rises above the composer on Messages, so it never covers Send", () => {
    expect(guideButtonPosition("/messages")).toBe("bottom-24 right-5");
    expect(guideButtonPosition("/messages/")).toBe("bottom-24 right-5");
  });

  it("keeps the bottom-right corner everywhere else", () => {
    for (const path of ["/settings", "/dashboard", "/messages-archive", null]) expect(guideButtonPosition(path)).toBe("bottom-5 right-5");
  });
});
