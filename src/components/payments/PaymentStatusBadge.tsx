"use client";

/** Palette per payment, receipt and provider state. */
const STATUS_STYLES: Record<string, string> = {
  successful: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-orange-100 text-orange-600",
  partial: "bg-blue-100 text-blue-700",
  issued: "bg-green-100 text-green-700",
  voided: "bg-red-100 text-red-600",
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

/**
 * The state of a payment, a receipt or a provider.
 *
 * @param props - The value to colour, lowercase as the API returns it.
 * @returns A status pill.
 */
export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500 dark:text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
