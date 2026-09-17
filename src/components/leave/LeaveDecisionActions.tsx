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
 * Renders the approve and reject buttons.
 *
 * @param props - Decision handlers, the in-flight flag and the layout variant.
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
      <div className={cn("flex gap-2", isCard ? "mt-4 border-t border-slate-100 dark:border-slate-700 pt-3" : "justify-end gap-4")}>
        <Tooltip
          content="Marks the leave as approved. The parent and class teacher are notified automatically."
          side="top"
        >
          <button
            type="button"
            disabled={isPending}
            onClick={onApprove}
            className={cn(
              "rounded-lg bg-[#003366] font-medium text-white transition-colors hover:bg-[#002244] disabled:cursor-not-allowed disabled:opacity-60",
              isCard ? "flex-1 px-3 py-2 text-sm" : "px-6 py-2 text-sm"
            )}
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
            className={cn(
              "rounded-lg border border-red-300 bg-white font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20",
              isCard ? "flex-1 px-3 py-2 text-sm" : "px-6 py-2 text-sm"
            )}
          >
            {isPending ? "Saving..." : "Reject"}
          </button>
        </Tooltip>
      </div>
    </PermissionGate>
  );
}
