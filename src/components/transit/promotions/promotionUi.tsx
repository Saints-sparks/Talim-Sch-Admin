"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromotionRunStatus } from "@/app/services/transit.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { surface, text } from "@/components/transit/ui";

/** Badge colours per promotion run status, in both themes. */
export const RUN_STATUS_BADGES: Record<PromotionRunStatus, string> = {
  draft:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  validated:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  committed:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  cancelled:
    "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
};

/**
 * Names a class by its id.
 *
 * @param classes - The school's classes.
 * @param classId - The id stored on a decision.
 * @returns The class name with its grade level, or a dash when it is gone.
 */
export function classNameById(classes: ClassOption[], classId: string): string {
  const found = classes.find((item) => item._id === classId);
  if (!found) return "—";
  return found.gradeLevel ? `${found.name} (${found.gradeLevel})` : found.name;
}

/** The status pill on a run. */
export function RunStatusBadge({ status }: { status: PromotionRunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        RUN_STATUS_BADGES[status]
      )}
    >
      {status}
    </span>
  );
}

/** One of the three counters above the runs table. */
export function StatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl p-5 shadow-sm", surface.card)}>
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-sm font-medium", text.muted)}>{label}</p>
        <span className="rounded-lg p-2 bg-[#003366]/10 dark:bg-sky-500/15 text-[#003366] dark:text-sky-400">
          {icon}
        </span>
      </div>
      <p className={cn("mt-3 text-3xl font-bold", text.strong)}>{value}</p>
    </div>
  );
}

/** A count tile in the validation summary. */
export function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red" | "amber";
}) {
  const tones = {
    green:
      "bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30",
    red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
    amber:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  } as const;
  return (
    <div className={cn("rounded-xl border p-4 text-center", tones[tone])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

/** A list of validation errors or warnings, or a line saying there are none. */
export function IssueList({
  title,
  issues,
  tone,
  empty,
}: {
  title: string;
  issues: string[];
  tone: "red" | "amber";
  empty: string;
}) {
  const tones = {
    red: "border-red-100 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    amber:
      "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  } as const;
  return (
    <div className={cn("mt-4 rounded-xl border p-4", tones[tone])}>
      <p className="text-sm font-semibold">{title}</p>
      {issues.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {issues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm opacity-80">{empty}</p>
      )}
    </div>
  );
}

/** One label / value block in the run details drawer. */
export function Meta({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className={cn("rounded-xl p-4", surface.inset)}>
      <p className={cn("text-xs font-semibold uppercase", text.muted)}>{label}</p>
      {badge ? (
        <span className="mt-2 inline-flex">
          <RunStatusBadge status={value as PromotionRunStatus} />
        </span>
      ) : (
        <p className={cn("mt-2 text-sm font-medium", text.strong)}>{value}</p>
      )}
    </div>
  );
}

/** A compact labelled action button in a table row. */
export function ActionButton({
  children,
  onClick,
  disabled,
  loading,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "green";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        tone === "green" ? "bg-green-600 hover:bg-green-700" : "bg-[#003366] hover:bg-[#003366]/90"
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** A square icon-only action button in a table row. */
export function IconButton({
  label,
  children,
  onClick,
  disabled,
  danger,
  loading,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        danger
          ? "border-rose-100 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          : "border-gray-200 dark:border-slate-700 text-[#003366] dark:text-sky-400 hover:bg-gray-50 dark:hover:bg-slate-800"
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
