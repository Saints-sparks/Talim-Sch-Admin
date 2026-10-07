"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Lock, X } from "lucide-react";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { focusRing, ghostButton, iconButton, primaryButton } from "@/components/tl/styles";

/**
 * The shared look of the Settings area: one set of atoms every section builds
 * on, so a card, a toggle row or a button never drifts between sections.
 * Each carries its own `dark:` variants.
 */

/** Title and one-line description at the top of a settings section. */
export function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[21px] font-extrabold tracking-[-0.4px] text-tl-ink">{title}</h2>
      <p className="mt-1 text-[15px] text-tl-muted">{desc}</p>
    </div>
  );
}

/** A bordered surface. */
export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-[22px] border border-tl-line bg-tl-surface shadow-[0_1px_2px_rgba(15,27,46,0.04),0_14px_30px_-22px_rgba(15,27,46,0.18)] dark:shadow-none ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** A card's title row, with an optional action on the right. */
export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-tl-line-soft">
      <h3 className="text-[15px] font-extrabold text-tl-ink">{title}</h3>
      {action}
    </div>
  );
}

/** A labelled switch row inside a card. */
export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-tl-line-soft last:border-0">
      <div>
        <p className="text-sm font-medium text-tl-ink">{label}</p>
        {desc && <p className="text-xs text-tl-muted mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`flex min-h-[44px] shrink-0 items-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      >
        <span
          aria-hidden
          className={`flex h-[29px] w-[50px] rounded-full p-[3px] transition-colors ${
            checked ? "justify-end bg-tl-brand-fill" : "justify-start bg-tl-control"
          }`}
        >
          <span className="h-[23px] w-[23px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
        </span>
      </button>
    </div>
  );
}

/** A value the school cannot edit here, shown with a padlock. */
export function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-bold text-tl-muted">{label}</label>
      <div className="flex min-h-[46px] items-center gap-2 rounded-[13px] border border-tl-line bg-tl-subtle px-3.5">
        <span className="text-sm text-tl-body flex-1">{value || "—"}</span>
        <Lock className="w-3.5 h-3.5 text-tl-faint shrink-0" />
      </div>
    </div>
  );
}

/** A labelled text input. */
export function InputField({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  required,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Called when the field loses focus — where a per-field save belongs. */
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-bold text-tl-muted">
        {label} {required && <span className="text-tl-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-label={label}
        aria-invalid={Boolean(error)}
        className={`min-h-[46px] w-full rounded-[13px] border bg-tl-surface px-3.5 text-[15px] font-semibold text-tl-ink placeholder:font-medium placeholder:text-tl-faint transition disabled:opacity-60 ${focusRing} ${
          error
            ? "border-tl-danger focus:border-tl-danger"
            : "border-tl-control focus:border-tl-link"
        }`}
      />
      {error && <p className="mt-1 text-[13px] font-semibold text-tl-danger">{error}</p>}
    </div>
  );
}

/** Props both buttons pass through to the `<button>`. */
interface ButtonPassThrough {
  /** Takes focus when it mounts (the safe choice in a confirmation dialog). */
  autoFocus?: boolean;
  /** Ids of text that explains the button, e.g. why it is disabled. */
  "aria-describedby"?: string;
}

/** The filled action button. */
export function PrimaryBtn({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
} & ButtonPassThrough) {
  return (
    <button
      {...rest}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${primaryButton} ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** The secondary action button. */
export function OutlineBtn({
  children,
  onClick,
  disabled,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
} & ButtonPassThrough) {
  return (
    <button
      {...rest}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${ghostButton} ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-tl-success-bg text-tl-success border-tl-success/30",
  current: "bg-tl-select text-tl-link border-tl-control",
  completed: "bg-tl-track text-tl-muted border-tl-line",
  upcoming: "bg-tl-warning-bg text-tl-warning border-tl-warning/30",
};

/** A small coloured status pill. */
export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES.completed;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}
    >
      {status}
    </span>
  );
}

/** An inline note box. `tone` picks the colour. */
export function Notice({
  tone = "info",
  children,
  icon,
}: {
  tone?: "info" | "warning" | "danger";
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const tones = {
    info: "bg-tl-select border-tl-control text-tl-link",
    warning: "bg-tl-warning-bg border-tl-warning/30 text-tl-warning",
    danger: "bg-tl-danger-bg border-tl-danger/30 text-tl-danger",
  } as const;
  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      {icon}
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * A centred modal. Locks page scroll while open and restores it on close
 * (D6), and closes on Escape or a click on the backdrop.
 */
export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,27,46,0.45)] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-tl-surface shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] sm:rounded-[24px] dark:border dark:border-tl-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-tl-line-soft">
          <h3 className="text-[19px] font-extrabold tracking-[-0.3px] text-tl-ink">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`-mr-2 ${iconButton}`}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

/**
 * What to tell the user about a failed settings request, keyed on the API
 * error code rather than on whatever message the server happened to send.
 */
export function settingsErrorMessage(error: unknown, fallback: string): string {
  const code = error instanceof ApiError ? error.code : undefined;
  switch (code) {
    case "NETWORK_OFFLINE":
      return "You're offline. Reconnect and try again.";
    case "REQUEST_TIMEOUT":
    case "SERVICE_UNAVAILABLE":
      return "The server took too long to answer. Try again in a moment.";
    case "FORBIDDEN":
      return "Your role doesn't have access to this setting.";
    case "UNAUTHENTICATED":
    case "TOKEN_EXPIRED":
      return "Your session expired. Sign in again to continue.";
    case "NOT_FOUND":
      return "These settings haven't been set up for your school yet.";
    default:
      return getErrorMessage(error, fallback);
  }
}

/** A failed section: says what went wrong and offers a retry. */
export function SectionError({
  title,
  desc,
  error,
  fallback,
  onRetry,
}: {
  title: string;
  desc: string;
  error: unknown;
  fallback: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title={title} desc={desc} />
      <Card className="p-8 text-center">
        <div className="w-11 h-11 rounded-full bg-tl-danger-bg border border-tl-danger/30 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5 text-tl-danger" />
        </div>
        <p className="text-sm font-semibold text-tl-ink">We couldn&apos;t load this section</p>
        <p className="text-xs text-tl-muted mt-1 mb-4">{settingsErrorMessage(error, fallback)}</p>
        <PrimaryBtn onClick={onRetry} className="mx-auto">
          Try again
        </PrimaryBtn>
      </Card>
    </div>
  );
}

/** The skeleton every section shows while its first request is in flight. */
export function SectionSkeleton({
  title,
  desc,
  rows = 2,
}: {
  title: string;
  desc: string;
  rows?: number;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title={title} desc={desc} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-[22px] bg-tl-line/70" />
      ))}
    </div>
  );
}
