"use client";

import React, { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { eyebrow, focusRing } from "./styles";

/** Elements that can take keyboard focus inside a sheet. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Width presets: the portals' 560px sheet, or a wider one for forms and tables. */
const WIDTH = { md: "sm:max-w-[560px]", lg: "sm:max-w-[760px]", xl: "sm:max-w-[960px]" } as const;

/** Props for {@link Sheet}. */
export interface SheetProps {
  /** Whether the sheet is shown. */
  open: boolean;
  /** Called with `false` by Escape, the close button and the overlay. */
  onOpenChange: (open: boolean) => void;
  /** Small uppercase line above the title. */
  eyebrowText?: ReactNode;
  /** The heading; also the dialog's accessible name. */
  title: ReactNode;
  /** One or two lines under the title; also the dialog's accessible description. */
  subtitle?: ReactNode;
  /** The body. */
  children?: ReactNode;
  /** Buttons along the bottom. */
  footer?: ReactNode;
  /** `md` (560px, default), `lg` (760px) or `xl` (960px) on wider screens. */
  size?: keyof typeof WIDTH;
  /** False while a save runs: Escape, the overlay and the close button do nothing. */
  dismissible?: boolean;
  /** The accessible name when `title` is not plain text. */
  ariaLabel?: string;
}

/**
 * Moves keyboard focus into the sheet when it opens, keeps Tab inside it, and
 * returns focus to whatever had it when the sheet closes.
 *
 * @param open - Whether the sheet is shown.
 * @param panel - The sheet's panel element.
 */
function useFocusTrap(open: boolean, panel: React.RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const first =
      node?.querySelector<HTMLElement>("[data-autofocus]") ??
      node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const head = items[0];
      const tail = items[items.length - 1];
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [open, panel]);
}

/**
 * The design system's sheet: a centred dialog on wider screens and a bottom
 * sheet on phones (the portals' `Sheet`). It is a real modal dialog: named by
 * its title, described by its subtitle, with focus moved in and trapped,
 * Escape and the overlay to close, focus returned on close, and the page
 * behind it frozen.
 *
 * @param props - See {@link SheetProps}.
 * @param props.open - Whether it is shown.
 * @param props.onOpenChange - Close handler.
 * @param props.eyebrowText - Line above the title.
 * @param props.title - The heading.
 * @param props.subtitle - The line under it.
 * @param props.children - The body.
 * @param props.footer - The buttons.
 * @param props.size - The width preset.
 * @param props.dismissible - Whether it may be closed now.
 * @param props.ariaLabel - A plain-text name when the title is not text.
 * @returns The dialog in a portal, or null while closed.
 */
export function Sheet({
  open,
  onOpenChange,
  eyebrowText,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  dismissible = true,
  ariaLabel,
}: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open);
  useFocusTrap(open, panel);

  const close = useCallback(() => {
    if (dismissible) onOpenChange(false);
  }, [dismissible, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] print:hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[rgba(15,27,46,0.45)]"
        onClick={close}
        data-testid="sheet-overlay"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        aria-describedby={subtitle ? descriptionId : undefined}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[24px] bg-tl-surface p-[clamp(22px,3vw,30px)] pb-[max(22px,env(safe-area-inset-bottom))] text-tl-ink shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] focus:outline-none sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-40px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] dark:border dark:border-tl-line ${WIDTH[size]}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrowText ? <div className={eyebrow}>{eyebrowText}</div> : null}
            <h2
              id={titleId}
              className="mt-1.5 text-[21px] font-extrabold leading-tight tracking-[-0.4px] text-tl-ink"
            >
              {title}
            </h2>
            {subtitle ? (
              <div id={descriptionId} className="mt-1 text-[13px] leading-[1.55] text-tl-muted">
                {subtitle}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            disabled={!dismissible}
            className={`-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tl-faint hover:bg-tl-bg hover:text-tl-ink disabled:opacity-40 ${focusRing}`}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children ? <div className="mt-[18px] flex flex-col gap-[18px]">{children}</div> : null}
        {footer ? <div className="mt-[22px] flex flex-wrap gap-2.5">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

/** Props for {@link SheetRow}. */
export interface SheetRowProps {
  /** The bold line. */
  label: ReactNode;
  /** The grey line under it. */
  description?: ReactNode;
  /** The action control (a button or link styled with `rowButton`). */
  action: ReactNode;
}

/**
 * A bordered row with a label, a description and one action (the design's
 * `sheet.rows`).
 *
 * @param props - See {@link SheetRowProps}.
 * @param props.label - The bold line.
 * @param props.description - The grey line.
 * @param props.action - The control.
 * @returns The row.
 */
export function SheetRow({ label, description, action }: SheetRowProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-tl-line-soft px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-tl-ink">{label}</div>
        {description ? (
          <div className="mt-[3px] break-words text-[13px] text-tl-muted">{description}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
