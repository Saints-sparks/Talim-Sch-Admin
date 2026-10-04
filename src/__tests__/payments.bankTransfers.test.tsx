/** @jest-environment jsdom */
/**
 * Bank-transfer reconciliation (C4): who may open it, what the list shows,
 * confirming (with the allocation preview) and rejecting (a reason is
 * required, and nothing is sent without one).
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import BankTransfersPage from "@/app/fees-management/bank-transfers/page";
import { BankTransfersLink } from "@/components/payments/bankTransfers/BankTransfersLink";
import {
  allocationPreview,
  bankTransferActionMessage,
  safeProofUrl,
  transferClassName,
  validateRejectReason,
} from "@/components/payments/bankTransfers/bankTransfers.model";
import type { AdminBankTransfer } from "@/app/services/payments.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";
import { formatCalendarDate, formatDateTime } from "@/components/finance/formatters";
import { toast } from "@/components/CustomToast";

const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace }) }));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

const pending: AdminBankTransfer = {
  id: "tx1",
  reference: "TXN-2026-abc",
  status: "pending",
  amount: 75000,
  submittedAt: "2026-10-01T09:30:00.000Z",
  child: { id: "s1", name: "Ada Obi", admissionNumber: "ADM-001" },
  parent: { id: "p1", name: "Chidi Obi" },
  items: [
    { feeAssignmentId: "fa1", label: "Tuition", amount: 50000 },
    { feeAssignmentId: "fa2", label: "Bus", amount: 25000 },
  ],
  transferReference: "GTB-998877",
  paidOn: "2026-09-30T00:00:00.000Z",
  proofUrl: "https://cdn.test/proof.png",
  reviewedAt: null,
  rejectionReason: "",
  receiptId: null,
};

const confirmed: AdminBankTransfer = {
  ...pending,
  id: "tx2",
  status: "confirmed",
  child: { id: "s2", name: "Tolu Ade", admissionNumber: "" },
  reviewedAt: "2026-10-02T10:00:00.000Z",
  receiptId: "r1",
};

/** The GET the screen makes, answered per status. */
function answerLists() {
  mockGet.mockImplementation(async (path: string) => {
    const url = new URL(path, "http://test");
    if (url.pathname !== "/payments/admin/bank-transfers")
      throw new Error(`unexpected GET ${path}`);
    const status = url.searchParams.get("status");
    const data = status === "pending" ? [pending] : status === "confirmed" ? [confirmed] : [];
    return { data, total: data.length, page: 1, limit: Number(url.searchParams.get("limit")) };
  });
}

const feesSubAdmin = { ...mockSubAdmin, permissions: ["manage:fees"] };
const paymentsOnly = { ...mockSubAdmin, permissions: ["manage:payments"] };

beforeEach(() => {
  jest.clearAllMocks();
  answerLists();
});

