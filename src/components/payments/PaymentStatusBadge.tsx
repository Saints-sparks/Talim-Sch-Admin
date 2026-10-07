"use client";

import { Pill, type Tone } from "@/components/tl";

/** Tone per payment, receipt and provider state (paid green, part amber, pending blue, failed red). */
const STATUS_TONES: Record<string, Tone> = {
  successful: "success",
  pending: "info",
  failed: "danger",
  cancelled: "muted",
  refunded: "accent",
  partial: "warning",
  issued: "success",
  voided: "danger",
  active: "success",
  inactive: "muted",
};

/**
 * The state of a payment, a receipt or a provider.
 *
 * @param props - The value to colour, lowercase as the API returns it.
 * @param props.status - The value.
 * @returns A status pill.
 */
export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Pill tone={STATUS_TONES[status] ?? "muted"} className="capitalize">
      {status}
    </Pill>
  );
}
