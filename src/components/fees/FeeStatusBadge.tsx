"use client";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  inactive: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  archived: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
};

/**
 * The coloured pill showing a category, fee item or assignment status.
 *
 * @param props - The status value as the API returns it.
 * @returns The badge.
 */
export function FeeStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        STATUS_BADGE[status] ?? STATUS_BADGE.inactive
      }`}
    >
      {status}
    </span>
  );
}
