import React from "react";

/**
 * The unread-count pill on a navigation entry.
 *
 * @param props.count - The number to show; nothing renders for 0.
 * @param props.variant - `floating` sits on the corner of an icon, `inline` sits at the row's end.
 * @returns The pill, or null.
 */
export function NavBadge({ count, variant }: { count: number; variant: "floating" | "inline" }) {
  if (!count || count <= 0) return null;
  const text = count > 99 ? "99+" : count;

  if (variant === "floating") {
    return (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white px-0.5">
        {text}
      </span>
    );
  }
  return (
    <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
      {text}
    </span>
  );
}
