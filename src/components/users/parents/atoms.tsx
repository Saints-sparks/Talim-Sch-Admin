"use client";

import React from "react";
import { cn } from "@/lib/utils";

/** A green/red pill saying whether an account can sign in. */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
        active ? "bg-tl-success-bg text-tl-success" : "bg-tl-danger-bg text-tl-danger"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-tl-success" : "bg-tl-danger")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** A small label/value pair used throughout the parent panels. */
export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-tl-faint">{label}</p>
      <p className="mt-1 font-semibold text-tl-body">{value}</p>
    </div>
  );
}

/** A date as `12 Apr 2024`, or `-` when there isn't one. */
export function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
