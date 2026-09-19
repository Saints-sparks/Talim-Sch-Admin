"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/transit/useTransitUi";

/**
 * Shared surface classes for the transit pages, so a card, a table and a modal
 * agree on their background, border and text colours in both themes.
 */
export const surface = {
  /** A raised panel: cards, tables, modals. */
  card: "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800",
  /** The row of headings above a table. */
  tableHead: "bg-gray-50 dark:bg-slate-800/60",
  /** A divider between rows. */
  divide: "divide-gray-50 dark:divide-slate-800",
  /** A quiet inset block. */
  inset: "bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800",
  /** A form control. */
  input:
    "border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#030E18] dark:text-slate-100 placeholder:text-[#929292] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-sky-500 transition-colors",
} as const;

/** Shared text colours, so headings and captions stay legible in the dark theme. */
export const text = {
  /** A heading or a value the eye should land on. */
  strong: "text-[#030E18] dark:text-slate-100",
  /** Body copy. */
  body: "text-[#4A5568] dark:text-slate-300",
  /** A label or caption. */
  muted: "text-[#6F6F6F] dark:text-slate-400",
  /** The brand colour, lightened for the dark theme. */
  brand: "text-[#003366] dark:text-sky-400",
} as const;

/** One label / value line inside a detail card. */
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
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
    <section className={cn("rounded-xl p-5 shadow-sm", surface.card)}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("w-4 h-4", text.brand)} />
        <h2 className={cn("text-sm font-semibold", text.strong)}>{title}</h2>
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
        <div
          key={index}
          className={cn("rounded-xl animate-pulse bg-gray-50 dark:bg-slate-800", height)}
        />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030E18]/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "w-full flex max-h-[90vh] flex-col rounded-2xl shadow-xl",
          surface.card,
          width
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className={cn("text-lg font-semibold", text.strong)}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className={cn("w-4 h-4", text.muted)} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
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
      <span className={cn("mb-1.5 block text-xs font-semibold uppercase", text.muted)}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full rounded-lg px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60",
          surface.input
        )}
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
    brand: "bg-[#003366] hover:bg-[#003366]/90",
    green: "bg-green-600 hover:bg-green-700",
    rose: "bg-rose-600 hover:bg-rose-700",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
      className={cn(
        "rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50",
        text.body,
        className
      )}
    >
      {children}
    </button>
  );
}
