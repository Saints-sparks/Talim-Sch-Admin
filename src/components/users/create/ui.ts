/**
 * Class groups shared by the add-teacher and add-student dialogs, in the tl
 * look (the portals' sheet). The tokens switch with the dark theme, so no
 * class here needs a `dark:` variant; keeping them in one place keeps the two
 * wizards from drifting apart.
 */
import { fieldControl, fieldError, fieldLabel } from "@/components/tl";

/** Control density: the teacher wizard is roomier than the student one. */
export type ControlSize = "lg" | "md";

/**
 * Class list for a text input, select or textarea: the tl field control. A
 * field with an error gets a red border from its `aria-invalid`.
 *
 * @param size - `lg` for the teacher wizard, `md` for the student wizard.
 * @param invalid - Paints the border red when the field has an error.
 * @returns The class string.
 */
export function inputClass(size: ControlSize, invalid = false): string {
  return `${fieldControl} ${size === "lg" ? "min-h-[48px]" : ""} ${invalid ? "border-tl-danger" : ""}`;
}

/** Field label. */
export const labelClass = `block ${fieldLabel}`;

/** Inline error under a field. */
export const fieldErrorClass = `mt-1.5 ${fieldError}`;

/** Body copy on a card. */
export const bodyTextClass = "text-tl-body";

/** Secondary copy on a card. */
export const mutedTextClass = "text-tl-muted";

/** Backdrop behind a dialog: a bottom sheet on phones, centred from `sm` up. */
export const overlayClass =
  "fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,27,46,0.45)] sm:items-center sm:p-4";

/** The pale "setup guide" tile at the top of each wizard's body. */
export const guideCardClass = "mb-5 rounded-2xl border border-tl-line-soft bg-tl-subtle p-4";

/** Brand heading text, readable on a dark surface too. */
export const navyTextClass = "text-tl-brand";

/** The dialog panel: the portals' sheet surface. */
export const panelClass =
  "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-tl-surface text-tl-ink shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] sm:max-h-[90vh] sm:rounded-[24px] border border-tl-line";

/** A titled block inside a wizard step (class picker, schedule). */
export const blockClass = "rounded-[18px] border border-tl-line bg-tl-surface p-5";
