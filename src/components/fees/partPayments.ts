/**
 * Part payments (C1, C3): the pure rules the fee form, the finance settings
 * and the payment views share.
 *
 * - A fee can be paid in parts only when its `allowPartialPayment` is on.
 * - The school sets one minimum part payment (`FinanceSettings.minimumPartPayment`,
 *   naira, 0 = no minimum). Paying the whole balance is always allowed, even
 *   when it is smaller than the minimum.
 * - Balances come from the fee ledger (`GET /fees/payments/student/:id`):
 *   one row for every active fee of the child's class. A fee nobody has paid
 *   towards is filled in on read (`recorded: false`, `_id: null`), with the
 *   late fee inside `amountDue` once it applies.
 */
import type { FeeAssignment, FeeLedgerRow, FeeLedgerStatus } from "@/app/services/fees.service";
import { formatNaira } from "@/components/finance/formatters";

/** Converts naira to integer kobo, so sums never drift. */
const toKobo = (naira: number) => Math.round((Number.isFinite(naira) ? naira : 0) * 100);

/** Label per ledger status. */
export const LEDGER_STATUS_LABELS: Record<FeeLedgerStatus, string> = {
  unpaid: "Unpaid",
  part_paid: "Part paid",
  paid: "Paid",
};

/** One fee's position for one child. */
export interface FeeBalance {
  /** What is due, late fee included once the ledger applied it (naira). */
  due: number;
  /** Paid so far (naira). */
  paid: number;
  /** Still owed (naira). */
  balance: number;
  status: FeeLedgerStatus;
  /** The late fee inside `due` (0 until it applies). */
  lateFee: number;
  /** True when the API sent the figures (a stored or filled-in row), false when assumed from the fee. */
  fromLedger: boolean;
}

/**
 * The id of the fee assignment a ledger row belongs to, whether the API sent
 * the id or the populated assignment.
 *
 * @param row - A ledger row.
 * @returns The assignment id.
 */
export function ledgerAssignmentId(row: FeeLedgerRow): string {
  const ref = row.feeAssignmentId as unknown;
  if (typeof ref === "string") return ref;
  if (ref && typeof ref === "object" && "_id" in ref) return String((ref as { _id: unknown })._id);
  return "";
}

/**
 * Indexes a child's ledger rows by fee assignment, in one pass.
 *
 * @param rows - The child's ledger rows.
 * @returns Assignment id → row.
 */
export function ledgerByAssignment(
  rows: readonly FeeLedgerRow[] | undefined
): Map<string, FeeLedgerRow> {
  const map = new Map<string, FeeLedgerRow>();
  for (const row of rows ?? []) {
    const id = ledgerAssignmentId(row);
    if (id) map.set(id, row);
  }
  return map;
}

/**
 * Where one fee stands for a child: the API's row (stored, or filled in with
 * `recorded: false`), else, before the ledger loads, the fee's amount, unpaid.
 *
 * @param assignment - The class's fee assignment.
 * @param row - The child's ledger row for it, if any.
 * @returns Due, paid, balance and status, in naira.
 */
export function feeBalance(
  assignment: Pick<FeeAssignment, "amount">,
  row?: FeeLedgerRow
): FeeBalance {
  if (row) {
    const balance = Math.max(0, row.balance ?? 0);
    const status: FeeLedgerStatus =
      row.status ?? (balance <= 0 ? "paid" : (row.amountPaid ?? 0) > 0 ? "part_paid" : "unpaid");
    return {
      due: row.amountDue ?? row.amountExpected ?? assignment.amount ?? 0,
      paid: row.amountPaid ?? 0,
      balance,
      status,
      lateFee: Math.max(0, row.lateFee ?? 0),
      fromLedger: true,
    };
  }
  const due = assignment.amount ?? 0;
  return {
    due,
    paid: 0,
    balance: due,
    status: due > 0 ? "unpaid" : "paid",
    lateFee: 0,
    fromLedger: false,
  };
}

