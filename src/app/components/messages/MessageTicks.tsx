"use client";

import { Check, CheckCheck } from "lucide-react";
import type { DeliveryState } from "@/lib/chat/readReceipts";

/** One tick once stored, two blue ticks once read. Pending / failed are shown by MessageDeliveryStatus. */
export default function MessageTicks({ state }: { state?: DeliveryState }) {
  if (state === "read") {
    return <CheckCheck size={14} className="text-blue-500" aria-label="Read" />;
  }
  if (state === "sent") {
    return <Check size={14} className="text-gray-400" aria-label="Sent" />;
  }
  return null;
}
