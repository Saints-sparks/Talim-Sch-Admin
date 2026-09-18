"use client";

/**
 * A destructive-action confirmation the pages can show progress in.
 *
 * Replaces `window.confirm`, which cannot be styled, cannot show that the
 * delete is still running, and is suppressed by some browsers.
 */
import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  /** Label for the destructive button. */
  confirmLabel?: string;
  /** Shown on the destructive button while the action runs. */
  pendingLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Renders the dialog, or nothing when closed.
 *
 * @param props - See {@link ConfirmDialogProps}.
 * @returns The dialog.
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
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
              <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h3>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-5 mb-8 text-gray-700 dark:text-slate-200 text-sm">
            {message}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-6 py-3 text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="px-8 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {pendingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
