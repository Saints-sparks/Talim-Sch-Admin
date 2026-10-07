/**
 * Class groups shared by the fees screens, on the design system's `tl`
 * tokens (`src/components/tl/styles.ts`).
 *
 * The fees screens were written before the design system; keeping their
 * surface, text and control classes in one place means the tabs, tables and
 * forms cannot drift apart. Every value here is a `tl` class, so it follows
 * the light and dark themes without a `dark:` variant.
 */
import {
  card,
  cardFrame,
  fieldControl,
  ghostButton,
  iconButton,
  primaryButton,
  tableScroll,
  th,
  theadRow,
  tr,
} from "@/components/tl/styles";

/** A padded card (the design's white card). */
export const cardClass = card;

/** A card whose rows and tables run edge to edge. */
export const frameClass = cardFrame;

/** Primary heading text. */
export const headingClass = "text-tl-ink";

/** Body text inside cards and table cells. */
export const bodyTextClass = "text-tl-ink";

/** Secondary text: labels, descriptions, empty states. */
export const mutedTextClass = "text-tl-muted";

/** The brand navy, which the tokens lighten on a dark surface. */
export const brandTextClass = "text-tl-brand";

/** The navy primary button. */
export const primaryButtonClass = primaryButton;

/** The outlined secondary button. */
export const secondaryButtonClass = ghostButton;

/** Text input, select and textarea. */
export const inputClass = fieldControl;

/** Table header row. */
export const tableHeadClass = theadRow;

/** Table header cell. */
export const tableHeadCellClass = th;

/** Table body: rows carry their own divider. */
export const tableBodyClass = "";

/** A table body row: soft divider and hover. */
export const tableRowClass = tr;

/** A table body cell. */
export const tableCellClass = "px-4 py-3.5 align-middle text-sm text-tl-body";

/** A table body cell whose text leads the row (a name, an amount). */
export const strongCellClass = "px-4 py-3.5 align-middle text-sm font-bold text-tl-ink";

/** The cell holding a row's icon buttons (44px each, so less padding). */
export const actionsCellClass = "px-3 py-1.5 align-middle";

/** Icon-only row action button (44px, round). */
export const iconButtonClass = iconButton;

/** Wrapper that keeps a wide table scrolling inside its own card. */
export const tableScrollClass = tableScroll;

/** The heading row at the top of a table card. */
export const frameHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-tl-line-soft px-5 py-4";