describe("who may reconcile", () => {
  it("keeps a sub-admin without manage:fees out of the page and never calls the API", async () => {
    render(<BankTransfersPage />, { user: paymentsOnly });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/access-denied"));
    expect(screen.queryByRole("heading", { name: "Bank transfers" })).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("opens the page for a sub-admin with manage:fees", async () => {
    render(<BankTransfersPage />, { user: feesSubAdmin });
    expect(await screen.findByRole("heading", { name: "Bank transfers" })).toBeInTheDocument();
    expect(await screen.findByText("Chidi Obi")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("hides the entry link without manage:fees and shows it with the waiting count otherwise", async () => {
    const { unmount } = render(<BankTransfersLink />, { user: paymentsOnly });
    expect(screen.queryByRole("link", { name: /bank transfers/i })).not.toBeInTheDocument();
    unmount();

    render(<BankTransfersLink />, { user: mockAdmin });
    const link = await screen.findByRole("link", { name: "Bank transfers, 1 waiting" });
    expect(link).toHaveAttribute("href", "/fees-management/bank-transfers");
    expect(mockGet).toHaveBeenCalledWith(
      "/payments/admin/bank-transfers?status=pending&page=1&limit=1"
    );
  });
});

describe("the pending list", () => {
  it("shows parent, child, class, amount, reference, paid on, proof and submitted", async () => {
    render(<BankTransfersPage />, { user: mockAdmin });
    const row = (await screen.findByText("Chidi Obi")).closest("tr") as HTMLElement;
    const cells = within(row);
    expect(cells.getByText("Ada Obi")).toBeInTheDocument();
    expect(cells.getByText("ADM-001")).toBeInTheDocument();
    expect(cells.getByText("₦75,000.00")).toBeInTheDocument();
    expect(cells.getByText("GTB-998877")).toBeInTheDocument();
    // The day the parent picked, whatever the viewer's timezone.
    expect(cells.getByText(formatCalendarDate("2026-09-30T00:00:00.000Z"))).toBeInTheDocument();
    expect(formatCalendarDate("2026-09-30T00:00:00.000Z")).toMatch(/^30 Sep/);
    expect(cells.getByRole("link", { name: /view proof/i })).toHaveAttribute(
      "href",
      "https://cdn.test/proof.png"
    );
    expect(cells.getByText(formatDateTime("2026-10-01T09:30:00.000Z"))).toBeInTheDocument();
    // The list has no class yet: an em dash, not a guess.
    expect(screen.getByRole("columnheader", { name: "Class" })).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith(
      "/payments/admin/bank-transfers?status=pending&page=1&limit=20"
    );
    expect(await screen.findByRole("tab", { name: "Pending, 1 waiting" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("switches lists with the status tabs", async () => {
    const user = userEvent.setup();
    render(<BankTransfersPage />, { user: mockAdmin });
    await screen.findByText("Chidi Obi");

    await user.click(screen.getByRole("tab", { name: "Confirmed" }));
    expect(await screen.findByText("Tolu Ade")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Confirmed" })).toHaveAttribute("aria-selected", "true");
    expect(
      screen.queryByRole("button", { name: /^Confirm transfer from/ })
    ).not.toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith(
      "/payments/admin/bank-transfers?status=confirmed&page=1&limit=20"
    );

    await user.click(screen.getByRole("tab", { name: "Rejected" }));
    expect(await screen.findByText("No rejected transfers.")).toBeInTheDocument();
  });
});

describe("confirming a transfer", () => {
  it("previews the allocation, then confirms and reports the receipt", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValueOnce({
      success: true,
      transaction: { _id: "tx1" },
      receipt: { receiptNumber: "RCP-0042" },
    });
    render(<BankTransfersPage />, { user: feesSubAdmin });

    await user.click(
      await screen.findByRole("button", { name: "Confirm transfer from Chidi Obi for Ada Obi" })
    );
    const dialog = screen.getByRole("dialog", { name: "Confirm bank transfer" });
    const preview = within(dialog).getByRole("table", { name: "How it will be applied" });
    expect(within(preview).getByText("Tuition")).toBeInTheDocument();
    expect(within(preview).getByText("₦50,000.00")).toBeInTheDocument();
    expect(within(preview).getByText("Bus")).toBeInTheDocument();
    expect(within(preview).getByText("₦75,000.00")).toBeInTheDocument();
    expect(within(dialog).getByText(/not added to the Talim wallet/)).toBeInTheDocument();
    // Focus moved into the dialog, on the safe choice.
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.click(within(dialog).getByRole("button", { name: "Confirm transfer" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/payments/admin/bank-transfers/tx1/confirm")
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Transfer confirmed. Receipt RCP-0042 issued and the parent told."
      )
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains a transfer someone else already decided", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValueOnce(
      new ApiError("INVALID_STATE_TRANSITION", "This transfer was already confirmed.", 409)
    );
    render(<BankTransfersPage />, { user: mockAdmin });
    await user.click(await screen.findByRole("button", { name: /^Confirm transfer from/ }));
    await user.click(screen.getByRole("button", { name: "Confirm transfer" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("This transfer was already confirmed.")
    );
  });
});

describe("rejecting a transfer", () => {
  it("requires a reason: nothing is sent and the field is flagged", async () => {
    const user = userEvent.setup();
    render(<BankTransfersPage />, { user: mockAdmin });
    await user.click(
      await screen.findByRole("button", { name: "Reject transfer from Chidi Obi for Ada Obi" })
    );
    const dialog = screen.getByRole("dialog", { name: "Reject bank transfer" });
    const reason = within(dialog).getByLabelText(/reason/i);
    expect(reason).toHaveFocus();

    await user.type(reason, "   ");
    await user.click(within(dialog).getByRole("button", { name: "Reject transfer" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Give a reason. The parent sees it."
    );
    expect(reason).toHaveAttribute("aria-invalid", "true");
    expect(reason).toHaveFocus();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("sends the trimmed reason and closes", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValueOnce({ success: true, transaction: { _id: "tx1" } });
    render(<BankTransfersPage />, { user: mockAdmin });
    await user.click(await screen.findByRole("button", { name: /^Reject transfer from/ }));
    const dialog = screen.getByRole("dialog", { name: "Reject bank transfer" });

    await user.type(
      within(dialog).getByLabelText(/reason/i),
      "  Nothing arrived with this reference  "
    );
    await user.click(within(dialog).getByRole("button", { name: "Reject transfer" }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/payments/admin/bank-transfers/tx1/reject", {
        reason: "Nothing arrived with this reference",
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Transfer rejected. The parent has been told why.");
  });
});

describe("reconciliation rules", () => {
  it("adds the allocation in kobo and reports what is not matched to a fee", () => {
    const odd: AdminBankTransfer = {
      ...pending,
      amount: 100.3,
      items: [
        { feeAssignmentId: "a", label: "A", amount: 0.1 },
        { feeAssignmentId: "b", label: "", amount: 0.2 },
        { feeAssignmentId: "c", label: "C", amount: null },
      ],
    };
    const preview = allocationPreview(odd);
    expect(preview.allocated).toBe(0.3);
    expect(preview.unallocated).toBe(100);
    expect(preview.lines.map((line) => line.label)).toEqual(["A", "Fee", "C"]);
    expect(preview.lines[2].amount).toBeNull();
    expect(allocationPreview(pending)).toMatchObject({ allocated: 75000, unallocated: 0 });
  });

  it("checks the rejection reason", () => {
    expect(validateRejectReason("")).toMatch(/give a reason/i);
    expect(validateRejectReason("  \n ")).toMatch(/give a reason/i);
    expect(validateRejectReason("x".repeat(501))).toMatch(/500 characters/);
    expect(validateRejectReason("Not received")).toBeNull();
  });

  it("links only http(s) proof and reads a class when the API sends one", () => {
    expect(safeProofUrl("javascript:alert(1)")).toBeNull();
    expect(safeProofUrl("")).toBeNull();
    expect(safeProofUrl("https://cdn.test/a.png")).toBe("https://cdn.test/a.png");
    expect(transferClassName(pending)).toBe("—");
    expect(
      transferClassName({ ...pending, child: { ...pending.child, class: { name: "JSS 2A" } } })
    ).toBe("JSS 2A");
    expect(
      transferClassName({ ...pending, child: { ...pending.child, className: "Grade 5" } })
    ).toBe("Grade 5");
  });

  it("words the failures the bursar can act on", () => {
    expect(bankTransferActionMessage(new ApiError("FORBIDDEN", "x", 403), "confirm")).toMatch(
      /Manage Fees/
    );
    expect(bankTransferActionMessage(new ApiError("NOT_FOUND", "x", 404), "reject")).toMatch(
      /no longer exists/
    );
    expect(bankTransferActionMessage(new Error("boom"), "reject")).toBe("boom");
  });
});
