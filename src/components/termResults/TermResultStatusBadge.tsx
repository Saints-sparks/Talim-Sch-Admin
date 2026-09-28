import React from "react";
import type { TermResultStatus } from "@/types/gradingContract";

const STYLES: Record<TermResultStatus, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  returned: {
    label: "Returned",
    className:
      "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  published: {
    label: "Published",
    className:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
};

/** A term-result submission's state as a small pill. */
export function TermResultStatusBadge({ status }: { status: TermResultStatus }) {
  const style = STYLES[status] ?? STYLES.submitted;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.className}`}
    >
      {style.label}
    </span>
  );
}
