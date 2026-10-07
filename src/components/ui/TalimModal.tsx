"use client";

import React, { useEffect, useId } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { X } from "lucide-react";

interface TalimModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isSubmitting?: boolean;
}

/**
 * The app's large form dialog (create class, add teacher, …) in the portals'
 * sheet look: a bottom sheet on phones and a centred card on wider screens,
 * with the title, an optional icon and subtitle, a scrolling body and a
 * footer. Escape and the close button close it (not while a save runs); the
 * page behind it is frozen.
 *
 * @param props - See `TalimModalProps`.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.title - The heading; also the dialog's name.
 * @param props.subtitle - The line under the title.
 * @param props.icon - An icon beside the title.
 * @param props.children - The body.
 * @param props.footer - The buttons.
 * @param props.isSubmitting - True while a save runs.
 * @returns The dialog, or null while closed.
 */
const TalimModal: React.FC<TalimModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  isSubmitting = false,
}) => {
  // The modal owns the lock, so no caller has to remember it.
  useBodyScrollLock(isOpen);
  const titleId = useId();

  // Escape closes it, as the close button does (not while a save is running).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,27,46,0.45)] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] bg-tl-surface text-tl-ink shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] sm:mx-4 sm:max-h-[90vh] sm:rounded-[24px] dark:border dark:border-tl-line"
      >
        {/* Header: the portals' sheet heading */}
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-tl-line-soft px-[clamp(20px,3vw,30px)] py-5">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tl-select text-tl-brand [&_svg]:text-tl-brand">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-[21px] font-extrabold leading-tight tracking-[-0.4px] text-tl-ink"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[13px] leading-[1.55] text-tl-muted">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tl-faint transition-colors hover:bg-tl-bg hover:text-tl-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-[clamp(20px,3vw,30px)] py-6">
            <div className="space-y-6">{children}</div>
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-tl-line-soft bg-tl-subtle px-[clamp(20px,3vw,30px)] py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default TalimModal;
