/**
 * Formatting and reference helpers shared by every fees screen.
 *
 * The fees API returns references (category, class, term) either as a bare id
 * or as a populated object depending on the endpoint, so reading a name off
 * one used to mean an `as any` at each call site. These helpers do it once,
 * typed.
 */
import type { Ref } from "@/app/services/fees.service";

/**
 * Formats an amount in naira the way the fees screens show money.
 *
 * @param amount - Amount in naira.
 * @returns e.g. `NGN 15,000`.
 */
export function formatNaira(amount: number): string {
  return `NGN ${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

/**
 * Formats a date for a table cell or summary row.
 *
 * @param value - An ISO date string, or nothing.
 * @param fallback - What to show when there is no date. Defaults to `—`.
 * @returns e.g. `01 Sep 2026`.
 */
export function formatDate(value?: string | null, fallback = "—"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Converts an ISO timestamp to the `yyyy-mm-dd` a date input expects.
 *
 * @param value - An ISO date string, or nothing.
 * @returns The date part, or `""` when there is no usable date.
 */
export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

/**
 * The id behind an API reference, whether the endpoint populated it or not.
 *
 * @param ref - A reference field such as `feeItem.categoryId`.
 * @returns The id, or `""` when the field is absent.
 */
export function refId(ref: Ref<{ _id: string }> | undefined | null): string {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
}

/**
 * The display name behind a populated API reference.
 *
 * @param ref - A reference field such as `assignment.classId`.
 * @param fallback - What to show when the reference is only an id. Defaults to `—`.
 * @returns The name, or the fallback.
 */
export function refName(
  ref: Ref<{ _id: string; name?: string }> | undefined | null,
  fallback = "—"
): string {
  if (!ref || typeof ref === "string") return fallback;
  return ref.name || fallback;
}

/**
 * Turns a fee type enum into its label, e.g. `one_time` → `one time`.
 *
 * @param feeType - The backend enum value.
 * @returns A human-readable label; render it with `capitalize`.
 */
export function feeTypeLabel(feeType: string): string {
  return feeType.replace(/_/g, " ");
}

/**
 * Sums the capacities of the given classes — the "students affected" figure
 * the create and assign screens show.
 *
 * @param classes - Classes with an optional capacity.
 * @returns The total, treating a missing capacity as 0.
 */
export function totalCapacity(classes: Array<{ classCapacity?: string | number }>): number {
  return classes.reduce((sum, cls) => sum + (Number(cls.classCapacity) || 0), 0);
}
