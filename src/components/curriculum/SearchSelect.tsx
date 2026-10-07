"use client";

/**
 * A single-select dropdown with a search box, for lists long enough that a
 * plain `<select>` is unusable (every teacher or class in a school), in the
 * design system's field look.
 *
 * Keyboard: type to filter, Up/Down to move, Enter to pick, Escape to close.
 * The button shows the chosen label, so the value is readable without opening.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { fieldControl, fieldLabel } from "@/components/tl";

/** One choice: `id` is what the form stores, `label` what the user reads. */
export interface SearchOption {
  /** What the form stores. */
  id: string;
  /** What the user reads. */
  label: string;
  /** Secondary line, e.g. an email address or grade level. */
  hint?: string;
}

/** Props for {@link SearchSelect}. */
interface SearchSelectProps {
  /** Id for the control, used to label it. */
  id: string;
  /** The visible label. */
  label: string;
  /** The choices. */
  options: SearchOption[];
  /** The selected option's id, or "" for none. */
  value: string;
  /** Called with the chosen id. */
  onChange: (id: string) => void;
  /** True while the options load. */
  isLoading?: boolean;
  /** Shown on the button while loading. */
  loadingLabel?: string;
  /** Shown on the button when there is nothing to choose. */
  emptyLabel?: string;
  /** Shown on the button before a choice, and in the search box. */
  placeholder?: string;
  /** Greyed out and not clickable. */
  disabled?: boolean;
}

/**
 * Renders the labelled combobox.
 *
 * @param props - See {@link SearchSelectProps}.
 * @param props.id - The control's id.
 * @param props.label - The label.
 * @param props.options - The choices.
 * @param props.value - The chosen id.
 * @param props.onChange - Choice handler.
 * @param props.isLoading - Whether the options load.
 * @param props.loadingLabel - Words while loading.
 * @param props.emptyLabel - Words with no options.
 * @param props.placeholder - Words before a choice.
 * @param props.disabled - Whether it is disabled.
 * @returns The control.
 */
export function SearchSelect({
  id,
  label,
  options,
  value,
  onChange,
  isLoading = false,
  loadingLabel = "Loading...",
  emptyLabel = "Nothing to choose from",
  placeholder = "Search...",
  disabled = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.id === value) ?? null;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        (option.hint ?? "").toLowerCase().includes(term)
    );
  }, [options, query]);

  // Close when the click lands outside, so the list never covers the form.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const choose = (option: SearchOption) => {
    onChange(option.id);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filtered[active]) {
      event.preventDefault();
      choose(filtered[active]);
    } else if (event.key === "Escape") {
      // Close the list only, not a sheet around it.
      event.stopPropagation();
      setOpen(false);
    }
  };

  const unavailable = isLoading || options.length === 0;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled || unavailable}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${fieldControl} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selected ? "" : "font-medium text-tl-faint"}`}>
          {isLoading
            ? loadingLabel
            : options.length === 0
              ? emptyLabel
              : (selected?.label ?? placeholder)}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-tl-faint" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-[14px] border border-tl-line bg-tl-surface shadow-[0_18px_40px_-20px_rgba(15,27,46,0.35)]">
          <div className="flex items-center gap-2 border-b border-tl-line-soft px-3.5">
            <Search className="h-4 w-4 shrink-0 text-tl-faint" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="min-h-[44px] w-full bg-transparent text-sm text-tl-ink outline-none placeholder:text-tl-faint"
              aria-label={`Search ${label}`}
            />
          </div>
          <ul role="listbox" aria-label={label} className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3.5 py-3 text-sm text-tl-muted">No match</li>
            )}
            {filtered.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm text-tl-ink ${
                    index === active ? "bg-tl-subtle" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{option.label}</span>
                    {option.hint && (
                      <span className="block truncate text-xs text-tl-muted">{option.hint}</span>
                    )}
                  </span>
                  {option.id === value && (
                    <Check className="h-4 w-4 shrink-0 text-tl-brand" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
