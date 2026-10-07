import React from "react";
import type { TermResultStatus } from "@/types/gradingContract";

const STYLES: Record<TermResultStatus, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "bg-tl-warning-bg text-tl-warning border-tl-warning/30",
  },
  returned: {
    label: "Returned",
    className: "bg-tl-danger-bg text-tl-danger border-tl-danger/30",
  },
  published: {
    label: "Published",
    className: "bg-tl-success-bg text-tl-success border-tl-success/30",
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
