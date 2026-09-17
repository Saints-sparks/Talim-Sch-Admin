/**
 * Tailwind class groups shared by the fees screens.
 *
 * The area was written light-only (`bg-white`, `text-gray-800`). Keeping the
 * surface, text and control classes in one place means a dark variant is
 * defined once instead of on ~200 elements, and the tabs, tables and modals
 * cannot drift apart.
 */

/** A panel/card surface. */
export const cardClass =
  "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800";

/** The page background behind the fees screens. */
export const pageClass = "min-h-screen bg-gray-50 dark:bg-gray-950";

/** Primary heading text. */
export const headingClass = "text-gray-900 dark:text-gray-100";

/** Body text inside cards and table cells. */
export const bodyTextClass = "text-gray-800 dark:text-gray-200";

/** Secondary text: labels, descriptions, empty states. */
export const mutedTextClass = "text-gray-500 dark:text-gray-400";

/** The brand navy, and a readable stand-in for it on a dark surface. */
export const brandTextClass = "text-[#003366] dark:text-blue-300";

/** Filled brand button. */
export const primaryButtonClass =
  "bg-[#003366] text-white font-medium hover:bg-[#003366]/90 disabled:opacity-60 disabled:cursor-not-allowed";

/** Outlined neutral button. */
export const secondaryButtonClass =
  "text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60";

/** Text input, select and textarea. */
export const inputClass =
  "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#003366]/30";

/** Table header row. */
export const tableHeadClass = "bg-gray-50 dark:bg-gray-800/60";

/** Table header cell. */
export const tableHeadCellClass =
  "text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400";

/** Table body, separating rows. */
export const tableBodyClass = "divide-y divide-gray-50 dark:divide-gray-800";

/** Table row hover. */
export const tableRowClass = "hover:bg-gray-50/50 dark:hover:bg-gray-800/40";

/** Icon-only row action button. */
export const iconButtonClass =
  "p-1.5 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800";

/** Wrapper that keeps a wide table scrolling inside its own card. */
export const tableScrollClass = "overflow-x-auto";

/** Modal backdrop. */
export const modalBackdropClass =
  "fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center px-4";

/** Modal panel. */
export const modalPanelClass =
  "bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-h-[85vh] overflow-y-auto";
