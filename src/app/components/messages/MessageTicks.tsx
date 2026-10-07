"use client";

import { Check, CheckCheck } from "lucide-react";
import type { DeliveryState } from "@/lib/chat/readReceipts";

/**
 * One tick once stored, two link-blue ticks once read. Pending / failed are
 * shown by MessageDeliveryStatus.
 *
 * @param props - The delivery state.
 * @param props.state - "sent", "read", or nothing yet.
 * @returns The ticks, or null.
 */
export default function MessageTicks({ state }: { state?: DeliveryState }) {
  if (state === "read") {
    return <CheckCheck size={14} className="text-tl-link" aria-label="Read" />;
  }
  if (state === "sent") {
    return <Check size={14} className="text-tl-faint" aria-label="Sent" />;
  }
  return null;
}
