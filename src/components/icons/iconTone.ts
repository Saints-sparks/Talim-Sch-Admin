import { cn } from "@/lib/utils";

/** Props of the icons that tint by state (the sidebar section glyphs). */
export interface IconProps {
  /** An explicit stroke colour (any CSS colour). Wins over the state tint. */
  stroke?: string;
  /** Whether the icon's section is current. */
  isActive?: boolean;
  /** Extra classes for the `<svg>`; a `text-*` class here recolours the icon. */
  className?: string;
}

/** Props of the fixed-colour icons. */
export interface IconClassProps {
  /** Extra classes for the `<svg>`; a `text-*` class here recolours the icon. */
  className?: string;
}

/** The tint of a current section: brand navy, lifted to blue-300 on dark surfaces. */
export const ICON_ACTIVE_CLASS = "text-[#003366] dark:text-blue-300";
/** The tint of an idle section. */
export const ICON_IDLE_CLASS = "text-[#929292]";

/** What an icon needs to draw its strokes. */
export interface IconTone {
  /** Value for every `stroke` attribute: the explicit colour, or `currentColor`. */
  strokeColor: string;
  /** The class for the `<svg>` (carries the colour when `currentColor` is used). */
  svgClassName: string | undefined;
}

/**
 * Resolves how a state-tinted icon is coloured. An explicit `stroke` is used as
 * given; otherwise strokes follow `currentColor` and the `<svg>` carries the
 * light and dark tint as a class, which a caller's `className` can override.
 *
 * @param input - The icon's `stroke`, `isActive` and `className` props.
 * @returns The stroke value and the `<svg>` class.
 */
export function resolveIconTone(input: IconProps): IconTone {
  if (input.stroke) {
    return { strokeColor: input.stroke, svgClassName: input.className };
  }
  return {
    strokeColor: "currentColor",
    svgClassName: cn(input.isActive ? ICON_ACTIVE_CLASS : ICON_IDLE_CLASS, input.className),
  };
}

/**
 * The `<svg>` class of a fixed-colour icon: its default tint, overridable by the
 * caller's `className` (a later `text-*` class wins).
 *
 * @param className - The caller's extra classes.
 * @param defaultTone - The icon's own light (and dark) tint classes.
 * @returns One merged class string.
 */
export function iconClass(className: string | undefined, defaultTone: string): string {
  return cn(defaultTone, className);
}
