"use client";

import { ConfirmSheet } from "@/components/tl";

/** Props for {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  /** Whether it is shown. */
  open: boolean;
  /** The question ("Leave group?"); also the dialog's name. */
  title: string;
  /** What happens. */
  message: string;
  /** The red confirm button's words. */
  confirmLabel: string;
  /** True while the action runs: both buttons are disabled and it cannot be dismissed. */
  busy?: boolean;
  /** Runs the action. */
  onConfirm: () => void;
  /** Closes without acting (Cancel, Escape, the close button, the backdrop). */
  onCancel: () => void;
}

/**
 * A destructive-action confirmation shown above the chat dialogs (leave a
 * group, remove a member): the design system's confirm sheet with a red
 * confirm.
 *
 * @param props - See {@link ConfirmDialogProps}.
 * @param props.open - Whether it is shown.
 * @param props.title - The question.
 * @param props.message - What happens.
 * @param props.confirmLabel - The confirm button's words.
 * @param props.busy - Whether the action runs.
 * @param props.onConfirm - Confirm handler.
 * @param props.onCancel - Cancel handler.
 * @returns The sheet, or null while closed.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ConfirmSheet
      open={open}
      title={title}
      body={message}
      confirmLabel={confirmLabel}
      busy={busy}
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
