/** @jest-environment jsdom */
/**
 * Receipt settings live in Settings (A5): the Fees sidebar's signature card
 * reads and writes `/settings/receipt`, never the deprecated
 * `/fees/receipt-settings`, and is shown only to an admin with
 * `manage:settings` (the route's permission).
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import { FeesSidebar } from "@/components/fees/FeesSidebar";
import { api } from "@/lib/apiClient";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;

const settings = {
  schoolId: "school-1",
  signatureUrl: "",
  signatureName: "Mrs Ade",
  signatureTitle: "Principal",
  showSchoolLogo: true,
  allowParentDownload: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/settings/receipt") return { success: true, settings };
    if (path.startsWith("/fees/dashboard/categories-summary")) return [];
    throw new Error(`unexpected GET ${path}`);
  });
  mockPatch.mockImplementation(async (_path: string, body: Record<string, unknown>) => ({
    success: true,
    settings: { ...settings, ...body },
  }));
});

describe("receipt settings in Fees", () => {
  it("loads the signature card from GET /settings/receipt for the school admin", async () => {
    render(<FeesSidebar canManage onViewCategories={jest.fn()} />, { user: mockAdmin });

    expect(await screen.findByText("Signature for Receipts")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue("Mrs Ade")).toBeInTheDocument());
    expect(mockGet).toHaveBeenCalledWith("/settings/receipt");
    expect(mockGet.mock.calls.flat()).not.toContain("/fees/receipt-settings");
  });

  it("saves the signatory through PATCH /settings/receipt", async () => {
    const user = userEvent.setup();
    render(<FeesSidebar canManage onViewCategories={jest.fn()} />, { user: mockAdmin });

    const name = await screen.findByDisplayValue("Mrs Ade");
    await user.clear(name);
    await user.type(name, "Mr Obi");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/settings/receipt", {
        signatureName: "Mr Obi",
        signatureTitle: "Principal",
      })
    );
  });

  it("neither shows the card nor calls the route for a fees-only sub-admin", async () => {
    const feesOnly = { ...mockSubAdmin, permissions: ["manage:fees"] };
    render(<FeesSidebar canManage onViewCategories={jest.fn()} />, { user: feesOnly });

    expect(await screen.findByText("Fee Categories")).toBeInTheDocument();
    expect(screen.queryByText("Signature for Receipts")).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalledWith("/settings/receipt");
  });
});
