"use client";

import { SkeletonBox } from "@/components/ui/loading";
import { brandTextClass, cardClass, mutedTextClass } from "./ui";

interface FeeStatCardProps {
  /** What the number means, e.g. "Outstanding Amount". */
  label: string;
  /** The figure, already formatted. Ignored while `loading`. */
  value: string | number;
  /** Small caption under the figure. */
  sub?: string;
  /** Tailwind text colour for the figure; defaults to the brand navy. */
  color?: string;
  /** Show a placeholder instead of the figure while the totals load. */
  loading?: boolean;
}

/**
 * One figure on the fees dashboard.
 *
 * @param props - Label, value and optional caption/colour.
 * @returns The stat card.
 */
export function FeeStatCard({ label, value, sub, color, loading = false }: FeeStatCardProps) {
  return (
    <div className={`${cardClass} p-4 flex flex-col gap-1 shadow-sm`}>
      <p className={`text-xs ${mutedTextClass}`}>{label}</p>
      {loading ? (
        <SkeletonBox className="h-8 w-24 my-0.5" />
      ) : (
        <p className={`text-2xl font-bold ${color || brandTextClass}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}