/**
 * A short line describing a fee's position, e.g. "Part paid · ₦20,000.00 left".
 *
 * @param balance - The fee's position.
 * @returns The line.
 */
export function feeBalanceSummary(balance: FeeBalance): string {
  if (balance.status === "paid") return "Paid in full";
  const late = balance.lateFee > 0 ? ` (incl. ${formatNaira(balance.lateFee)} late fee)` : "";
  if (balance.status === "part_paid") return `Part paid · ${formatNaira(balance.balance)} left${late}`;
  return `Unpaid · ${formatNaira(balance.balance)} due${late}`;
}

/**
 * What the selected fees still owe, in naira (summed in kobo).
 *
 * @param balances - The selected fees' positions.
 * @returns The total balance.
 */
export function totalOwed(balances: readonly FeeBalance[]): number {
  return balances.reduce((sum, b) => sum + toKobo(b.balance), 0) / 100;
}

/**
 * Checks an amount recorded against fees: more than zero, and no more than
 * they still owe (the API refuses an overpayment).
 *
 * @param amount - The amount typed, in naira.
 * @param owed - What the selected fees still owe, in naira.
 * @returns The message to show, or null when the amount is fine.
 */
export function manualAmountProblem(amount: number, owed: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount above zero.";
  if (toKobo(amount) > toKobo(owed)) {
    return `That is more than the ${formatNaira(owed)} still owed on the selected fees.`;
  }
  return null;
}

/** Result of {@link parseMinimumPartPayment}. */
export type MinimumPartPaymentResult =
  | { value: number; error?: undefined }
  | { value?: undefined; error: string };

/**
 * Validates the school's minimum part payment as typed in Finance settings:
 * naira, 0 or more, at most two decimals (the API's rules).
 *
 * @param input - The field's text.
 * @returns The amount, or the message to show.
 */
export function parseMinimumPartPayment(input: string): MinimumPartPaymentResult {
  const text = input.trim();
  if (text === "") return { error: "Enter an amount, or 0 for no minimum." };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return { error: "Enter naira as a number of 0 or more, with at most two decimals." };
  }
  return { value: Number(text) };
}

/** What the fee form says under "Allow Partial Payment". */
export interface PartPaymentHint {
  tone: "info" | "warning";
  text: string;
}

/**
 * The fee form's part-payment rule, worded for the admin.
 *
 * @param fee - The form's part-payment switch and amount (as typed).
 * @param fee.allowPartialPayment - Whether the fee may be paid in parts.
 * @param fee.defaultAmount - The fee's amount as typed.
 * @param minimum - The school minimum in naira, or undefined when it cannot be read.
 * @returns The hint to show.
 */
export function partPaymentHint(
  fee: { allowPartialPayment: boolean; defaultAmount: string },
  minimum: number | undefined
): PartPaymentHint {
  if (!fee.allowPartialPayment) {
    return { tone: "info", text: "Parents pay the whole fee in one payment." };
  }
  const amount = Number(fee.defaultAmount);
  const hasAmount = fee.defaultAmount.trim() !== "" && Number.isFinite(amount);
  if (minimum === undefined) {
    return {
      tone: "info",
      text: "Parents may pay this fee in parts, each at least the school's minimum part payment (Settings → Payments & Finance).",
    };
  }
  if (minimum <= 0) {
    return {
      tone: "info",
      text: "Parents may pay this fee in parts of any amount. The school has no minimum part payment.",
    };
  }
  if (hasAmount && amount > 0 && toKobo(minimum) >= toKobo(amount)) {
    return {
      tone: "warning",
      text: `The school's minimum part payment (${formatNaira(minimum)}) is not below this fee's amount, so parents will still pay it in one go.`,
    };
  }
  return {
    tone: "info",
    text: `Parents may pay this fee in parts of at least ${formatNaira(minimum)}; the last part can be smaller.`,
  };
}
