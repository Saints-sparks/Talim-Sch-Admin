"use client";

/**
 * A read-only labelled value on the class screens (Class Name, Grade Level,
 * Email…), drawn as the design system's pale tile.
 */
import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { tile } from "@/components/tl";

/** Props for {@link ClassInfoTile}. */
export interface ClassInfoTileProps {
  /** The small label above the value. */
  label: string;
  /** A decorative icon before the label. */
  icon?: React.ReactNode;
  /** The value. */
  value: React.ReactNode;
  /** Hover text explaining the label. */
  tooltip?: string;
  /** Extra classes (e.g. a column span). */
  className?: string;
}

/**
 * Renders the tile.
 *
 * @param props - See {@link ClassInfoTileProps}.
 * @param props.label - The label.
 * @param props.icon - The icon.
 * @param props.value - The value.
 * @param props.tooltip - Hover text for the label.
 * @param props.className - Extra classes.
 * @returns The tile.
 */
export function ClassInfoTile({ label, icon, value, tooltip, className = "" }: ClassInfoTileProps) {
  const labelNode = (
    <span className="flex w-fit items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.05em] text-tl-faint [&>svg]:h-3.5 [&>svg]:w-3.5">
      {icon}
      {label}
    </span>
  );

  return (
    <div className={`${tile} flex min-w-0 flex-col gap-1.5 ${className}`}>
      {tooltip ? (
        <Tooltip content={tooltip} side="right">
          {labelNode}
        </Tooltip>
      ) : (
        labelNode
      )}
      <div className="break-words text-[15px] font-semibold text-tl-ink">{value}</div>
    </div>
  );
}
