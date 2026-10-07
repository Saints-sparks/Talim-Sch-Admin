"use client";

import React, { type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Inbox, Info } from "lucide-react";
import { card, ghostButton, pagePad, pageStack, skeletonBlock, type Tone } from "./styles";

/** Props for {@link ScreenLoading}. */
export interface ScreenLoadingProps {
  /** What is loading, read out to screen readers ("Loading classes"). */
  label: string;
  /** How many grey card blocks to draw; default 3. */
  blocks?: number;
  /** Height of each block in px; default 120. */
  height?: number;
}

/**
 * The loading state of a card or a list: a few pulsing blocks, announced once
 * as busy so a screen reader says what is happening.
 *
 * @param props - See {@link ScreenLoadingProps}.
 * @param props.label - What is loading.
 * @param props.blocks - How many blocks.
 * @param props.height - Block height.
 * @returns The skeleton.
 */
export function ScreenLoading({ label, blocks = 3, height = 120 }: ScreenLoadingProps) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">{label}</span>
      {Array.from({ length: blocks }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className={`${skeletonBlock} rounded-[22px]`}
          style={{ height }}
        />
      ))}
    </div>
  );
}

/** Props for {@link PageSkeleton}. */
export interface PageSkeletonProps {
  /** What is loading, for screen readers ("Loading payments"). */
  label: string;
  /** Chips or tabs under the heading. */
  chips?: number;
  /** Stat tiles in a row. */
  tiles?: number;
  /** Heights in px of the cards below, in order; default one 420px card. */
  blocks?: readonly number[];
  /** Draw it without the page padding (inside a page that already has it). */
  bare?: boolean;
}

/**
 * Grey blocks in the shape of a page (heading, line, optional chips and
 * tiles, then cards) while it loads, so the shell stays put and the page does
 * not jump when the data lands.
 *
 * @param props - See {@link PageSkeletonProps}.
 * @param props.label - What is loading.
 * @param props.chips - How many chips.
 * @param props.tiles - How many tiles.
 * @param props.blocks - Card heights.
 * @param props.bare - Without page padding.
 * @returns The skeleton.
 */
