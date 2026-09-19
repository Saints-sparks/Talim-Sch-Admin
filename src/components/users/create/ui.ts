/**
 * Tailwind class groups shared by the add-teacher and add-student dialogs.
 *
 * The dialogs were written light-only; keeping surface, text and control
 * classes here defines each dark variant once and keeps the two wizards from
 * drifting apart.
 */

/** Control density: the teacher wizard is roomier than the student one. */
export type ControlSize = "lg" | "md";

/**
 * Class list for a text input, select or textarea.
 *
 * @param size - `lg` for the teacher wizard, `md` for the student wizard.
 * @param invalid - Paints the border red when the field has an error.
 * @returns The Tailwind classes.
 */
export function inputClass(size: ControlSize, invalid = false): string {
  const shape =
    size === "lg"
      ? "px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      : "px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const tone = invalid
    ? "border-red-400 dark:border-red-500"
    : size === "lg"
      ? "border-gray-200 dark:border-gray-700"
      : "border-gray-300 dark:border-gray-700";
  return `w-full ${shape} ${tone} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all disabled:opacity-60`;
}

/** Field label. */
export const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

/** Inline error under a field. */
export const fieldErrorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

/** Body copy on a card. */
export const bodyTextClass = "text-gray-600 dark:text-gray-300";

/** Secondary copy on a card. */
export const mutedTextClass = "text-gray-500 dark:text-gray-400";

/** Backdrop behind a dialog. */
export const overlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm";

/** Gold "setup guide" card at the top of each wizard's body. */
export const guideCardClass =
  "mb-5 rounded-2xl border border-[#F4B740]/30 bg-gradient-to-r from-[#FFF8E8] to-white dark:from-amber-950/40 dark:to-gray-900 p-4 shadow-sm";

/** Navy heading text, readable on a dark surface too. */
export const navyTextClass = "text-[#003366] dark:text-blue-300";
