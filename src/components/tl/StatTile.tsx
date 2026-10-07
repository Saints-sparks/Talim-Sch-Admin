import React, { type ReactNode } from "react";
import Link from "next/link";
import { focusRing } from "./styles";

/** Props for {@link StatTile}. */
export interface StatTileProps {
  /** The small uppercase label. */
  label: string;
  /** The number or text. */
  value: ReactNode;
  /** Colour and size classes for the value; default `text-2xl text-tl-ink`. */
  valueClass?: string;
  /** A grey line under the value ("of 420 enrolled"). */
  hint?: ReactNode;
  /** An icon in the top-right corner (decorative). */
  icon?: ReactNode;
  /** Shown on hover. */
  tip?: string;
  /** The tinted variant used inside cards. */
  subtle?: boolean;
  /** Makes the whole tile a link to this page. */
  href?: string;
  /** Extra classes on the tile. */
  className?: string;
}

/**
 * A stat tile: small uppercase label over a large value (the portals'
 * `stats` tiles), with an optional hint and icon. With `href` the tile is a
 * link and gets a focus ring and hover.
 *
 * @param props - See {@link StatTileProps}.
 * @param props.label - The label.
 * @param props.value - The value.
 * @param props.valueClass - The value's classes.
 * @param props.hint - The line under the value.
 * @param props.icon - The corner icon.
 * @param props.tip - Hover text.
 * @param props.subtle - Tinted variant.
 * @param props.href - Link target.
 * @param props.className - Extra classes.
 * @returns The tile.
 */
export function StatTile({
  label,
  value,
  valueClass = "text-2xl text-tl-ink",
  hint,
  icon,
  tip,
  subtle = false,
  href,
  className = "",
}: StatTileProps) {
  const frame = `${subtle ? "rounded-2xl border border-tl-line-soft bg-tl-subtle" : "rounded-[18px] border border-tl-line bg-tl-surface"} block px-4 py-3.5 ${className}`;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-extrabold uppercase tracking-[0.05em] text-tl-faint">
          {label}
        </div>
        {icon ? (
          <span aria-hidden className="text-tl-faint [&>svg]:h-[18px] [&>svg]:w-[18px]">
            {icon}
          </span>
        ) : null}
      </div>
      <div className={`mt-1.5 font-extrabold tracking-[-0.3px] ${valueClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-[13px] text-tl-muted">{hint}</div> : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        title={tip}
        className={`${frame} transition-colors hover:border-tl-control hover:bg-tl-subtle ${focusRing}`}
      >
        {body}
      </Link>
    );
  }
  return (
    <div title={tip} className={frame}>
      {body}
    </div>
  );
}

/**
 * The responsive grid stat tiles sit in: as many 160px-plus columns as fit.
 *
 * @param props - The tiles.
 * @param props.children - The tiles.
 * @param props.label - An accessible name for the group ("Fee summary").
 * @returns The grid.
 */
export function StatGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]"
    >
      {children}
    </div>
  );
}
