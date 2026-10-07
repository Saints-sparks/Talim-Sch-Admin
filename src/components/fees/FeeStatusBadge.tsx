"use client";

import { Pill, type Tone } from "@/components/tl";

/** The pill tone per category, fee item or assignment status. */
const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  draft: "warning",
  inactive: "muted",
  archived: "danger",
};

/**
 * The pill showing a category, fee item or assignment status.
 *
 * @param props - The status value as the API returns it.
 * @param props.status - `active`, `draft`, `inactive` or `archived`.
 * @returns The pill.
 */
export function FeeStatusBadge({ status }: { status: string }) {
  return (
    <Pill tone={STATUS_TONE[status] ?? "muted"} className="capitalize">
      {status}
    </Pill>
  );
}
