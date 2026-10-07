"use client";

/**
 * The small pieces every dashboard panel reuses: the trend pill, the in-panel
 * empty state, the skeleton shapes and the responsive card grid.
 *
 * The skeletons hold the same height as the panel they stand in for, so the
 * page does not jump when a panel's data lands. Only the grey blocks pulse
 * (`skeletonBlock`), and only while a panel loads.
 */

import React, { type ReactNode } from "react";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyNote, card, pill, skeletonBlock } from "@/components/tl";

/**
 * A percentage change: green and rising when up, red and falling when down.
 *
 * @param props - The change.
 * @param props.value - The change in percent; negative when down.
 * @returns The pill.
 */
export function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`${pill} tabular-nums ${
        positive ? "bg-tl-success-bg text-tl-success" : "bg-tl-danger-bg text-tl-danger"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" aria-hidden />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden />
      )}
      <span className="sr-only">{positive ? "Up" : "Down"} </span>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/**
 * A card heading with a small icon before the words.
 *
 * @param props - The icon and words.
 * @param props.icon - The decorative icon.
 * @param props.children - The heading's words.
 * @returns The heading content.
 */
export function IconTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="text-tl-brand [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </span>
      {children}
    </span>
  );
}

/**
 * "Nothing here yet" inside a panel that has already loaded.
 *
 * @param props - The message and size.
 * @param props.message - The sentence to show.
 * @param props.compact - Less vertical room (small panels).
 * @returns The empty state.
 */
export function PanelEmptyState({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return <EmptyNote title={message} icon={<Activity />} compact={compact} />;
}

/**
 * Placeholder for one KPI tile, the same size as a loaded `StatTile`.
 *
 * @returns The skeleton tile.
 */
export function CardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-[112px] flex-col gap-2.5 rounded-[18px] border border-tl-line bg-tl-surface px-4 py-3.5"
    >
      <div className={`${skeletonBlock} h-3 w-24 rounded`} />
      <div className={`${skeletonBlock} h-7 w-16 rounded-md`} />
      <div className={`${skeletonBlock} h-3 w-28 rounded`} />
    </div>
  );
}

/**
 * Placeholder for a chart or list panel, holding its final height.
 *
 * @param props - The panel's height.
 * @param props.minH - The loaded panel's height in px; default 280.
 * @returns The skeleton card.
 */
export function PanelSkeleton({ minH = 280 }: { minH?: number }) {
  return (
    <div aria-hidden className={`${card} flex flex-col gap-5`} style={{ minHeight: minH }}>
      <div className={`${skeletonBlock} h-5 w-40 rounded`} />
      <div className={`${skeletonBlock} rounded-2xl`} style={{ height: minH - 100 }} />
    </div>
  );
}

/**
 * Announces a loading panel once to screen readers while its grey blocks
 * stand in for it.
 *
 * @param props - What is loading and its skeletons.
 * @param props.label - What is loading ("Loading the finance snapshot").
 * @param props.children - The skeleton blocks.
 * @param props.className - Layout classes (usually {@link panelGrid}).
 * @returns The busy region.
 */
export function PanelLoading({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

/**
 * The grid the dashboard's cards sit in: as many 320px-plus columns as fit,
 * one column on a phone, never wider than the page.
 */
export const panelGrid =
  "grid items-stretch gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]";

/** The same grid for smaller cards (260px-plus columns). */
export const narrowPanelGrid =
  "grid items-stretch gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]";
