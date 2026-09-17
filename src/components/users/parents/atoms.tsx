"use client";

import React from "react";
import { cn } from "@/lib/utils";

/** A green/red pill saying whether an account can sign in. */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-600 dark:bg-emerald-400" : "bg-rose-600 dark:bg-rose-400",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** A small label/value pair used throughout the parent panels. */
export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

/** A date as `12 Apr 2024`, or `-` when there isn't one. */
export function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

/** A date and time as `12 Apr 2024, 09:30`, or `-` when there isn't one. */
export function formatDateTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
