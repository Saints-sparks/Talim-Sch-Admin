"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import type { TransferAbilities } from "@/app/services/transit.service";
import type { TransferAction } from "@/hooks/transit/useTransfers";
import { surface, text } from "@/components/transit/ui";

/** What the action panel needs to render one transfer's next steps. */
export interface TransferActionsProps {
  /** Which side this school is on, and what it may do right now. */
  abilities: TransferAbilities;
  /** The action currently in flight, or `null`. */
  pending: TransferAction["type"] | null;
  /** Runs a transition; the page owns the mutation and the toasts. */
  onAction: (action: TransferAction) => void;
}

/** A confirm button with a reason box, for rejecting and cancelling. */
function ReasonAction({
  label,
  confirmLabel,
  placeholder,
  tone,
  pending,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  placeholder: string;
  tone: "rose" | "slate";
  pending: boolean;
  disabled: boolean;
  onConfirm: (reason?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const tones = {
    rose: {
      trigger: "bg-tl-danger-bg text-tl-danger border border-tl-danger/30 hover:bg-tl-danger-bg",
      confirm: "bg-tl-danger hover:opacity-90",
    },
    slate: {
      trigger: "bg-tl-subtle text-tl-muted border border-tl-line hover:bg-tl-bg",
      confirm: "bg-tl-brand-fill hover:bg-tl-brand-fill-hover",
    },
  } as const;

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
          tones[tone].trigger
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="w-full flex flex-wrap gap-2 items-center">
      <input
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className={cn("flex-1 min-w-[12rem] px-3 py-2 text-sm rounded-lg", surface.input)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onConfirm(reason.trim() || undefined)}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50",
          tones[tone].confirm
        )}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className={cn("px-3 py-2 text-sm transition-colors hover:underline", text.muted)}
      >
        Back
      </button>
    </div>
  );
}

/**
 * The actions this school may take on a transfer right now.
 *
 * Shows nothing at all once the transfer is terminal, and nothing but the
 * waiting note when it is the other school's move. Every button is behind
 * `manage:transit`: an admin without it sees the transfer, never the controls.
 */
export function TransferActions({ abilities, pending, onAction }: TransferActionsProps) {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_TRANSIT);

  const {
    isTerminal,
    isTarget,
    canSourceApprove,
    canTargetApprove,
    canAccept,
    canReject,
    canCancel,
    waitingOnOtherSchool,
  } = abilities;

  if (isTerminal) return null;

  const busy = pending !== null;
  // What the state machine allows this school, before permissions are applied —
  // so an admin who lacks `manage:transit` is told why the panel is empty
  // rather than being shown nothing at all.
  const sideHasAction = canSourceApprove || canTargetApprove || canAccept || canReject || canCancel;

  if (!sideHasAction && !waitingOnOtherSchool) return null;

  return (
    <section className={cn("rounded-[22px] p-5", surface.card)}>
      <h2 className={cn("text-sm font-semibold mb-4", text.strong)}>Actions</h2>

      <div className="flex flex-wrap gap-3">
        {waitingOnOtherSchool && (
          <p className={cn("w-full text-sm", text.muted)}>
            {isTarget
              ? "Waiting for the current school to release this student."
              : "Released. Waiting for the receiving school to approve."}
          </p>
        )}

        {!canManage && sideHasAction && (
          <p className={cn("w-full text-sm", text.muted)}>
            You can view this transfer, but acting on it needs the Transit permission.
          </p>
        )}

        {canManage && canSourceApprove && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction({ type: "source-approve" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-tl-brand-fill hover:bg-tl-brand-fill-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending === "source-approve" && <Loader2 className="w-4 h-4 animate-spin" />}
            Approve (Source School)
          </button>
        )}

        {canManage && canTargetApprove && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction({ type: "target-approve" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-tl-accent hover:opacity-90 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending === "target-approve" && <Loader2 className="w-4 h-4 animate-spin" />}
            Approve (Target School)
          </button>
        )}

        {canManage && canAccept && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction({ type: "accept" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-tl-success hover:opacity-90 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending === "accept" && <Loader2 className="w-4 h-4 animate-spin" />}
            Accept Transfer
          </button>
        )}

        {canManage && canReject && (
          <ReasonAction
            label="Reject"
            confirmLabel="Confirm Reject"
            placeholder="Reason for rejection (optional)"
            tone="rose"
            pending={pending === "reject"}
            disabled={busy}
            onConfirm={(reason) => onAction({ type: "reject", reason })}
          />
        )}

        {canManage && canCancel && (
          <ReasonAction
            label="Cancel Transfer"
            confirmLabel="Confirm Cancel"
            placeholder="Reason for cancellation (optional)"
            tone="slate"
            pending={pending === "cancel"}
            disabled={busy}
            onConfirm={(reason) => onAction({ type: "cancel", reason })}
          />
        )}
      </div>
    </section>
  );
}
