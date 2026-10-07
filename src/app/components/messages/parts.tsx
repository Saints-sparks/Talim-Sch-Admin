"use client";

/**
 * Small pieces the Messages screens share, in the tl design system: avatars
 * with a photo or initials on a stable tone, the office badge, a text search
 * box, and the frame of the chat dialogs.
 */
import React, { type ReactNode } from "react";
import { Building2, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fieldControl, focusRing, iconButton, initialsOf, toneClass } from "@/components/tl";

/** Props for {@link PersonAvatar}. */
export interface PersonAvatarProps {
  /** Stable id (a user or room id, else the name), for the tone. */
  id: string;
  /** Full name, for the initials. */
  name: string;
  /** Initials to show instead of the name's own. */
  initials?: string;
  /** Photo URL; the initials show until it loads and when it fails. */
  src?: string | null;
  /** Diameter in px; default 40. */
  size?: number;
  /** Shows the online (green) or offline (grey) dot when set. */
  online?: boolean;
  /** Reads the dot out ("Online" or "Offline") instead of hiding it. */
  announceOnline?: boolean;
}

/**
 * A round avatar: the photo when there is one and it loads, else the
 * initials on the person's stable tone, with an optional online dot.
 * Decorative; the name is always shown beside it.
 *
 * @param props - See {@link PersonAvatarProps}.
 * @param props.id - Stable id.
 * @param props.name - Full name.
 * @param props.initials - Initials instead of the name's.
 * @param props.src - Photo URL.
 * @param props.size - Diameter.
 * @param props.online - Online state for the dot.
 * @param props.announceOnline - Whether the dot is read out.
 * @returns The avatar.
 */
export function PersonAvatar({
  id,
  name,
  initials,
  src,
  size = 40,
  online,
  announceOnline = false,
}: PersonAvatarProps) {
  const dot = Math.max(10, Math.round(size / 3.6));
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <Avatar className="h-full w-full" aria-hidden>
        {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
        <AvatarFallback
          className={`${toneClass(id || name)} bg-tone-bg font-extrabold text-tone-fg`}
          style={{ fontSize: Math.max(11, Math.round(size / 3.1)) }}
        >
          {initials || initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      {online === undefined ? null : (
        <span
          role={announceOnline ? "img" : undefined}
          aria-label={announceOnline ? (online ? "Online" : "Offline") : undefined}
          aria-hidden={announceOnline ? undefined : true}
          style={{ width: dot, height: dot }}
          className={`absolute bottom-0 right-0 rounded-full border-2 border-tl-surface ${online ? "tl-dot-success" : "bg-tl-control"}`}
        />
      )}
    </span>
  );
}

/**
 * The school office's avatar: a building on the warning tone, for office
 * threads (Round 4 §28).
 *
 * @param props - The size.
 * @param props.size - Diameter in px; default 40.
 * @returns The avatar.
 */
export function OfficeAvatar({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-tl-warning-bg text-tl-warning"
    >
      <Building2 style={{ width: Math.round(size / 2.2), height: Math.round(size / 2.2) }} />
    </span>
  );
}

/** Props for {@link TextSearch}. */
export interface TextSearchProps {
  /** The text. */
  value: string;
  /** Called with the new text. */
  onChange: (value: string) => void;
  /** The accessible name ("Search conversations"). */
  label: string;
  /** The placeholder; defaults to the label. */
  placeholder?: string;
  /** Extra classes on the wrapper. */
  className?: string;
  /** Focused when a dialog opens (`Sheet` honours it). */
  autoFocusInSheet?: boolean;
  /** Forwarded to the input. */
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * A search box with a magnifier and a clear button. Unlike the shared
 * `SearchField` it is a plain text input, so it keeps the `textbox` role the
 * Messages tests and the browser suite look it up by.
 *
 * @param props - See {@link TextSearchProps}.
 * @param props.value - The text.
 * @param props.onChange - Change handler.
 * @param props.label - Accessible name.
 * @param props.placeholder - Placeholder.
 * @param props.className - Extra classes.
 * @param props.autoFocusInSheet - Marks it as the sheet's first focus.
 * @param props.inputRef - Ref to the input.
 * @returns The search box.
 */
export function TextSearch({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  autoFocusInSheet = false,
  inputRef,
}: TextSearchProps) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tl-faint"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder ?? label}
        data-autofocus={autoFocusInSheet ? true : undefined}
        className={cn(fieldControl, "min-h-[44px] pl-10 pr-11 text-sm")}
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

/** The dimmed backdrop behind a chat dialog (the tl `Sheet`'s); add a z-index. */
export const dialogOverlay =
  "fixed inset-0 flex items-end justify-center bg-[rgba(15,27,46,0.45)] sm:items-center sm:p-4";

/** A chat dialog's panel: a bottom sheet on phones, a centred card from 640px. Add a max width. */
export const dialogPanel =
  "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-tl-line bg-tl-surface text-tl-ink shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] sm:rounded-[24px]";

/** Props for {@link DialogTitleBar}. */
export interface DialogTitleBarProps {
  /** The heading. */
  title: ReactNode;
  /** The id of the heading, for the dialog's `aria-labelledby`. */
  titleId?: string;
  /** A grey line under the heading. */
  subtitle?: ReactNode;
  /** A control before the heading (Back). */
  leading?: ReactNode;
  /** Closes the dialog. */
  onClose: () => void;
  /** The close button's accessible name; default "Close". */
  closeLabel?: string;
  /** Disables the close button (while saving). */
  closeDisabled?: boolean;
}

/**
 * The title row of a chat dialog: an optional leading control, the heading
 * and its line, and the round close button.
 *
 * @param props - See {@link DialogTitleBarProps}.
 * @param props.title - The heading.
 * @param props.titleId - The heading's id.
 * @param props.subtitle - The line under it.
 * @param props.leading - A control before it.
 * @param props.onClose - Close handler.
 * @param props.closeLabel - The close button's name.
 * @param props.closeDisabled - Whether close is disabled.
 * @returns The row.
 */
export function DialogTitleBar({
  title,
  titleId,
  subtitle,
  leading,
  onClose,
  closeLabel = "Close",
  closeDisabled = false,
}: DialogTitleBarProps) {
  return (
    <div className="flex items-start gap-2 border-b border-tl-line-soft px-5 pb-4 pt-5">
      {leading}
      <div className="min-w-0 flex-1 pt-1">
        <h2 id={titleId} className="text-[19px] font-extrabold leading-tight tracking-[-0.3px] text-tl-ink">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-snug text-tl-muted">{subtitle}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        disabled={closeDisabled}
        className={`${iconButton} -mr-2 -mt-1`}
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

/**
 * The frame of a message bubble: navy with white text for mine, white with a
 * border for everyone else's, the tail corner on the sender's side.
 *
 * @param isMe - Whether it is the viewer's own message.
 * @returns The class string.
 */
export function bubbleFrame(isMe: boolean): string {
  return `group relative rounded-2xl px-3.5 py-[11px] pr-9 ${
    isMe
      ? "rounded-br-[5px] bg-tl-brand-fill text-tl-on-brand"
      : "rounded-bl-[5px] border border-tl-line bg-tl-surface text-tl-ink"
  }`;
}
