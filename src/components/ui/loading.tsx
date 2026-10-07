"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

type BoxProps = {
  className?: string;
};

/**
 * A pulsing grey block.
 *
 * @param props - See the props type.
 * @param props.className - Size and shape classes.
 * @returns The block.
 */
export function SkeletonBox({ className }: BoxProps) {
  return <div className={cn("animate-pulse rounded bg-tl-line/70", className)} />;
}

type SectionSkeletonProps = {
  rows?: number;
  rowClassName?: string;
  className?: string;
};

/**
 * A column of pulsing rows (a list loading).
 *
 * @param props - See the props type.
 * @param props.rows - How many rows.
 * @param props.rowClassName - Each row's classes.
 * @param props.className - The column's classes.
 * @returns The rows.
 */
export function SectionSkeleton({
  rows = 5,
  rowClassName = "h-10",
  className,
}: SectionSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBox key={index} className={rowClassName} />
      ))}
    </div>
  );
}

type GridSkeletonProps = {
  cards?: number;
  className?: string;
  cardClassName?: string;
};

/**
 * A grid of pulsing person cards (a roster loading).
 *
 * @param props - See the props type.
 * @param props.cards - How many cards.
 * @param props.className - The grid's classes.
 * @param props.cardClassName - Each card's classes.
 * @returns The grid.
 */
export function GridSkeleton({
  cards = 9,
  className,
  cardClassName = "h-[218px]",
}: GridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className={cn("rounded-[22px] border border-tl-line bg-tl-surface p-4", cardClassName)}
        >
          <SkeletonBox className="mx-auto mb-2 h-16 w-16 rounded-full" />
          <SkeletonBox className="mx-auto mb-2 h-5 w-32" />
          <SkeletonBox className="mx-auto mb-2 h-4 w-40" />
          <SkeletonBox className="mx-auto mb-4 h-4 w-24" />
          <SkeletonBox className="mx-auto h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

type PageSkeletonProps = {
  titleWidthClass?: string;
  subtitleWidthClass?: string;
  showFilterRow?: boolean;
  children?: React.ReactNode;
};

/**
 * A page loading: heading, an optional filter row, then the children, with the page padding.
 *
 * @param props - See the props type.
 * @param props.titleWidthClass - The heading block's width.
 * @param props.subtitleWidthClass - The subtitle block's width.
 * @param props.showFilterRow - Whether to draw the filter row.
 * @param props.children - More skeleton below.
 * @returns The skeleton.
 */
export function PageSkeleton({
  titleWidthClass = "w-48",
  subtitleWidthClass = "w-32",
  showFilterRow = true,
  children,
}: PageSkeletonProps) {
  return (
    <div
      className="mx-auto w-full max-w-[1460px] px-[clamp(14px,3vw,26px)] pb-16 pt-[clamp(18px,3vw,28px)]"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mb-6">
        <SkeletonBox className={cn("mb-2 h-8", titleWidthClass)} />
        <SkeletonBox className={cn("h-4", subtitleWidthClass)} />
      </div>
      {showFilterRow && (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <SkeletonBox className="h-8 w-24" />
            <SkeletonBox className="h-8 w-16" />
          </div>
          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <SkeletonBox className="h-10 w-full md:w-80" />
            <SkeletonBox className="h-10 w-full md:w-48" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

type InlineSpinnerProps = {
  label?: string;
  className?: string;
};

/**
 * A small spinner with a word, inline.
 *
 * @param props - See the props type.
 * @param props.label - The word.
 * @param props.className - Extra classes.
 * @returns The spinner.
 */
export function InlineSpinner({ label = "Loading...", className }: InlineSpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-tl-muted", className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </span>
  );
}
