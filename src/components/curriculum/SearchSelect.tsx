"use client";

/**
 * A single-select dropdown with a search box, for lists long enough that a
 * plain `<select>` is unusable (every teacher or class in a school).
 *
 * Keyboard: type to filter, Up/Down to move, Enter to pick, Escape to close.
 * The button shows the chosen label, so the value is readable without opening.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

/** One choice: `id` is what the form stores, `label` what the user reads. */
export interface SearchOption {
  id: string;
  label: string;
  /** Secondary line, e.g. an email address or grade level. */
  hint?: string;
}

interface SearchSelectProps {
  /** Id for the control, used to label it. */
  id: string;
  label: string;
  options: SearchOption[];
  /** The selected option's id, or "" for none. */
  value: string;
  onChange: (id: string) => void;
  isLoading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Renders the labelled combobox.
 *
 * @param props - See {@link SearchSelectProps}.
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
        option.label.toLowerCase().includes(term) || (option.hint ?? "").toLowerCase().includes(term),
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
      setOpen(false);
    }
  };

  const unavailable = isLoading || options.length === 0;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1.5">
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled || unavailable}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={selected ? "" : "text-gray-400 dark:text-slate-500"}>
          {isLoading ? loadingLabel : options.length === 0 ? emptyLabel : selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-slate-100 outline-none"
              aria-label={`Search ${label}`}
            />
          </div>
          <ul role="listbox" aria-label={label} className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No match</li>
            )}
            {filtered.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                    index === active ? "bg-gray-50 dark:bg-slate-800" : ""
                  } text-gray-900 dark:text-slate-100`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.hint && (
                      <span className="block truncate text-xs text-gray-500 dark:text-slate-400">{option.hint}</span>
                    )}
                  </span>
                  {option.id === value && <Check className="h-4 w-4 shrink-0 text-[#003366] dark:text-blue-400" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
