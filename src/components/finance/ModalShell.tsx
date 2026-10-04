"use client";

import { useEffect, useId, useRef } from "react";
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

/** What can take keyboard focus inside a panel. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The focusable elements inside `root`, in tab order.
 *
 * @param root - The panel.
 * @returns Its focusable descendants.
 */
function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Moves focus into a panel that just opened, unless something inside it
 * already took focus (an OTP box that autofocuses itself). The element marked
 * `data-autofocus` wins, then the first focusable element, then the panel.
 *
 * @param panel - The dialog panel.
 * @returns Nothing.
 */
export function focusIntoPanel(panel: HTMLElement): void {
  if (panel.contains(document.activeElement)) return;
  const target =
    panel.querySelector<HTMLElement>("[data-autofocus]") ?? focusableIn(panel)[0] ?? panel;
  target.focus();
}

/**
 * Keeps Tab and Shift+Tab inside the panel, wrapping at either end.
 *
 * @param event - The keydown event.
 * @param panel - The dialog panel.
 * @returns Nothing.
 */
export function trapTab(event: KeyboardEvent, panel: HTMLElement): void {
  if (event.key !== "Tab") return;
  const items = focusableIn(panel);
  if (items.length === 0) {
    event.preventDefault();
    panel.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !panel.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
    event.preventDefault();
    first.focus();
  }
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
 * panel scrolls internally instead of the page behind it. Focus moves into
 * the panel when it opens (to the element marked `data-autofocus`, else the
 * first control), Tab stays inside it, and focus returns to whatever opened
 * it when it closes.
 *
 * @param props - Title, close handler, width and body.
 * @param props.title - Heading; also the dialog's accessible name.
 * @param props.onClose - Close button, Escape and backdrop click.
 * @param props.maxWidthClass - Tailwind max-width class for the panel.
 * @param props.children - Panel body.
 * @returns The modal overlay and panel.
 */
export function ModalShell({ title, onClose, maxWidthClass = "max-w-md", children }: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => lockBodyScroll(), []);

  // Focus in on open, back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (panelRef.current) focusIntoPanel(panelRef.current);
    return () => {
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (panelRef.current) trapTab(event, panelRef.current);
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
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h3 id={titleId} className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
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
        <p className="text-sm text-gray-600 dark:text-slate-300">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40"
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
