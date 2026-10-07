import React, { type ReactNode } from "react";
import { card, eyebrow } from "./styles";

/** Icon tile colours per tone. */
const TONE = {
  danger: "bg-tl-danger-bg text-tl-danger",
  info: "bg-tl-select text-tl-brand",
  warning: "bg-tl-warning-bg text-tl-warning",
} as const;

/** Props for {@link StatusScreen}. */
export interface StatusScreenProps {
  /** Sets the icon tile's colours. */
  tone?: keyof typeof TONE;
  /** The icon (decorative). */
  icon: ReactNode;
  /** The small uppercase line above the title ("Error 404"). */
  eyebrowText?: ReactNode;
  /** The page's `h1`. */
  title: ReactNode;
  /** What happened and what to do. */
  description?: ReactNode;
  /** The buttons. */
  actions?: ReactNode;
  /** A small line under the buttons (a reference to quote). */
  footnote?: ReactNode;
}

/**
 * A whole-page message in the portals' card: Access Denied, Page not found,
 * Something went wrong. Centred on the grey canvas, with an icon tile, an
 * eyebrow, the heading, the explanation and the actions.
 *
 * @param props - See {@link StatusScreenProps}.
 * @param props.tone - The icon's colours.
 * @param props.icon - The icon.
 * @param props.eyebrowText - The line above the title.
 * @param props.title - The heading.
 * @param props.description - The explanation.
 * @param props.actions - The buttons.
 * @param props.footnote - The line under the buttons.
 * @returns The screen.
 */
export function StatusScreen({
  tone = "info",
  icon,
  eyebrowText,
  title,
  description,
  actions,
  footnote,
}: StatusScreenProps) {
  return (
    <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center bg-tl-bg px-4 py-10">
      <div className={`${card} w-full max-w-[480px]`}>
        <span
          aria-hidden
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${TONE[tone]} [&>svg]:h-7 [&>svg]:w-7`}
        >
          {icon}
        </span>
        {eyebrowText ? <p className={`${eyebrow} mt-5`}>{eyebrowText}</p> : null}
        <h1
          className={`${eyebrowText ? "mt-1.5" : "mt-5"} text-[26px] font-extrabold tracking-[-0.5px] text-tl-ink`}
        >
          {title}
        </h1>
        {description ? (
          <div className="mt-2 text-[15px] leading-relaxed text-tl-muted">{description}</div>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div> : null}
        {footnote ? (
          <div className="mt-5 border-t border-tl-line-soft pt-4 text-[13px] text-tl-muted">
            {footnote}
          </div>
        ) : null}
      </div>
    </div>
  );
}
