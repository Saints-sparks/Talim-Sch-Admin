"use client";

import React, { type ReactNode } from "react";
import { Search, X } from "lucide-react";
import {
  fieldControl,
  fieldError,
  fieldHint,
  fieldLabel,
  focusRing,
  pill,
  pillTone,
  type Tone,
} from "./styles";

/** Props for {@link Pill}. */
export interface PillProps {
  /** The meaning; sets the colours. */
  tone?: Tone;
  /** The words. */
  children: ReactNode;
  /** Shows the tone's dot before the words. */
  dot?: boolean;
  /** Extra classes. */
  className?: string;
  /** Hover text. */
  title?: string;
}

/** The dot colour per tone. */
const DOT: Record<Tone, string> = {
  success: "tl-dot-success",
  warning: "tl-dot-warning",
  danger: "tl-dot-danger",
  info: "tl-dot-info",
  accent: "tl-dot-accent",
  muted: "tl-dot-neutral",
};

/**
 * A status pill (the portals' G, AM, GR, RD, PU pills).
 *
 * @param props - See {@link PillProps}.
 * @param props.tone - The meaning.
 * @param props.children - The words.
 * @param props.dot - Whether to show a dot.
 * @param props.className - Extra classes.
 * @param props.title - Hover text.
 * @returns The pill.
 */
export function Pill({ tone = "muted", children, dot = false, className = "", title }: PillProps) {
  return (
    <span title={title} className={`${pill} ${pillTone[tone]} ${className}`}>
      {dot ? <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} /> : null}
      {children}
    </span>
  );
}

/** Props for {@link CountBadge}. */
export interface CountBadgeProps {
  /** How many; nothing is drawn at 0. */
  count: number;
  /** Classes for placement. */
  className?: string;
  /** The accessible text ("3 unread"); when absent the badge is hidden from screen readers. */
  label?: string;
}

/**
 * The amber unread badge (sidebar, bell, lists). Shows "99+" past 99.
 *
 * @param props - See {@link CountBadgeProps}.
 * @param props.count - The number.
 * @param props.className - Placement classes.
 * @param props.label - Accessible text.
 * @returns The badge, or null at zero.
 */
export function CountBadge({ count, className = "", label }: CountBadgeProps) {
  if (!count || count <= 0) return null;
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-tl-badge px-1.5 text-[11px] font-extrabold leading-none text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * A stable tone (0-5) for an id, so a person or class keeps its colour.
 *
 * @param id - Any stable string.
 * @returns The `tl-tone-N` class.
 */
export function toneClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `tl-tone-${Math.abs(hash) % 6}`;
}

/**
 * Up to two initials from a name.
 *
 * @param name - The full name.
 * @returns "AS" for "Ada Student", or "?" when empty.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0]?.slice(0, 2) ?? "");
  return letters.toUpperCase() || "?";
}

/** Props for {@link Avatar}. */
export interface AvatarProps {
  /** Stable id, for the tone. */
  id: string;
  /** Full name, for the initials. */
  name: string;
  /** Photo URL, if any. */
  src?: string | null;
  /** Diameter in px; default 40. */
  size?: number;
}

/**
 * A round avatar: the photo when there is one, else the initials on a stable
 * tone. Decorative; the name is always shown beside it.
 *
 * @param props - See {@link AvatarProps}.
 * @param props.id - Stable id.
 * @param props.name - Full name.
 * @param props.src - Photo URL.
 * @param props.size - Diameter.
 * @returns The avatar.
 */
export function Avatar({ id, name, src, size = 40 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size / 3.1) };
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      style={style}
      className={`${toneClass(id || name)} flex shrink-0 items-center justify-center rounded-full bg-tone-bg font-extrabold text-tone-fg`}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Props for {@link Toggle}. */
