"use client";

import React from "react";
import { ConfirmSheet } from "@/components/tl";

/** Props for {@link DeleteConfirmModal}. */
type DeleteConfirmModalProps = {
  /** Whether it is shown. */
  isOpen: boolean;
  /** Closes without deleting. */
  onClose: () => void;
  /** Deletes. */
  onConfirm: () => void;
  /** What will be deleted, in a sentence. */
  message: string;
};

/**
 * A plain delete confirmation in the design system's confirm sheet: the
 * message, Cancel and a red Delete.
 *
 * @param props - See {@link DeleteConfirmModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Cancel handler.
 * @param props.onConfirm - Delete handler.
 * @param props.message - The sentence.
 * @returns The sheet, or null while closed.
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
}) => {
  return (
    <ConfirmSheet
      open={isOpen}
      title="Delete this item?"
      body={message}
      confirmLabel="Delete"
      danger
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
};

export default DeleteConfirmModal;
