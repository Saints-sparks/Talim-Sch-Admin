"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Lock, X } from "lucide-react";
import { ApiError, getErrorMessage } from "@/lib/apiError";

/**
 * The shared look of the Settings area: one set of atoms every section builds
 * on, so a card, a toggle row or a button never drifts between sections.
 * Each carries its own `dark:` variants.
 */

/** Title and one-line description at the top of a settings section. */
export function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>
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
      className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** A card's title row, with an optional action on the right. */
export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</h3>
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
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</p>
        {desc && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          checked ? "bg-[#003366] dark:bg-blue-600" : "bg-gray-200 dark:bg-slate-600"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/** A value the school cannot edit here, shown with a padlock. */
export function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
        <span className="text-sm text-gray-700 dark:text-slate-300 flex-1">{value || "—"}</span>
        <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
      </div>
    </div>
  );
}

/** A labelled text input. */
export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-label={label}
        aria-invalid={Boolean(error)}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-[#003366]/10 outline-none transition disabled:opacity-60 ${
          error
            ? "border-red-400 dark:border-red-500 focus:border-red-500"
            : "border-gray-300 dark:border-slate-600 focus:border-[#003366]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/** The filled action button. */
export function PrimaryBtn({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  current: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  completed: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600",
  upcoming: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
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
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
  } as const;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${tones[tone]}`}>
      {icon}
      <div className="text-xs">{children}</div>
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
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
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
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
        <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          We couldn&apos;t load this section
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4">
          {settingsErrorMessage(error, fallback)}
        </p>
        <PrimaryBtn onClick={onRetry} className="mx-auto">
          Try again
        </PrimaryBtn>
      </Card>
    </div>
  );
}

/** The skeleton every section shows while its first request is in flight. */
export function SectionSkeleton({ title, desc, rows = 2 }: { title: string; desc: string; rows?: number }) {
  return (
    <div className="space-y-5">
      <SectionHeader title={title} desc={desc} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-40 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
