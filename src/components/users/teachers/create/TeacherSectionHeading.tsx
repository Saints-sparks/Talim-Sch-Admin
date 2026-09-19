import React from "react";

/**
 * Uppercase section title with an icon, used down the teacher wizard.
 *
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
    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
      {children}
    </h4>
  );
}
