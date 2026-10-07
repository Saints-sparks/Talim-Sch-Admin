"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControl, fieldLabel, ghostButton, iconButton } from "@/components/tl/styles";
import { useBodyScrollLock } from "@/hooks/transit/useTransitUi";

/**
 * Shared surface classes for the transit pages, so a card, a table and a modal
 * agree on their background, border and text colours in both themes.
 */
export const surface = {
  /** A raised panel: cards, tables, modals. */
  card: "bg-tl-surface border border-tl-line shadow-[0_1px_2px_rgba(15,27,46,0.04),0_14px_30px_-22px_rgba(15,27,46,0.18)] dark:shadow-none",
  /** The row of headings above a table. */
  tableHead: "bg-tl-subtle",
  /** A divider between rows. */
  divide: "divide-tl-line-soft",
  /** A quiet inset block. */
  inset: "bg-tl-subtle border border-tl-line-soft",
  /** A form control. */
  input: fieldControl,
} as const;

/** Shared text colours, so headings and captions stay legible in the dark theme. */
export const text = {
  /** A heading or a value the eye should land on. */
  strong: "text-tl-ink",
  /** Body copy. */
  body: "text-tl-body",
  /** A label or caption. */
  muted: "text-tl-muted",
  /** The brand colour, lightened for the dark theme. */
  brand: "text-tl-brand",
} as const;

/** One label / value line inside a detail card. */
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2.5 border-b border-tl-line-soft last:border-0">
      <span className={cn("text-sm", text.muted)}>{label}</span>
      <span className={cn("text-sm font-medium text-right max-w-[60%]", text.strong)}>{value}</span>
    </div>
  );
}

/** A titled card with an icon, used for every detail panel on the transit pages. */
export function DetailCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[22px] p-[clamp(18px,2.4vw,24px)]", surface.card)}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("w-4 h-4", text.brand)} />
        <h2 className={cn("text-[15px] font-extrabold", text.strong)}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** Grey blocks standing in for rows while a list loads. */
export function SkeletonRows({ count = 5, height = "h-16" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn("rounded-[18px] animate-pulse bg-tl-line/70", height)} />
      ))}
    </div>
  );
}

/**
 * A centred modal that locks page scrolling while it is open, restores it on
 * close, and scrolls its own body when the content is taller than the screen.
 */
export function TransitModal({
  title,
  onClose,
  children,
  footer,
  width = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,27,46,0.45)] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col rounded-t-[24px] shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] sm:rounded-[24px]",
          surface.card,
          width
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-tl-line-soft">
          <h2 className={cn("text-[21px] font-extrabold tracking-[-0.4px]", text.strong)}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className={iconButton}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-tl-line-soft">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** A labelled `<select>`, themed once so every transit filter matches. */
export function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className={cn("mb-1.5 block", fieldLabel)}>
        {label}
        {required && <span className="ml-1 text-tl-danger">*</span>}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn("cursor-pointer", surface.input)}
      >
        {children}
      </select>
    </label>
  );
}

/** The primary action button shared by the transit pages. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  tone?: "brand" | "green" | "rose";
  className?: string;
}) {
  const tones = {
    brand: "bg-tl-brand-fill hover:bg-tl-brand-fill-hover",
    green: "bg-tl-success hover:opacity-90",
    rose: "bg-tl-danger hover:opacity-90",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] px-[18px] py-2.5 text-sm font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        tones[tone],
        className
      )}
    >
      {children}
    </button>
  );
}

/** The quiet, bordered button that sits next to a primary one. */
export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(ghostButton, className)}
    >
      {children}
    </button>
  );
}
