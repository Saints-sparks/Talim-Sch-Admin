"use client";

/**
 * Small pieces the people pages share in the tl look: the detail tile, the
 * back button, the profile header card, the section card, the roster grid
 * and the profile skeleton and error card.
 */

import React, { type ReactNode } from "react";
import { AlertTriangle, ChevronLeft, UserRound } from "lucide-react";
import {
  CardHeader,
  StatusScreen,
  card,
  eyebrow,
  ghostButton,
  pagePad,
  pageStack,
  primaryButton,
  quietButton,
  skeletonBlock,
  tile,
} from "@/components/tl";

/** The grid roster cards sit in: as many 240px-plus columns as fit. */
export const rosterGrid =
  "grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]";

/** The grid detail tiles sit in: as many 240px-plus columns as fit. */
export const tileGrid = "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]";

/** Props for {@link DetailTile}. */
export interface DetailTileProps {
  /** The small uppercase label. */
  label: ReactNode;
  /** The value. */
  value: ReactNode;
  /** A small icon before the label (decorative). */
  icon?: React.ComponentType<{ className?: string }>;
  /** A grey line under the value. */
  hint?: ReactNode;
  /** Monospace value (ids, codes). */
  mono?: boolean;
  /** Extra classes (`sm:col-span-2`). */
  className?: string;
}

/**
 * One read-only field: a pale tile with a small uppercase label over the
 * value (the portals' detail `tile`).
 *
 * @param props - See {@link DetailTileProps}.
 * @param props.label - The label.
 * @param props.value - The value.
 * @param props.icon - The icon.
 * @param props.hint - The line under the value.
 * @param props.mono - Monospace value.
 * @param props.className - Extra classes.
 * @returns The tile.
 */
export function DetailTile({ label, value, icon: Icon, hint, mono, className = "" }: DetailTileProps) {
  return (
    <div className={`${tile} min-w-0 ${className}`}>
      <div className={`${eyebrow} flex items-center gap-1.5`}>
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
        {label}
      </div>
      <div
        className={`mt-1.5 break-words text-[15px] font-bold text-tl-ink ${mono ? "font-mono text-sm" : ""}`}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-[13px] text-tl-muted">{hint}</div> : null}
    </div>
  );
}

/**
 * The "‹ Teachers" button above a profile or editor.
 *
 * @param props - The words and the handler.
 * @param props.label - Where it goes back to.
 * @param props.onClick - Goes back.
 * @returns The button.
 */
