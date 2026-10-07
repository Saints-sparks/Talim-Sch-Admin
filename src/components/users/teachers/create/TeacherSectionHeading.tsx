import React from "react";
import { eyebrow } from "@/components/tl";

/**
 * Small uppercase section title with an icon, used down the teacher wizard.
 *
 * @param props - The icon and the title.
 * @param props.iconPath - SVG path data for a 24px outline icon.
 * @param props.children - The title.
 * @returns The heading.
 */
export function TeacherSectionHeading({
  iconPath,
  children,
}: {
  iconPath: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={`${eyebrow} mb-4 flex items-center gap-2 text-tl-muted`}>
      <svg className="h-4 w-4 text-tl-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
      {children}
    </h3>
  );
}
