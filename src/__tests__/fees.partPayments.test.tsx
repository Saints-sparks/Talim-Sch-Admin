/** @jest-environment jsdom */
/**
 * Part payments (C1, C3): the fee form's rule, the school minimum in Finance
 * settings, and the ledger balances the manual payment form shows.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import {
  feeBalance,
  feeBalanceSummary,
  ledgerByAssignment,
  manualAmountProblem,
  parseMinimumPartPayment,
  partPaymentHint,
  totalOwed,
} from "@/components/fees/partPayments";
import { PartPaymentHint } from "@/components/fees/PartPaymentHint";
import { PartPaymentSettingsCard } from "@/components/settings/PartPaymentSettingsCard";
import { ManualPaymentModal } from "@/components/payments/ManualPaymentModal";
import { EMPTY_FEE_FORM, feeFormToPayload } from "@/hooks/fees/feeForm";
import type { FeeLedgerRow } from "@/app/services/fees.service";
import type { FinanceSettings } from "@/app/services/school-settings.service";
import { api } from "@/lib/apiClient";

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

/** A ledger row in naira, as `GET /fees/payments/student/:id` returns it. */
function row(feeAssignmentId: unknown, fields: Partial<FeeLedgerRow>): FeeLedgerRow {
  return {
    _id: `row-${String(feeAssignmentId)}`,
    schoolId: "school-1",
    studentId: "s1",
    feeAssignmentId,
    status: "unpaid",
    amountDue: 0,
    amountPaid: 0,
    balance: 0,
    amountExpected: 0,
    paymentStatus: "pending",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...fields,
  } as FeeLedgerRow;
}

describe("the fee form's part-payment rule", () => {
  it("sends allowPartialPayment as set", () => {
    const base = { ...EMPTY_FEE_FORM, name: "Tuition", categoryId: "cat1", defaultAmount: "50000" };
    expect(feeFormToPayload(base).allowPartialPayment).toBe(false);
    expect(feeFormToPayload({ ...base, allowPartialPayment: true }).allowPartialPayment).toBe(true);
  });

  it("says the whole fee is paid at once when parts are off", () => {
    expect(partPaymentHint({ allowPartialPayment: false, defaultAmount: "50000" }, 5000)).toEqual({
      tone: "info",
      text: "Parents pay the whole fee in one payment.",
    });
  });

  it("quotes the school minimum when parts are on", () => {
    const hint = partPaymentHint({ allowPartialPayment: true, defaultAmount: "50000" }, 5000);
    expect(hint.tone).toBe("info");
    expect(hint.text).toContain("at least ₦5,000.00");
  });

  it("warns when the minimum is not below the fee", () => {
    const hint = partPaymentHint({ allowPartialPayment: true, defaultAmount: "5000" }, 5000);
    expect(hint.tone).toBe("warning");
    expect(hint.text).toMatch(/will still pay it in one go/);
  });

  it("allows any amount with no minimum, and stays generic when the minimum is unknown", () => {
    expect(partPaymentHint({ allowPartialPayment: true, defaultAmount: "" }, 0).text).toMatch(
      /any amount/
    );
    expect(
      partPaymentHint({ allowPartialPayment: true, defaultAmount: "50000" }, undefined).text
    ).toMatch(/school's minimum part payment/);
  });
});

describe("the school minimum part payment", () => {
  it("accepts naira of 0 or more with at most two decimals", () => {
    expect(parseMinimumPartPayment("0")).toEqual({ value: 0 });
    expect(parseMinimumPartPayment(" 2500.5 ")).toEqual({ value: 2500.5 });
    expect(parseMinimumPartPayment("").error).toBeDefined();
    expect(parseMinimumPartPayment("-1").error).toBeDefined();
    expect(parseMinimumPartPayment("1.234").error).toBeDefined();
    expect(parseMinimumPartPayment("ten").error).toBeDefined();
  });

  it("saves it through /settings/finance and refuses a bad value", async () => {
    const user = userEvent.setup();
    const save = jest.fn().mockResolvedValue(undefined);
    const settings = {
      schoolId: "school-1",
      requireEmailOtpForWithdrawals: true,
      minimumWithdrawalAmount: 10000,
      defaultBankAccountId: null,
      minimumPartPayment: 0,
    } satisfies FinanceSettings;
    render(<PartPaymentSettingsCard settings={settings} canManage saving={false} save={save} />);

    const field = screen.getByLabelText("Minimum part payment (₦)");
    expect(field).toHaveValue(0);
    await user.clear(field);
    await user.type(field, "1.234");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at most two decimals/);
    expect(save).not.toHaveBeenCalled();

    await user.clear(field);
    await user.type(field, "2500.50");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save).toHaveBeenCalledWith({ minimumPartPayment: 2500.5 }, "Minimum part payment saved");
  });

  it("is read-only without manage:settings", () => {
    render(
      <PartPaymentSettingsCard
        settings={undefined}
        canManage={false}
        saving={false}
        save={jest.fn()}
      />
    );
    expect(screen.getByLabelText("Minimum part payment (₦)")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });
});

