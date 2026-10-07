"use client";

import React, { useRef, type ReactNode } from "react";
import { chip, segment, segmentTrack, underlineTab, underlineTrack } from "./styles";

/** One option of a {@link Tabs}, {@link Segmented} or {@link ChipGroup}. */
export interface TabOption<V extends string> {
  /** The value it selects. */
  value: V;
  /** The words on it. */
  label: ReactNode;
  /** A count shown after the label (status tabs). */
  count?: number;
  /** Hover text. */
  tip?: string;
  /** Not selectable. */
  disabled?: boolean;
}

/**
 * The small count after a tab's label.
 *
 * @param props - The count and whether its tab is selected.
 * @param props.count - The number.
 * @param props.on - Whether the tab is selected.
 * @returns The count.
 */
function TabCount({ count, on }: { count: number; on: boolean }) {
  return (
    <span
      className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${
        on ? "bg-tl-brand-fill text-tl-on-brand" : "bg-tl-track text-tl-muted"
      }`}
    >
      {count > 999 ? "999+" : count}
    </span>
  );
}

/** Props for {@link Tabs}. */
export interface TabsProps<V extends string> {
  /** The tabs, in order. */
  options: readonly TabOption<V>[];
  /** The selected tab. */
  value: V;
  /** Called with the tab chosen. */
  onChange: (value: V) => void;
  /** The tab list's accessible name ("Payments sections"). */
  label: string;
  /** `underline` (page sections, default) or `segmented` (the grey track). */
  variant?: "underline" | "segmented";
  /** Prefix for the tab ids; a tab's id is `${idPrefix}-tab-${value}` and it controls `${idPrefix}-panel`. */
  idPrefix?: string;
}

/**
 * A real tab list (`role="tablist"`, `aria-selected`, arrow keys move between
 * tabs) in the underlined or segmented look. Render the selected panel with
 * `role="tabpanel"` and `id={`${idPrefix}-panel`}`.
 *
 * @param props - See {@link TabsProps}.
 * @param props.options - The tabs.
 * @param props.value - The selected tab.
 * @param props.onChange - Selection handler.
 * @param props.label - Accessible name.
 * @param props.variant - Look.
 * @param props.idPrefix - Id prefix.
 * @returns The tab list.
 */
export function Tabs<V extends string>({
  options,
  value,
  onChange,
  label,
  variant = "underline",
  idPrefix = "tl",
}: TabsProps<V>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.filter((o) => !o.disabled);

  /**
   * Arrow keys, Home and End move the selection along the enabled tabs.
   *
   * @param event - The key press on a tab.
   * @param index - The tab's position among all options.
   */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const at = enabled.findIndex((o) => o.value === options[index].value);
    let next = -1;
    if (event.key === "ArrowRight") next = (at + 1) % enabled.length;
    else if (event.key === "ArrowLeft") next = (at - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = enabled[next];
    onChange(target.value);
    refs.current[options.indexOf(target)]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={variant === "segmented" ? segmentTrack : underlineTrack}
    >
      {options.map((option, index) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${option.value}`}
            aria-selected={on}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={on ? 0 : -1}
            title={option.tip}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`${variant === "segmented" ? segment(on) : underlineTab(on)} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {option.label}
            {typeof option.count === "number" ? <TabCount count={option.count} on={on} /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Props for {@link Segmented} and {@link ChipGroup}. */
export interface ChoiceGroupProps<V extends string> {
  /** The choices, in order. */
  options: readonly TabOption<V>[];
  /** The chosen one. */
  value: V;
  /** Called with the choice. */
  onChange: (value: V) => void;
  /** The group's accessible name ("Show requests that are"). */
  label: string;
  /** Extra classes on the group. */
  className?: string;
}

/**
 * A segmented filter: toggle buttons (`aria-pressed`) on the grey track, in a
 * named group. Use it for a filter over one list; use {@link Tabs} for page
 * sections.
 *
 * @param props - See {@link ChoiceGroupProps}.
 * @param props.options - The choices.
 * @param props.value - The chosen one.
 * @param props.onChange - Selection handler.
 * @param props.label - Accessible name.
 * @param props.className - Extra classes.
 * @returns The group.
 */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: ChoiceGroupProps<V>) {
  return (
    <div role="group" aria-label={label} className={`${segmentTrack} ${className}`}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            title={option.tip}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`${segment(on)} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {option.label}
            {typeof option.count === "number" ? <TabCount count={option.count} on={on} /> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A row of filter chips (`aria-pressed`), the portals' class and subject
 * chips.
 *
 * @param props - See {@link ChoiceGroupProps}.
 * @param props.options - The chips.
 * @param props.value - The chosen one.
 * @param props.onChange - Selection handler.
 * @param props.label - Accessible name.
 * @param props.className - Extra classes.
 * @returns The group.
 */
export function ChipGroup<V extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: ChoiceGroupProps<V>) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            title={option.tip}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`${chip(on)} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {option.label}
            {typeof option.count === "number" ? <TabCount count={option.count} on={on} /> : null}
          </button>
        );
      })}
    </div>
  );
}
