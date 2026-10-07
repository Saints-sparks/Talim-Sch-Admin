"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, Theme } from "@/providers/theme-provider";
import { focusRing } from "@/components/tl/styles";

const OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * The theme menu in the top bar: a round 44px button showing the current
 * theme, opening Light, Dark and System. Escape or a click outside closes it.
 *
 * @returns The button and its menu.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const ActiveIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Theme"
        title="Toggle theme"
        className={`flex h-11 w-11 items-center justify-center rounded-full border border-tl-line text-tl-brand transition-colors hover:bg-tl-bg ${focusRing}`}
      >
        <ActiveIcon className="h-[18px] w-[18px]" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-tl-line bg-tl-surface p-1.5 shadow-[0_20px_40px_-20px_rgba(15,27,46,0.35)]"
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-sm transition-colors ${focusRing} ${
                theme === value
                  ? "bg-tl-select font-extrabold text-tl-brand"
                  : "font-semibold text-tl-body hover:bg-tl-bg"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