describe("the fee form hint with the live minimum", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation(async (path: string) => {
      if (path === "/settings/finance")
        return { success: true, settings: { minimumPartPayment: 7500 } };
      throw new Error(`unexpected GET ${path}`);
    });
  });

  it("reads the minimum for an admin who may", async () => {
    render(<PartPaymentHint allowPartialPayment defaultAmount="50000" />, { user: mockAdmin });
    expect(await screen.findByText(/at least ₦7,500.00/)).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/settings/finance");
  });

  it("reads the minimum for a fees-only sub-admin too (GET takes manage:fees)", async () => {
    const feesOnly = { ...mockSubAdmin, permissions: ["manage:fees"] };
    render(<PartPaymentHint allowPartialPayment defaultAmount="50000" />, { user: feesOnly });
    expect(await screen.findByText(/at least ₦7,500.00/)).toBeInTheDocument();
  });

  it("asks nothing of an admin with neither permission, and still states the rule", () => {
    const studentsOnly = { ...mockSubAdmin, permissions: ["manage:students"] };
    render(<PartPaymentHint allowPartialPayment defaultAmount="50000" />, { user: studentsOnly });
    expect(screen.getByText(/school's minimum part payment/)).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe("ledger balances", () => {
  it("reads a part-paid row, an unpaid fee with no row, and a populated assignment ref", () => {
    const rows = [
      row("fa1", { status: "part_paid", amountDue: 50000, amountPaid: 30000, balance: 20000 }),
      row({ _id: "fa3" }, { status: "paid", amountDue: 10000, amountPaid: 10000, balance: 0 }),
    ];
    const byId = ledgerByAssignment(rows);
    expect([...byId.keys()]).toEqual(["fa1", "fa3"]);

    const part = feeBalance({ amount: 50000 }, byId.get("fa1"));
    expect(part).toMatchObject({
      due: 50000,
      paid: 30000,
      balance: 20000,
      status: "part_paid",
      fromLedger: true,
    });
    expect(feeBalanceSummary(part)).toBe("Part paid · ₦20,000.00 left");

    const none = feeBalance({ amount: 15000 });
    expect(none).toMatchObject({ balance: 15000, status: "unpaid", fromLedger: false });
    expect(feeBalanceSummary(none)).toBe("Unpaid · ₦15,000.00 due");
    expect(feeBalanceSummary(feeBalance({ amount: 10000 }, byId.get("fa3")))).toBe("Paid in full");

    expect(totalOwed([part, none])).toBe(35000);
  });

  it("reads a fee nobody has paid towards, filled in by the API with its late fee", () => {
    const filled = row(
      { _id: "fa4" },
      { _id: null, recorded: false, status: "unpaid", amountDue: 21000, balance: 21000, lateFee: 1000 }
    );
    expect(ledgerByAssignment([filled]).has("fa4")).toBe(true);
    const balance = feeBalance({ amount: 20000 }, filled);
    expect(balance).toMatchObject({ due: 21000, balance: 21000, status: "unpaid", lateFee: 1000, fromLedger: true });
    expect(feeBalanceSummary(balance)).toBe("Unpaid · ₦21,000.00 due (incl. ₦1,000.00 late fee)");
  });

  it("refuses an amount above what is owed, or of zero", () => {
    expect(manualAmountProblem(35000.01, 35000)).toMatch(/more than the ₦35,000.00 still owed/);
    expect(manualAmountProblem(0, 35000)).toMatch(/above zero/);
    expect(manualAmountProblem(35000, 35000)).toBeNull();
    expect(manualAmountProblem(5000, 35000)).toBeNull();
  });
});

// ─── The manual payment form ──────────────────────────────────────────────────

const mutateAsync = jest.fn();
jest.mock("@/hooks/queries/reference", () => ({
  useClasses: () => ({ data: [{ _id: "c1", name: "JSS 1" }], isPending: false }),
}));
jest.mock("@/hooks/finance/useManualPaymentOptions", () => ({
  ...jest.requireActual("@/hooks/finance/useManualPaymentOptions"),
  useStudentsInClass: (classId: string) => ({
    data: classId
      ? [{ _id: "s1", userId: { firstName: "Ada", lastName: "Obi" }, admissionNumber: "ADM-1" }]
      : [],
    isPending: false,
    isError: false,
  }),
  useClassFeeAssignments: (classId: string) => ({
    data: classId
      ? [
          {
            _id: "fa1",
            feeItemId: { _id: "i1", name: "Tuition" },
            amount: 50000,
            dueDate: "2026-09-10",
          },
          {
            _id: "fa2",
            feeItemId: { _id: "i2", name: "Bus" },
            amount: 15000,
            dueDate: "2026-09-20",
          },
          {
            _id: "fa3",
            feeItemId: { _id: "i3", name: "Uniform" },
            amount: 10000,
            dueDate: "2026-09-05",
          },
        ]
      : [],
    isPending: false,
    isError: false,
  }),
}));
jest.mock("@/hooks/fees/queries", () => ({
  useStudentFeeLedger: (studentId: string) => ({
    data: studentId
      ? [
          row("fa1", { status: "part_paid", amountDue: 50000, amountPaid: 30000, balance: 20000 }),
          row("fa3", { status: "paid", amountDue: 10000, amountPaid: 10000, balance: 0 }),
        ]
      : undefined,
    isError: false,
  }),
}));
jest.mock("@/hooks/finance/usePaymentsQueries", () => ({
  useCreateManualPayment: () => ({ mutateAsync, isPending: false }),
}));

describe("recording a payment against ledger balances", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({ transactionId: "t1", receiptNumber: "RCP-1" });
  });

  it("shows each fee's status, blocks a paid fee, defaults to the balance and refuses an overpayment", async () => {
    const user = userEvent.setup();
    render(<ManualPaymentModal onClose={jest.fn()} />, { user: mockAdmin });

    await user.selectOptions(screen.getByLabelText("Class"), "c1");
    await user.selectOptions(screen.getByLabelText("Student"), "s1");

    const tuition = screen.getByRole("checkbox", { name: /Tuition/ });
    expect(screen.getByText(/Part paid · ₦20,000.00 left/)).toBeInTheDocument();
    expect(
      within(tuition.closest("label") as HTMLElement).getByText("Part paid")
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Uniform/ })).toBeDisabled();
    expect(screen.getByText(/Paid in full/)).toBeInTheDocument();
    expect(screen.getByText(/Unpaid · ₦15,000.00 due/)).toBeInTheDocument();
    // Product decision: recorded payments don't credit the platform wallet.
    expect(screen.getByRole("note")).toHaveTextContent(/isn't added to the Talim wallet/);

    await user.click(tuition);
    await user.click(screen.getByRole("checkbox", { name: /Bus/ }));
    const amount = screen.getByLabelText("Amount (₦)");
    expect(amount).toHaveValue(35000);
    expect(screen.getByText(/Still owed on the selected fees: ₦35,000.00/)).toBeInTheDocument();

    await user.clear(amount);
    await user.type(amount, "40000");
    expect(screen.getByText(/more than the ₦35,000.00 still owed/)).toBeInTheDocument();
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Record Payment" })).toBeDisabled();

    await user.clear(amount);
    await user.type(amount, "25000");
    expect(screen.getByText(/recorded as a part payment/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Record Payment" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: "s1",
          feeAssignmentIds: ["fa1", "fa2"],
          amount: 25000,
        })
      )
    );
    expect(mutateAsync.mock.calls[0][0].paidAt).toBeUndefined();
  });
});