export interface ToggleProps {
  /** Whether it is on. */
  checked: boolean;
  /** Called with the new value. */
  onChange: (next: boolean) => void;
  /** The accessible name (the row's label). */
  label: string;
  /** The id of the row's description, for `aria-describedby`. */
  describedBy?: string;
  /** Greyed out and not clickable (while saving). */
  disabled?: boolean;
}

/**
 * The design's switch (50 × 29 track, white knob): a `role="switch"` button,
 * 44px tall to touch, that says on or off to screen readers.
 *
 * @param props - See {@link ToggleProps}.
 * @param props.checked - On or off.
 * @param props.onChange - Called on click.
 * @param props.label - The accessible name.
 * @param props.describedBy - The description's id.
 * @param props.disabled - Whether it is disabled.
 * @returns The switch.
 */
export function Toggle({ checked, onChange, label, describedBy, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-[44px] shrink-0 items-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
    >
      <span
        aria-hidden
        className={`flex h-[29px] w-[50px] rounded-full p-[3px] transition-colors ${checked ? "justify-end bg-tl-brand-fill" : "justify-start bg-tl-control"}`}
      >
        <span className="h-[23px] w-[23px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
      </span>
    </button>
  );
}

/** Props for {@link Field}. */
export interface FieldProps {
  /** The control's id; the hint is `${id}-hint` and the error `${id}-error`. */
  id: string;
  /** The visible label. */
  label: ReactNode;
  /** A lasting line under the control. */
  hint?: ReactNode;
  /** The red message under the control. */
  error?: ReactNode;
  /** Marks the label as required with an asterisk. */
  required?: boolean;
  /**
   * The control. Give it `id`, `aria-invalid={Boolean(error)}` and
   * `aria-describedby={describedByFor(id, hint, error)}`.
   */
  children: ReactNode;
  /** Extra classes on the wrapper. */
  className?: string;
}

/**
 * The ids a field's control should name in `aria-describedby`.
 *
 * @param id - The control's id.
 * @param hint - The hint, if any.
 * @param error - The error, if any.
 * @returns The ids, space-separated, or undefined.
 */
export function describedByFor(
  id: string,
  hint?: ReactNode,
  error?: ReactNode
): string | undefined {
  const ids = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/**
 * A labelled form field: label, the control, a hint and an error, tied
 * together for screen readers.
 *
 * @param props - See {@link FieldProps}.
 * @param props.id - The control's id.
 * @param props.label - The label.
 * @param props.hint - The hint.
 * @param props.error - The error.
 * @param props.required - Whether it is required.
 * @param props.children - The control.
 * @param props.className - Extra classes.
 * @returns The field.
 */
export function Field({ id, label, hint, error, required, children, className = "" }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={fieldLabel}>
        {label}
        {required ? (
          <span aria-hidden className="text-tl-danger">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={fieldError}>
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className={fieldHint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props for {@link SearchField}. */
export interface SearchFieldProps {
  /** The text. */
  value: string;
  /** Called with the new text. */
  onChange: (value: string) => void;
  /** The accessible name and placeholder ("Search tickets"). */
  label: string;
  /** The placeholder; defaults to the label. */
  placeholder?: string;
  /** Extra classes on the wrapper. */
  className?: string;
  /** The input's id. */
  id?: string;
}

/**
 * A search box with a magnifier and a clear button.
 *
 * @param props - See {@link SearchFieldProps}.
 * @param props.value - The text.
 * @param props.onChange - Change handler.
 * @param props.label - Accessible name.
 * @param props.placeholder - Placeholder.
 * @param props.className - Extra classes.
 * @param props.id - Input id.
 * @returns The search box.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  id,
}: SearchFieldProps) {
  return (
    <div className={`relative min-w-[200px] ${className}`}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tl-faint"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder ?? label}
        className={`${fieldControl} min-h-[44px] pl-10 pr-11 text-sm [&::-webkit-search-cancel-button]:hidden`}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className={`absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-tl-faint hover:text-tl-ink ${focusRing}`}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
