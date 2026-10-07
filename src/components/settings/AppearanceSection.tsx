"use client";

import React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/providers/theme-provider";
import { Card, CardHeader, SectionHeader } from "@/components/settings/ui";

const THEME_OPTIONS: Array<{ value: Theme; label: string; desc: string; icon: React.ElementType }> =
  [
    { value: "light", label: "Light", desc: "Clean white interface", icon: Sun },
    { value: "dark", label: "Dark", desc: "Easy on the eyes at night", icon: Moon },
    { value: "system", label: "System", desc: "Follows your device preference", icon: Monitor },
  ];

/**
 * Settings → Appearance: the theme, stored per device.
 *
 * A personal preference, so every admin role may change it.
 */
export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Appearance"
        desc="Choose how Talim School Admin looks on this device."
      />
      <Card>
        <CardHeader title="Theme" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEME_OPTIONS.map(({ value, label, desc, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-tl-brand bg-tl-select"
                    : "border-tl-line hover:border-tl-control hover:bg-tl-bg"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selected ? "bg-tl-brand-fill text-white" : "bg-tl-track text-tl-muted"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${selected ? "text-tl-brand" : "text-tl-body"}`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-tl-faint mt-0.5">{desc}</p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-tl-brand-fill flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
      <Card>
        <div className="px-5 py-4">
          <p className="text-xs text-tl-faint">
            Theme preference is stored locally on this device and does not sync across browsers or
            devices.
          </p>
        </div>
      </Card>
    </div>
  );
}
