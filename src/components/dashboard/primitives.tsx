"use client";

/**
 * The small pieces every dashboard panel reuses: the trend pill, the in-panel
 * empty state, and the two skeleton shapes.
 *
 * The skeletons hold the same height as the panel they stand in for, so the
 * page does not jump when a panel's data lands.
 */

import React from "react";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** A percentage change, green when up and red when down. */
export function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      )}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/** "Nothing here yet" inside a panel that has already loaded. */
export function PanelEmptyState({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-10"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-2">
        <Activity className="w-4 h-4 text-gray-400 dark:text-slate-500" />
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

/** Placeholder for one KPI card. */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="w-14 h-5 bg-gray-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="w-16 h-7 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
      <div className="w-24 h-3 bg-gray-100 dark:bg-slate-700 rounded mb-1.5" />
      <div className="w-20 h-3 bg-gray-100 dark:bg-slate-700 rounded mb-4" />
      <div className="w-16 h-3 bg-gray-100 dark:bg-slate-700 rounded" />
    </div>
  );
}

/** Placeholder for a chart or list panel, holding its final height. */
export function PanelSkeleton({ minH = 280 }: { minH?: number }) {
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse"
      style={{ minHeight: minH }}
    >
      <div className="w-36 h-4 bg-gray-200 dark:bg-slate-700 rounded mb-5" />
      <div
        className="bg-gray-100 dark:bg-slate-700 rounded-lg flex-1"
        style={{ height: minH - 80 }}
      />
    </div>
  );
}
