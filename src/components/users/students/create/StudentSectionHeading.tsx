import React from "react";

/**
 * Section title with a tinted icon tile and a rule beneath, used down the
 * student wizard.
 *
 * @param props - The icon and the title.
 * @param props.iconPath - SVG path data for a 24px outline icon.
 * @param props.children - The title.
 * @returns The heading.
 */
export function StudentSectionHeading({
  iconPath,
  children,
}: {
  iconPath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-tl-line-soft pb-2.5">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tl-select text-tl-brand"
      >
        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </span>
      <h3 className="text-[15px] font-extrabold text-tl-ink">{children}</h3>
    </div>
  );
}
