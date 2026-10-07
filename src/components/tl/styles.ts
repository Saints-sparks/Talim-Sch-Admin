/**
 * Shared class strings for School Admin's design system, the same language
 * as the redesigned Teacher and Student portals (Talim-Teachers and
 * Talim-students-web `components/tl/styles.ts`): buttons, cards, pills,
 * chips, segmented controls, tables and form controls.
 *
 * Kept under `src/components` so Tailwind's content scan sees them. Colours
 * come from the `tl-*` tokens in `src/app/globals.css`, which switch with the
 * dark theme, so nothing here needs a `dark:` variant. Every interactive
 * control is at least 44px tall.
 */

/** Keyboard focus ring for every interactive element. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link focus-visible:ring-offset-2 focus-visible:ring-offset-tl-surface";

/** The navy primary button (design `PB`). */
export const primaryButton = `inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-tl-brand-fill px-[18px] py-3 text-sm font-bold text-tl-on-brand transition-colors hover:bg-tl-brand-fill-hover disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** The outlined secondary button (design `GB`). */
export const ghostButton = `inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border border-tl-control bg-tl-surface px-[18px] py-3 text-sm font-bold text-tl-brand transition-colors hover:bg-tl-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** The small outlined action on list and table rows ("Review", "Open"). */
export const rowButton = `inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] border border-tl-control bg-tl-surface px-[13px] py-2 text-[13px] font-bold text-tl-brand transition-colors hover:bg-tl-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** A borderless text button ("Clear filters", "Cancel" inside a row). */
export const quietButton = `inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] px-3 py-2 text-sm font-bold text-tl-muted transition-colors hover:bg-tl-bg hover:text-tl-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** A round 44px icon-only button (close, more, refresh). Give it an `aria-label`. */
export const iconButton = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tl-muted transition-colors hover:bg-tl-bg hover:text-tl-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** The red outlined button (Remove, Delete on a row). */
export const dangerGhostButton = `inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] border border-tl-danger/30 bg-tl-surface px-3.5 py-2 text-[13px] font-bold text-tl-danger transition-colors hover:bg-tl-danger-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** The red filled button (the confirm in a destructive sheet). */
export const dangerButton = `inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-tl-danger px-[18px] py-3 text-sm font-bold text-tl-surface transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** A text link with an arrow ("View all →"). */
export const textLink = `inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap rounded-md text-sm font-bold text-tl-link hover:underline ${focusRing}`;

/** The soft shadow every white card wears in the light theme. */
const cardShadow =
  "shadow-[0_1px_2px_rgba(15,27,46,0.04),0_14px_30px_-22px_rgba(15,27,46,0.18)] dark:shadow-none";

/** The white card (radius 22, soft shadow). */
export const card = `rounded-[22px] border border-tl-line bg-tl-surface p-[clamp(18px,2.4vw,24px)] text-tl-ink ${cardShadow}`;

/** The card's frame without padding, for cards whose rows run edge to edge (tables, lists). */
export const cardFrame = `overflow-hidden rounded-[22px] border border-tl-line bg-tl-surface text-tl-ink ${cardShadow}`;

/** The pale tile inside a card (glance tiles, detail fields). */
export const tile = "rounded-2xl border border-tl-line-soft bg-tl-subtle p-4";

/** Page heading (clamp 24-32px, 800). */
export const pageTitle =
  "m-0 text-[clamp(24px,3.4vw,32px)] font-extrabold tracking-[-0.6px] text-tl-ink";

/** The grey line under a page heading. */
export const pageSubtitle = "mt-[5px] text-[15px] text-tl-muted";

/** Card heading (19px, 800). */
export const cardTitle = "text-[19px] font-extrabold tracking-[-0.3px] text-tl-ink";

/** A smaller heading inside a card (15px, 800). */
export const sectionTitle = "text-[15px] font-extrabold text-tl-ink";

/** Small uppercase label. */
export const eyebrow = "text-xs font-extrabold uppercase tracking-[0.07em] text-tl-faint";

/** Page padding and width inside the shell. */
export const pagePad =
  "mx-auto w-full max-w-[1460px] px-[clamp(14px,3vw,26px)] pb-16 pt-[clamp(18px,3vw,28px)]";

/** The vertical rhythm between a page's blocks. */
export const pageStack = "flex flex-col gap-[18px]";

/** A rounded pill (design `pill()`); add a {@link pillTone}. */
export const pill =
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[5px] text-xs font-extrabold";