export function PageSkeleton({
  label,
  chips = 0,
  tiles = 0,
  blocks = [420],
  bare = false,
}: PageSkeletonProps) {
  return (
    <div
      className={`${bare ? "" : pagePad} ${pageStack}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <span className="sr-only">{label}…</span>
      <div aria-hidden className="flex flex-col gap-2.5">
        <div className={`${skeletonBlock} h-9 w-64 max-w-full rounded-lg`} />
        <div className={`${skeletonBlock} h-5 w-[26rem] max-w-full rounded`} />
      </div>
      {chips > 0 ? (
        <div aria-hidden className="flex flex-wrap gap-2">
          {Array.from({ length: chips }).map((_, i) => (
            <div key={i} className={`${skeletonBlock} h-11 w-32 rounded-xl`} />
          ))}
        </div>
      ) : null}
      {tiles > 0 ? (
        <div
          aria-hidden
          className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]"
        >
          {Array.from({ length: tiles }).map((_, i) => (
            <div key={i} className={`${skeletonBlock} h-[84px] rounded-[18px]`} />
          ))}
        </div>
      ) : null}
      {blocks.map((height, i) => (
        <div key={i} aria-hidden className={`${skeletonBlock} rounded-[22px]`} style={{ height }} />
      ))}
    </div>
  );
}

/** Props for {@link ScreenError}. */
export interface ScreenErrorProps {
  /** The bold line; default "We couldn't load this". */
  title?: ReactNode;
  /** The sentence to show (already user-friendly). */
  message: ReactNode;
  /** Called by "Try again". */
  onRetry?: () => void;
  /** True while the retry runs. */
  retrying?: boolean;
  /** "Try again" by default. */
  retryLabel?: string;
}

/**
 * A failed load: the message in a card and a "Try again" button. It is an
 * alert, so it is read out when it appears.
 *
 * @param props - See {@link ScreenErrorProps}.
 * @param props.title - The bold line.
 * @param props.message - What went wrong.
 * @param props.onRetry - Retries the load.
 * @param props.retrying - Whether the retry runs.
 * @param props.retryLabel - The button's words.
 * @returns The error card.
 */
export function ScreenError({
  title = "We couldn't load this",
  message,
  onRetry,
  retrying = false,
  retryLabel = "Try again",
}: ScreenErrorProps) {
  return (
    <div role="alert" className={`${card} flex flex-wrap items-center gap-4`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tl-danger-bg">
        <AlertCircle className="h-5 w-5 text-tl-danger" aria-hidden />
      </span>
      <div className="min-w-[200px] flex-1">
        <p className="text-[15px] font-extrabold text-tl-ink">{title}</p>
        <div className="mt-0.5 text-sm text-tl-body">{message}</div>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} disabled={retrying} className={ghostButton}>
          {retrying ? "Trying again…" : retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Props for {@link EmptyNote}. */
export interface EmptyNoteProps {
  /** The bold line. */
  title: ReactNode;
  /** The explanation under it. */
  children?: ReactNode;
  /** An optional action under the text. */
  action?: ReactNode;
  /** An icon in place of the inbox. */
  icon?: ReactNode;
  /** Less vertical room (inside a small panel). */
  compact?: boolean;
}

/**
 * An empty state inside a card: an icon, a title, a sentence and an
 * optional action.
 *
 * @param props - See {@link EmptyNoteProps}.
 * @param props.title - The bold line.
 * @param props.children - The explanation.
 * @param props.action - An action below.
 * @param props.icon - A different icon.
 * @param props.compact - Less padding.
 * @returns The empty state.
 */
export function EmptyNote({ title, children, action, icon, compact = false }: EmptyNoteProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 px-4 text-center ${compact ? "py-6" : "py-10"}`}
    >
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-tl-track text-tl-faint [&>svg]:h-6 [&>svg]:w-6"
      >
        {icon ?? <Inbox />}
      </span>
      <p className="text-base font-bold text-tl-ink">{title}</p>
      {children ? <div className="max-w-[440px] text-[15px] text-tl-muted">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Background, text and icon per banner tone. */
const BANNER: Record<Tone, { frame: string; icon: React.ElementType }> = {
  info: { frame: "border-tl-control bg-tl-select text-tl-brand", icon: Info },
  success: { frame: "border-tl-success/25 bg-tl-success-bg text-tl-success", icon: CheckCircle2 },
  warning: { frame: "border-tl-warning/25 bg-tl-warning-bg text-tl-warning", icon: AlertTriangle },
  danger: { frame: "border-tl-danger/25 bg-tl-danger-bg text-tl-danger", icon: AlertCircle },
  muted: { frame: "border-tl-line bg-tl-subtle text-tl-muted", icon: Info },
  accent: { frame: "border-tl-accent/25 bg-tl-accent-bg text-tl-accent", icon: Info },
};

/** Props for {@link Banner}. */
export interface BannerProps {
  /** The meaning; sets colour and icon. */
  tone?: Tone;
  /** The bold first line. */
  title?: ReactNode;
  /** The message. */
  children?: ReactNode;
  /** A control on the right ("Review"). */
  action?: ReactNode;
  /** `alert` for problems that should be read out; `status` for news; none by default. */
  role?: "alert" | "status";
  /** Extra classes. */
  className?: string;
}

/**
 * A tinted notice inside a page (a hint, a warning, a success): icon, bold
 * line, message and an optional action.
 *
 * @param props - See {@link BannerProps}.
 * @param props.tone - The meaning.
 * @param props.title - The bold line.
 * @param props.children - The message.
 * @param props.action - The control.
 * @param props.role - The live-region role, if any.
 * @param props.className - Extra classes.
 * @returns The banner.
 */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  role,
  className = "",
}: BannerProps) {
  const { frame, icon: Icon } = BANNER[tone];
  return (
    <div
      role={role}
      className={`flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3.5 ${frame} ${className}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-[180px] flex-1 text-sm">
        {title ? <p className="font-extrabold">{title}</p> : null}
        {children ? (
          <div className={`${title ? "mt-0.5" : ""} leading-relaxed text-tl-body`}>{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
