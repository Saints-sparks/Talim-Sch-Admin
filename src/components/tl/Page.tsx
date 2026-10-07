import React, { type ReactNode } from "react";
import { cardTitle, eyebrow, pagePad, pageStack, pageSubtitle, pageTitle } from "./styles";

/** Props for {@link Page}. */
export interface PageProps {
  /** The page's blocks, stacked with the design's rhythm. */
  children: ReactNode;
  /** Extra classes on the wrapper. */
  className?: string;
  /** The guide target for the page. */
  guide?: string;
}

/**
 * A page inside the shell: the portals' padding and maximum width, and the
 * 18px rhythm between blocks.
 *
 * @param props - See {@link PageProps}.
 * @param props.children - The page.
 * @param props.className - Extra classes.
 * @param props.guide - Guide target.
 * @returns The wrapper.
 */
export function Page({ children, className = "", guide }: PageProps) {
  return (
    <div className={`${pagePad} ${pageStack} ${className}`} data-guide={guide}>
      {children}
    </div>
  );
}

/** Props for {@link PageHeader}. */
export interface PageHeaderProps {
  /** The page's one `h1`. */
  title: ReactNode;
  /** The grey line under it. */
  subtitle?: ReactNode;
  /** A small uppercase line above the title (the section: "People"). */
  eyebrowText?: ReactNode;
  /** Controls on the right (primary action, term picker); they wrap under the title on narrow screens. */
  actions?: ReactNode;
  /** The guide target for the heading block. */
  guide?: string;
}

/**
 * The heading block every page starts with: title, subtitle and actions.
 *
 * @param props - See {@link PageHeaderProps}.
 * @param props.title - The heading.
 * @param props.subtitle - The line under it.
 * @param props.eyebrowText - The line above it.
 * @param props.actions - Controls beside it.
 * @param props.guide - Guide target name.
 * @returns The header.
 */
export function PageHeader({ title, subtitle, eyebrowText, actions, guide }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4" data-guide={guide}>
      <div className="min-w-0">
        {eyebrowText ? <div className={`${eyebrow} mb-1.5`}>{eyebrowText}</div> : null}
        <h1 className={pageTitle}>{title}</h1>
        {subtitle ? <div className={pageSubtitle}>{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

/** Props for {@link CardHeader}. */
export interface CardHeaderProps {
  /** The card's heading. */
  title: ReactNode;
  /** The grey line under it. */
  subtitle?: ReactNode;
  /** Controls on the right ("View all →"). */
  actions?: ReactNode;
  /** Heading level; default 2. */
  level?: 2 | 3;
}

/**
 * The heading row inside a card: title, optional line and actions.
 *
 * @param props - See {@link CardHeaderProps}.
 * @param props.title - The heading.
 * @param props.subtitle - The line under it.
 * @param props.actions - Controls beside it.
 * @param props.level - Heading level.
 * @returns The row.
 */
export function CardHeader({ title, subtitle, actions, level = 2 }: CardHeaderProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Heading className={cardTitle}>{title}</Heading>
        {subtitle ? (
          <p className="mt-1 text-[13px] leading-relaxed text-tl-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
