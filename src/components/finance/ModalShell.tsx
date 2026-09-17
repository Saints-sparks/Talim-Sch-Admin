"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Locks page scroll while a modal is open and gives it back on unmount.
 *
 * The finance modals stack (withdraw → OTP → confirm → success), so the lock is
 * reference counted: the page only scrolls again once the last one closes,
 * and the original `overflow` is restored rather than being forced to "auto".
 */
let lockCount = 0;
let restoreOverflow = "";

function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => undefined;
  if (lockCount === 0) {
    restoreOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.body.style.overflow = restoreOverflow;
  };
}

interface ModalShellProps {
  /** Heading shown in the modal's header; omit for a headerless panel. */
  title?: string;
  /** Called on the close button, the Escape key and a click on the backdrop. */
  onClose: () => void;
  /** Tailwind max-width class for the panel. */
  maxWidthClass?: string;
  /** Panel body. */
  children: React.ReactNode;
}

/**
 * The one modal frame the finance and payments areas use.
 *
 * Handles what every modal has to get right and each hand-rolled one got a
 * little differently: body-scroll lock, Escape to close, a backdrop click that
 * ignores clicks inside the panel, and its own scroll container so a long
 * panel scrolls internally instead of the page behind it.
 *
 * @param props - Title, close handler, width and body.
 * @returns The modal overlay and panel.
 */
export function ModalShell({ title, onClose, maxWidthClass = "max-w-md", children }: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => lockBodyScroll(), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={(event) => {
        if (!panelRef.current?.contains(event.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  /** Label for the confirming button. */
  confirmLabel?: string;
  /** True while the confirmed action is in flight. */
  busy?: boolean;
  /** Styles the confirming button as destructive. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A confirmation step for a destructive action, replacing `window.confirm`
 * (which is unstyled, unthemeable and blocks the whole tab).
 *
 * @param props - Copy, busy flag and the two handlers.
 * @returns The confirmation modal.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ModalShell title={title} onClose={busy ? () => undefined : onCancel} maxWidthClass="max-w-sm">
      <div className="p-6 space-y-5">
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 ${
              destructive ? "bg-red-500 hover:bg-red-600" : "bg-[#003366] hover:bg-[#003366]/90"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
