import React from "react";

/**
 * Section title with a tinted icon badge and a rule beneath, used down the
 * student wizard.
 *
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
    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
      <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
        <svg
          className="w-5 h-5 text-[#003366] dark:text-blue-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{children}</h4>
    </div>
  );
}
