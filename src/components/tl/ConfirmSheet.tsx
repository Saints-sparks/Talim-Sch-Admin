"use client";

import React, { type ReactNode } from "react";
import { Sheet } from "./Sheet";
import { dangerButton, ghostButton, primaryButton } from "./styles";

/** Props for {@link ConfirmSheet}. */
export interface ConfirmSheetProps {
  /** Whether it is shown. */
  open: boolean;
  /** Closes without confirming (Cancel, Escape, the close button, the overlay). */
  onCancel: () => void;
  /** Runs the action. */
  onConfirm: () => void;
  /** Small line above the title. */
  eyebrowText?: ReactNode;
  /** The question ("Delete event?"); also the dialog's name. */
  title: ReactNode;
  /** The one paragraph that explains what happens. */
  body: ReactNode;
  /** The confirm button's words. */
  confirmLabel: string;
  /** Shown on the confirm button while `busy`. */
  busyLabel?: string;
  /** True while the action runs: both buttons are disabled and the sheet cannot be dismissed. */
  busy?: boolean;
  /** The red confirm of a destructive action. */
  danger?: boolean;
  /** Holds the confirm button until the content is complete (a password typed, a box ticked). */
  confirmDisabled?: boolean;
  /** Cancel's words; default "Cancel". */
  cancelLabel?: string;
  /** Extra content under the paragraph (an optional reason field). */
  children?: ReactNode;
}

/**
 * A confirmation sheet: one paragraph, Cancel and the action (the portals'
 * publish, unlock and remove sheets).
 *
 * @param props - See {@link ConfirmSheetProps}.
 * @param props.open - Whether it is shown.
 * @param props.onCancel - Cancel handler.
 * @param props.onConfirm - Confirm handler.
 * @param props.eyebrowText - Line above the title.
 * @param props.title - The question.
 * @param props.body - The explanation.
 * @param props.confirmLabel - Confirm button text.
 * @param props.busyLabel - Confirm button text while busy.
 * @param props.busy - Whether the action is running.
 * @param props.danger - Whether the action is destructive.
 * @param props.confirmDisabled - Whether the confirm button waits for the content.
 * @param props.cancelLabel - Cancel button text.
 * @param props.children - Extra content.
 * @returns The sheet.
 */
export function ConfirmSheet({
  open,
  onCancel,
  onConfirm,
  eyebrowText,
  title,
  body,
  confirmLabel,
  busyLabel,
  busy = false,
  danger = false,
  confirmDisabled = false,
  cancelLabel = "Cancel",
  children,
}: ConfirmSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onCancel()}
      dismissible={!busy}
      eyebrowText={eyebrowText}
      title={title}
      footer={
        <>
          <button
            type="button"
            className={`${ghostButton} min-h-[48px] flex-1`}
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${danger ? dangerButton : primaryButton} min-h-[48px] flex-1`}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-[1.7] text-tl-body">{body}</div>
      {children}
    </Sheet>
  );
}
