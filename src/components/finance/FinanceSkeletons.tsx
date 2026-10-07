"use client";

/**
 * Loading placeholders shaped like the content that replaces them, so the
 * layout doesn't jump when wallet figures or a table page lands. They pulse
 * only while shown, and each group is announced once as busy.
 */
import { skeletonBlock } from "@/components/tl";

/**
 * One pulsing block.
 *
 * @param props - Size and shape classes.
 * @param props.className - The block's classes.
 * @returns The block.
 */
function Shimmer({ className }: { className: string }) {
  return <div aria-hidden className={`${skeletonBlock} rounded-md ${className}`} />;
}

/**
 * Placeholder for a row of headline figures.
 *
 * @param props - How many tiles the real row will show.
 * @param props.count - Tile count.
 * @returns The skeleton row.
 */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]"
    >
      <span className="sr-only">Loading figures</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-[18px] border border-tl-line bg-tl-surface px-4 py-3.5">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="mt-3 h-7 w-32" />
          <Shimmer className="mt-2.5 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder for a table while its first page loads.
 *
 * @param props - Column and row counts of the table being replaced.
 * @param props.columns - Column count.
 * @param props.rows - Row count.
 * @returns The skeleton table body.
 */
export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} aria-hidden className="border-t border-tl-line-soft">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3.5">
              <Shimmer className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Placeholder for a list of cards (payout accounts, providers).
 *
 * @param props - How many cards to show.
 * @param props.count - Card count.
 * @returns The skeleton list.
 */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-[22px] border border-tl-line bg-tl-surface p-5">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="mt-3 h-3 w-56 max-w-full" />
          <Shimmer className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
