"use client";

import { StatTile } from "@/components/tl";

/** Props for {@link StatCard}. */
interface StatCardProps {
  /** What the figure means ("Total Collected"). */
  label: string;
  /** Already-formatted value — money through `formatNaira`, counts as strings. */
  value: string;
  /** A grey line under the value. */
  sub?: string;
  /** A decorative icon in the tile's corner. */
  icon: React.ElementType;
  /** Text colour class for the value (a `tl` token). */
  color?: string;
}

/**
 * One headline figure on a finance or payments overview, as a design-system
 * stat tile.
 *
 * @param props - Label, formatted value, optional sub-label, icon and colour.
 * @param props.label - The label.
 * @param props.value - The figure.
 * @param props.sub - The line under it.
 * @param props.icon - The corner icon.
 * @param props.color - The figure's colour class.
 * @returns The stat tile.
 */
export function StatCard({ label, value, sub, icon: Icon, color = "text-tl-ink" }: StatCardProps) {
  return (
    <StatTile
      label={label}
      value={value}
      valueClass={`text-2xl ${color}`}
      hint={sub}
      icon={<Icon />}
    />
  );
}
