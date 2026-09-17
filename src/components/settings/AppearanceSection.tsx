"use client";

import React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/providers/theme-provider";
import { Card, CardHeader, SectionHeader } from "@/components/settings/ui";

const THEME_OPTIONS: Array<{ value: Theme; label: string; desc: string; icon: React.ElementType }> = [
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
      <SectionHeader title="Appearance" desc="Choose how Talim School Admin looks on this device." />
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
                    ? "border-[#003366] dark:border-blue-500 bg-[#EBF0F7] dark:bg-slate-700"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selected
                      ? "bg-[#003366] dark:bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${selected ? "text-[#003366] dark:text-blue-400" : "text-gray-700 dark:text-slate-200"}`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-[#003366] dark:bg-blue-600 flex items-center justify-center">
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
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Theme preference is stored locally on this device and does not sync across browsers or
            devices.
          </p>
        </div>
      </Card>
    </div>
  );
}
