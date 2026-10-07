"use client";

import { StatTile, skeletonBlock } from "@/components/tl";

interface FeeStatCardProps {
  /** What the number means, e.g. "Outstanding Amount". */
  label: string;
  /** The figure, already formatted. Ignored while `loading`. */
  value: string | number;
  /** Small caption under the figure. */
  sub?: string;
  /** Text colour class for the figure (a `tl` token); defaults to ink. */
  color?: string;
  /** Show a placeholder instead of the figure while the totals load. */
  loading?: boolean;
}

/**
 * One figure on the fees dashboard, as a design-system stat tile.
 *
 * @param props - Label, value and optional caption/colour.
 * @param props.label - What the number means.
 * @param props.value - The figure.
 * @param props.sub - The caption under it.
 * @param props.color - The figure's colour class.
 * @param props.loading - Whether the totals are still loading.
 * @returns The stat tile.
 */
export function FeeStatCard({ label, value, sub, color, loading = false }: FeeStatCardProps) {
  return (
    <StatTile
      label={label}
      value={
        loading ? (
          <span className="block py-0.5">
            <span aria-hidden className={`${skeletonBlock} block h-7 w-24 rounded-lg`} />
            <span className="sr-only">Loading</span>
          </span>
        ) : (
          value
        )
      }
      valueClass={`text-2xl ${color || "text-tl-ink"}`}
      hint={sub}
    />
  );
}
