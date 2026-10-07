"use client";

/**
 * The Approve / Reject pair.
 *
 * Deciding a leave request notifies the parent and the class teacher, so it is
 * gated on MANAGE_LEAVE_REQUESTS here rather than at each call site — a
 * reviewer who cannot action the queue is shown a read-only card instead of a
 * button the API would refuse.
 */
import React from "react";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { dangerGhostButton, primaryButton } from "@/components/tl/styles";

interface LeaveDecisionActionsProps {
  onApprove: () => void;
  onReject: () => void;
  /** True while a decision is in flight; both buttons are disabled. */
  isPending: boolean;
  /** `card` is the compact pair on a queue card, `detail` the wider one. */
  variant?: "card" | "detail";
  /** Shown in place of the buttons when the reviewer lacks the permission. */
  fallback?: React.ReactNode;
}

/**
 * Renders the approve and reject buttons (navy Approve, red outlined Reject).
 *
 * @param props - Decision handlers, the in-flight flag and the layout variant.
 * @param props.onApprove - Approves.
 * @param props.onReject - Rejects.
 * @param props.isPending - Whether a decision is in flight.
 * @param props.variant - Card or detail layout.
 * @param props.fallback - Shown without the permission.
 * @returns The buttons.
 */
export function LeaveDecisionActions({
  onApprove,
  onReject,
  isPending,
  variant = "card",
  fallback = null,
}: LeaveDecisionActionsProps) {
  const isCard = variant === "card";

  return (
    <PermissionGate permission={Permission.MANAGE_LEAVE_REQUESTS} fallback={fallback}>
      <div
        className={cn(
          "flex gap-2.5",
          isCard ? "border-t border-tl-line-soft pt-3.5" : "flex-wrap justify-end"
        )}
      >
        <Tooltip
          content="Marks the leave as approved. The parent and class teacher are notified automatically."
          side="top"
        >
          <button
            type="button"
            disabled={isPending}
            onClick={onApprove}
            className={cn(primaryButton, isCard && "flex-1")}
          >
            {isPending ? "Saving..." : "Approve"}
          </button>
        </Tooltip>
        <Tooltip
          content="Marks the leave as rejected. The parent and class teacher are notified automatically."
          side="top"
        >
          <button
            type="button"
            disabled={isPending}
            onClick={onReject}
            className={cn(dangerGhostButton, "rounded-[14px] text-sm", isCard && "flex-1")}
          >
            {isPending ? "Saving..." : "Reject"}
          </button>
        </Tooltip>
      </div>
    </PermissionGate>
  );
}
