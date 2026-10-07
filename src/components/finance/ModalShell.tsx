"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { dangerButton, eyebrow, focusRing, ghostButton, primaryButton } from "@/components/tl";

/**
 * Locks page scroll while a modal is open and gives it back on unmount.
 *
 * The finance modals stack (withdraw → OTP → confirm → success), so the lock is
 * reference counted: the page only scrolls again once the last one closes,
 * and the original `overflow` is restored rather than being forced to "auto".
 */
let lockCount = 0;
let restoreOverflow = "";

/**
 * Takes one reference on the page-scroll lock.
 *
 * @returns Gives the reference back.
 */
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

/** Open panels, oldest first: only the newest one keeps Tab inside it. */
const openPanels: HTMLElement[] = [];

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

/** Props for {@link ModalShell}. */
interface ModalShellProps {
  /** Heading shown in the modal's header; omit for a headerless panel. */
  title?: string;
  /** A small uppercase line above the title ("Step 1 of 4"). */
  eyebrowText?: string;
  /** Called on the close button, the Escape key and a click on the backdrop. */
  onClose: () => void;
  /** Tailwind max-width class for the panel. */
  maxWidthClass?: string;
  /** Panel body. */
  children: React.ReactNode;
}

/**
 * The one modal frame the finance and payments areas use, in the design
 * system's sheet look: a bottom sheet on phones and a centred card with a
 * 24px radius on wider screens.
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
 * @param props.eyebrowText - The small line above the title.
 * @param props.onClose - Close button, Escape and backdrop click.
 * @param props.maxWidthClass - Tailwind max-width class for the panel.
 * @param props.children - Panel body.
 * @returns The modal overlay and panel.
 */
export function ModalShell({
  title,
  eyebrowText,
  onClose,
  maxWidthClass = "max-w-md",
  children,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => lockBodyScroll(), []);

  // Focus in on open, back to the opener on close.
  useEffect(() => {
    const panel = panelRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (panel) {
      openPanels.push(panel);
      focusIntoPanel(panel);
    }
    return () => {
      const at = panel ? openPanels.lastIndexOf(panel) : -1;
      if (at !== -1) openPanels.splice(at, 1);
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // With modals stacked, only the newest one traps Tab.
      else if (panelRef.current && openPanels[openPanels.length - 1] === panelRef.current) {
        trapTab(event, panelRef.current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,27,46,0.45)] sm:items-center sm:p-5"
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
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-tl-line bg-tl-surface text-tl-ink shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] focus:outline-none sm:max-h-[90vh] sm:rounded-[24px] ${maxWidthClass}`}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-tl-line-soft bg-tl-surface px-[clamp(20px,3vw,28px)] pb-4 pt-[clamp(18px,3vw,24px)]">
            <div className="min-w-0">
              {eyebrowText ? <p className={eyebrow}>{eyebrowText}</p> : null}
              <h3
                id={titleId}
                className="mt-1 text-[21px] font-extrabold leading-tight tracking-[-0.4px] text-tl-ink"
              >
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tl-faint hover:bg-tl-bg hover:text-tl-ink ${focusRing}`}
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Props for {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  /** The question; also the dialog's name. */
  title: string;
  /** What happens if the admin confirms. */
  message: string;
  /** Label for the confirming button. */
  confirmLabel?: string;
  /** True while the confirmed action is in flight. */
  busy?: boolean;
  /** Styles the confirming button as destructive. */
  destructive?: boolean;
  /** Runs the action. */
  onConfirm: () => void;
  /** Closes without acting. */
  onCancel: () => void;
}

/**
 * A confirmation step for a destructive action, replacing `window.confirm`
 * (which is unstyled, unthemeable and blocks the whole tab).
 *
 * @param props - Copy, busy flag and the two handlers.
 * @param props.title - The question.
 * @param props.message - The explanation.
 * @param props.confirmLabel - The confirm button's words.
 * @param props.busy - Whether the action runs.
 * @param props.destructive - Whether it is destructive.
 * @param props.onConfirm - Runs it.
 * @param props.onCancel - Closes it.
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
    <ModalShell title={title} onClose={busy ? () => undefined : onCancel} maxWidthClass="max-w-md">
      <div className="flex flex-col gap-5 px-[clamp(20px,3vw,28px)] py-5">
        <p className="text-sm leading-[1.7] text-tl-body">{message}</p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`${ghostButton} flex-1`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`${destructive ? dangerButton : primaryButton} flex-1`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
