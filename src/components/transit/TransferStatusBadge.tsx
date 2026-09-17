"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { TransferStatus } from "@/app/services/transit.service";
import {
  TRANSFER_STATUS_COLORS,
  TRANSFER_STATUS_LABELS,
} from "@/components/transit/transferStatus";

/** The coloured pill naming a transfer's status. */
export function TransferStatusBadge({
  status,
  size = "sm",
}: {
  status: TransferStatus;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border font-medium whitespace-nowrap",
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
        TRANSFER_STATUS_COLORS[status]
      )}
    >
      {TRANSFER_STATUS_LABELS[status]}
    </span>
  );
}
