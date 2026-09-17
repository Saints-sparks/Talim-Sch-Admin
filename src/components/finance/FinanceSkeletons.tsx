"use client";

/**
 * Loading placeholders shaped like the content that replaces them, so the
 * layout doesn't jump when wallet figures or a table page lands.
 */

/** One shimmering block. */
function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

/**
 * Placeholder for a row of headline figures.
 *
 * @param props - How many cards the real row will show.
 * @returns The skeleton row.
 */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-7 w-32 mt-3" />
          <Shimmer className="h-3 w-20 mt-3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder for a table while its first page loads.
 *
 * @param props - Column and row counts of the table being replaced.
 * @returns The skeleton table body.
 */
export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
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
 * @returns The skeleton list.
 */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-gray-100 p-5">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-3 w-56 mt-3" />
          <Shimmer className="h-3 w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}