export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${quietButton} -ml-3`}>
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

/** Props for {@link SectionCard}. */
export interface SectionCardProps {
  /** The card's heading. */
  title: ReactNode;
  /** The grey line under it. */
  subtitle?: ReactNode;
  /** Controls beside the heading. */
  actions?: ReactNode;
  /** The card's body. */
  children: ReactNode;
  /** Extra classes on the card. */
  className?: string;
}

/**
 * A titled card: heading row, then the body.
 *
 * @param props - See {@link SectionCardProps}.
 * @param props.title - The heading.
 * @param props.subtitle - The line under it.
 * @param props.actions - Controls beside it.
 * @param props.children - The body.
 * @param props.className - Extra classes.
 * @returns The card.
 */
export function SectionCard({ title, subtitle, actions, children, className = "" }: SectionCardProps) {
  return (
    <section className={`${card} ${className}`}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Props for {@link ProfileHeaderCard}. */
export interface ProfileHeaderCardProps {
  /** The avatar. */
  avatar: ReactNode;
  /** The person's name; the page's `h1`. */
  name: ReactNode;
  /** A small uppercase line above the name ("Student", "Teacher"). */
  eyebrowText?: ReactNode;
  /** A grey line under the name (ID, email). */
  meta?: ReactNode;
  /** Status pills. */
  pills?: ReactNode;
  /** Buttons on the right. */
  actions?: ReactNode;
}

/**
 * The header card of a person's profile: avatar, name, a line of detail, the
 * status pills and the actions.
 *
 * @param props - See {@link ProfileHeaderCardProps}.
 * @param props.avatar - The avatar.
 * @param props.name - The name.
 * @param props.eyebrowText - The line above it.
 * @param props.meta - The line under it.
 * @param props.pills - The pills.
 * @param props.actions - The buttons.
 * @returns The card.
 */
export function ProfileHeaderCard({
  avatar,
  name,
  eyebrowText,
  meta,
  pills,
  actions,
}: ProfileHeaderCardProps) {
  return (
    <section className={`${card} flex flex-wrap items-center gap-4`}>
      <div className="shrink-0">{avatar}</div>
      <div className="min-w-[200px] flex-1">
        {eyebrowText ? <div className={eyebrow}>{eyebrowText}</div> : null}
        <h1 className="mt-1 break-words text-[clamp(22px,3vw,28px)] font-extrabold tracking-[-0.5px] text-tl-ink">
          {name}
        </h1>
        {meta ? <div className="mt-1 text-sm text-tl-muted">{meta}</div> : null}
        {pills ? <div className="mt-2.5 flex flex-wrap gap-1.5">{pills}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </section>
  );
}

/**
 * A person's profile or editor while it loads: the back button, the header
 * card and two cards of tiles, in pulsing grey.
 *
 * @param props - What is loading.
 * @param props.label - Read to screen readers ("Loading the teacher's profile").
 * @returns The skeleton.
 */
export function ProfileSkeleton({ label }: { label: string }) {
  return (
    <div className={`${pagePad} ${pageStack}`} role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div aria-hidden className={`${skeletonBlock} h-11 w-32 rounded-xl`} />
      <div aria-hidden className={`${card} flex items-center gap-4`}>
        <div className={`${skeletonBlock} h-20 w-20 rounded-full`} />
        <div className="flex flex-1 flex-col gap-2.5">
          <div className={`${skeletonBlock} h-7 w-56 max-w-full rounded-lg`} />
          <div className={`${skeletonBlock} h-4 w-40 max-w-full rounded`} />
          <div className={`${skeletonBlock} h-6 w-24 rounded-full`} />
        </div>
      </div>
      <div aria-hidden className={`${skeletonBlock} h-12 w-[28rem] max-w-full rounded-[13px]`} />
      <div aria-hidden className={`${card} grid gap-3 sm:grid-cols-2`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${skeletonBlock} h-[74px] rounded-2xl`} />
        ))}
      </div>
    </div>
  );
}

/** Props for {@link ProfileError}. */
export interface ProfileErrorProps {
  /** The heading. */
  title: string;
  /** What went wrong, in the user's words. */
  message: string;
  /** True for "not found": a person icon instead of the alert. */
  notFound?: boolean;
  /** The back button's words ("Back to Teachers"). */
  backLabel: string;
  /** Goes back to the roster. */
  onBack: () => void;
  /** Retries the request, when retrying could help. */
  onRetry?: () => void;
}

/**
 * A full-page failure for a profile or editor, in the portals' status card.
 *
 * @param props - See {@link ProfileErrorProps}.
 * @param props.title - The heading.
 * @param props.message - What went wrong.
 * @param props.notFound - Whether the person was not found.
 * @param props.backLabel - The back button's words.
 * @param props.onBack - Back handler.
 * @param props.onRetry - Retry handler.
 * @returns The status screen.
 */
export function ProfileError({
  title,
  message,
  notFound = false,
  backLabel,
  onBack,
  onRetry,
}: ProfileErrorProps) {
  return (
    <StatusScreen
      tone={notFound ? "info" : "danger"}
      icon={notFound ? <UserRound /> : <AlertTriangle />}
      title={title}
      description={message}
      actions={
        <>
          {onRetry ? (
            <button type="button" onClick={onRetry} className={ghostButton}>
              Try Again
            </button>
          ) : null}
          <button type="button" onClick={onBack} className={primaryButton}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </button>
        </>
      }
    />
  );
}
