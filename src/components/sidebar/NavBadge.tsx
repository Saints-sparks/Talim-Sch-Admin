import React from "react";

/**
 * The unread-count pill on a navigation entry (the portals' amber badge).
 *
 * @param props - The count and where it sits.
 * @param props.count - The number to show; nothing renders for 0.
 * @param props.variant - `floating` sits on the corner of an icon, `inline` sits at the row's end.
 * @param props.label - What the number counts, for screen readers ("unread messages").
 * @returns The pill, or null.
 */
export function NavBadge({
  count,
  variant,
  label = "unread",
}: {
  count: number;
  variant: "floating" | "inline";
  label?: string;
}) {
  if (!count || count <= 0) return null;
  const text = count > 99 ? "99+" : count;
  const spoken = `${text} ${label}`;

  if (variant === "floating") {
    return (
      <span
        aria-label={spoken}
        className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-tl-surface bg-tl-badge px-1 text-[10px] font-extrabold text-white"
      >
        {text}
      </span>
    );
  }
  return (
    <span
      aria-label={spoken}
      className="ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tl-badge px-[7px] text-xs font-extrabold text-white"
    >
      {text}
    </span>
  );
}
