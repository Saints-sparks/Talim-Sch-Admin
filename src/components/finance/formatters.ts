/**
 * Money and date formatting shared by the finance and payments areas.
 *
 * One copy of each: the two pages previously carried their own `NGN` and
 * `fmtDate`, which is exactly how two screens end up disagreeing about what a
 * balance looks like.
 */

/**
 * Formats an amount as naira with two decimals.
 *
 * @param amount - Amount in naira; nullish and NaN render as ₦0.00.
 * @returns The formatted amount, e.g. `₦1,250,000.00`.
 */
export function formatNaira(amount: number | null | undefined): string {
  const value = Number(amount);
  return `₦${(Number.isFinite(value) ? value : 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats an ISO timestamp as a short date.
 *
 * @param iso - ISO timestamp; nullish or unparseable renders as an em dash.
 * @returns The formatted date, e.g. `04 Mar 2026`.
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Formats an ISO timestamp as a date and time.
 *
 * @param iso - ISO timestamp; nullish or unparseable renders as an em dash.
 * @returns The formatted date and time, e.g. `04 Mar 2026, 14:30`.
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/**
 * Spells a whole number out in English.
 *
 * @param value - Non-negative integer below one billion.
 * @returns The number in words, without a currency suffix.
 */
function spell(value: number): string {
  if (value === 0) return "";
  if (value < 20) return ONES[value];
  if (value < 100) return TENS[Math.floor(value / 10)] + (value % 10 ? ` ${ONES[value % 10]}` : "");
  if (value < 1_000)
    return `${ONES[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${spell(value % 100)}` : ""}`;
  if (value < 1_000_000)
    return `${spell(Math.floor(value / 1_000))} Thousand${value % 1_000 ? ` ${spell(value % 1_000)}` : ""}`;
  return `${spell(Math.floor(value / 1_000_000))} Million${
    value % 1_000_000 ? ` ${spell(value % 1_000_000)}` : ""
  }`;
}

/**
 * Spells an amount out in naira, the way it reads on a cheque. Shown under the
 * withdrawal amount so a mistyped extra zero is obvious before the OTP is sent.
 *
 * @param amount - Amount in naira; zero or less returns an empty string.
 * @returns The amount in words, e.g. `Fifty Thousand Naira Only`.
 */
export function amountInWords(amount: number): string {
  if (!amount || amount <= 0) return "";
  return `${spell(Math.round(amount))} Naira Only`;
}

/**
 * Masks an account number down to its last four digits.
 *
 * @param accountNumber - Full account number.
 * @returns The masked number, e.g. `****4321`.
 */
export function maskAccountNumber(accountNumber: string): string {
  return `****${(accountNumber ?? "").slice(-4)}`;
}
