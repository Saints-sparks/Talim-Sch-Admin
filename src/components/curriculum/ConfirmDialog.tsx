"use client";

/**
 * A destructive-action confirmation the pages can show progress in, drawn as
 * the design system's confirm sheet.
 *
 * Replaces `window.confirm`, which cannot be styled, cannot show that the
 * delete is still running, and is suppressed by some browsers.
 */
import React from "react";
import { ConfirmSheet } from "@/components/tl";

/** Props for {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  /** Whether it is shown. */
  isOpen: boolean;
  /** The question; also the dialog's accessible name. */
  title: string;
  /** What will happen. */
  message: React.ReactNode;
  /** Label for the destructive button. */
  confirmLabel?: string;
  /** Shown on the destructive button while the action runs. */
  pendingLabel?: string;
  /** True while the action runs: both buttons are disabled and it cannot be dismissed. */
  isPending?: boolean;
  /** Runs the action. */
  onConfirm: () => void;
  /** Closes without acting. */
  onCancel: () => void;
}

/**
 * Renders the dialog, or nothing when closed.
 *
 * @param props - See {@link ConfirmDialogProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.title - The question.
 * @param props.message - The explanation.
 * @param props.confirmLabel - The red button's words.
 * @param props.pendingLabel - Its words while busy.
 * @param props.isPending - Whether the action runs.
 * @param props.onConfirm - Confirm handler.
 * @param props.onCancel - Cancel handler.
 * @returns The sheet.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ConfirmSheet
      open={isOpen}
      title={title}
      body={message}
      confirmLabel={confirmLabel}
      busyLabel={pendingLabel}
      busy={isPending}
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
