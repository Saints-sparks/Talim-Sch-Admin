"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromotionRunStatus } from "@/app/services/transit.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { surface, text } from "@/components/transit/ui";

/** Badge colours per promotion run status, in both themes. */
export const RUN_STATUS_BADGES: Record<PromotionRunStatus, string> = {
  draft: "bg-tl-warning-bg text-tl-warning border-tl-warning/30",
  validated: "bg-tl-select text-tl-link border-tl-control",
  committed: "bg-tl-success-bg text-tl-success border-tl-success/30",
  cancelled: "bg-tl-danger-bg text-tl-danger border-tl-danger/30",
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
    <div className={cn("rounded-[22px] p-5", surface.card)}>
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-sm font-medium", text.muted)}>{label}</p>
        <span className="rounded-lg p-2 bg-tl-select text-tl-brand">{icon}</span>
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
    green: "bg-tl-success-bg text-tl-success border-tl-success/30",
    red: "bg-tl-danger-bg text-tl-danger border-tl-danger/30",
    amber: "bg-tl-warning-bg text-tl-warning border-tl-warning/30",
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
    red: "border-tl-danger/30 bg-tl-danger-bg text-tl-danger",
    amber: "border-tl-warning/30 bg-tl-warning-bg text-tl-warning",
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
export function Meta({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className={cn("rounded-[22px] p-4", surface.inset)}>
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
        tone === "green"
          ? "bg-tl-success hover:opacity-90"
          : "bg-tl-brand-fill hover:bg-tl-brand-fill-hover"
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
          ? "border-tl-danger/30 text-tl-danger hover:bg-tl-danger-bg"
          : "border-tl-line text-tl-brand hover:bg-tl-bg"
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