/** Colour classes for a {@link pill}, by meaning (the design's G, AM, GR, RD, PU pills). */
export const pillTone = {
  success: "bg-tl-success-bg text-tl-success",
  warning: "bg-tl-warning-bg text-tl-warning",
  muted: "bg-tl-track text-tl-muted",
  danger: "bg-tl-danger-bg text-tl-danger",
  accent: "bg-tl-accent-bg text-tl-accent",
  info: "bg-tl-select text-tl-brand",
} as const;

/** A meaning a pill, banner or dot can carry. */
export type Tone = keyof typeof pillTone;

/**
 * A selectable chip (the design's `chip(on)`: class tabs, filter chips).
 *
 * @param on - Whether it is the selected one.
 * @returns The class string.
 */
export function chip(on: boolean): string {
  return `inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border px-[15px] py-2.5 text-sm font-bold transition-colors ${focusRing} ${
    on
      ? "border-tl-control bg-tl-select text-tl-brand"
      : "border-tl-line bg-tl-surface text-tl-muted hover:text-tl-ink"
  }`;
}

/**
 * One option of a segmented control on the grey track (status tabs, view
 * switches).
 *
 * @param on - Whether it is the selected one.
 * @returns The class string.
 */
export function segment(on: boolean): string {
  return `inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-[10px] px-4 py-2 text-sm font-bold transition-colors ${focusRing} ${
    on
      ? "bg-tl-surface text-tl-brand shadow-[0_1px_2px_rgba(15,27,46,0.1),0_1px_1px_rgba(15,27,46,0.04)]"
      : "text-tl-muted hover:text-tl-ink"
  }`;
}

/** The grey track a group of {@link segment}s sits on. */
export const segmentTrack = "flex max-w-full flex-wrap gap-0.5 rounded-[13px] bg-tl-track p-1";

/**
 * One tab of an underlined tab bar (page sections such as Overview /
 * Transactions).
 *
 * @param on - Whether it is the selected tab.
 * @returns The class string.
 */
export function underlineTab(on: boolean): string {
  return `inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-bold transition-colors ${focusRing} ${
    on ? "border-tl-brand text-tl-brand" : "border-transparent text-tl-muted hover:text-tl-ink"
  }`;
}

/** The bar a row of {@link underlineTab}s sits on. */
export const underlineTrack = "flex max-w-full gap-1 overflow-x-auto border-b border-tl-line";

/** A labelled form control (input, select) in a sheet, a form or a toolbar. */
export const fieldControl = `min-h-[46px] w-full rounded-[13px] border border-tl-control bg-tl-surface px-3.5 text-[15px] font-semibold text-tl-ink placeholder:font-medium placeholder:text-tl-faint disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-tl-danger ${focusRing}`;

/** A multi-line {@link fieldControl}. */
export const textareaControl = `min-h-[110px] w-full rounded-[13px] border border-tl-control bg-tl-surface px-3.5 py-3 text-[15px] font-medium leading-relaxed text-tl-ink placeholder:text-tl-faint disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-tl-danger ${focusRing}`;

/** A compact select in a toolbar (filters beside a search box). */
export const selectControl = `min-h-[44px] cursor-pointer rounded-[13px] border border-tl-control bg-tl-surface px-3.5 text-sm font-bold text-tl-ink disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

/** The label above a {@link fieldControl}. */
export const fieldLabel = "text-[13px] font-bold text-tl-muted";

/** The grey hint under a control. */
export const fieldHint = "text-[13px] text-tl-muted";

/** The red message under an invalid control. */
export const fieldError = "text-[13px] font-semibold text-tl-danger";

/** A table that scrolls sideways inside a {@link cardFrame} on narrow screens. */
export const tableScroll = "w-full overflow-x-auto";

/** The `<table>` itself. */
export const table = "w-full border-collapse text-left text-sm";

/** A header cell: small uppercase faint label. */
export const th =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-extrabold uppercase tracking-[0.05em] text-tl-faint";

/** A body cell. */
export const td = "px-4 py-3.5 align-middle text-sm text-tl-body";

/** A body row with the soft divider and hover. */
export const tr = "border-t border-tl-line-soft transition-colors hover:bg-tl-subtle";

/** The header row's background. */
export const theadRow = "bg-tl-subtle";

/** A pulsing grey block for skeletons. */
export const skeletonBlock = "animate-pulse bg-tl-line/70";
