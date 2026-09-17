"use client";

import React from "react";
import { Label } from "@/components/ui/label";

/** Tailwind colour families the teacher profile panels use. */
export type ProfileTone = "blue" | "emerald" | "amber" | "indigo" | "teal" | "purple";

const headingTones: Record<ProfileTone, string> = {
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300",
  emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
  indigo: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300",
  teal: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300",
  purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300",
};

const circleTones: Record<ProfileTone, string> = {
  blue: "from-blue-500 to-blue-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  indigo: "from-indigo-500 to-indigo-600",
  teal: "from-teal-500 to-teal-600",
  purple: "from-purple-500 to-purple-600",
};

/** A tab heading: tinted icon plus the section title. */
export function ProfileHeading({
  icon: Icon,
  title,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: ProfileTone;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${headingTones[tone]}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
  );
}

/** The gradient circle that heads each tab's left column. */
export function ProfileCircle({
  icon: Icon,
  tone,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: ProfileTone;
  /** Caption above the circle. */
  label: string;
  /** Anything shown beneath the circle. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center space-y-4 order-1 lg:order-1">
      <div className="text-center">
        <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4 block">{label}</Label>
        <div
          className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${circleTones[tone]} rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto`}
        >
          <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
        </div>
        {children}
      </div>
    </div>
  );
}

/** A read-only field in a plain grey box. */
export function PlainField({
  icon: Icon,
  label,
  value,
  mono = false,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3">
        <span
          className={`text-gray-900 dark:text-slate-100 font-medium ${mono ? "font-mono text-sm" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/** A read-only field in a tinted card, with a sub-caption. */
export function AccentField({
  icon: Icon,
  label,
  tone,
  value,
  caption,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: ProfileTone;
  value: React.ReactNode;
  caption?: string;
  className?: string;
}) {
  const card: Record<ProfileTone, string> = {
    blue: "from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-900/30 dark:border-blue-900/40",
    emerald:
      "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/30 dark:border-emerald-900/40",
    amber:
      "from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/20 dark:to-amber-900/30 dark:border-amber-900/40",
    indigo:
      "from-indigo-50 to-indigo-100 border-indigo-200 dark:from-indigo-900/20 dark:to-indigo-900/30 dark:border-indigo-900/40",
    teal: "from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/20 dark:to-teal-900/30 dark:border-teal-900/40",
    purple:
      "from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-900/30 dark:border-purple-900/40",
  };
  const text: Record<ProfileTone, string> = {
    blue: "text-blue-900 dark:text-blue-200",
    emerald: "text-emerald-900 dark:text-emerald-200",
    amber: "text-amber-900 dark:text-amber-200",
    indigo: "text-indigo-900 dark:text-indigo-200",
    teal: "text-teal-900 dark:text-teal-200",
    purple: "text-purple-900 dark:text-purple-200",
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <div className={`bg-gradient-to-r border rounded-lg px-4 py-4 ${card[tone]}`}>
        <div className={`font-semibold text-sm sm:text-base ${text[tone]}`}>{value}</div>
        {caption && <p className={`text-xs sm:text-sm mt-0.5 opacity-80 ${text[tone]}`}>{caption}</p>}
      </div>
    </div>
  );
}

/** "Not recorded" rather than an empty box when a field was never filled in. */
export function orNotRecorded(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  return String(value);
}

export const tabGridClass = "grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8";
export const tabFieldsClass =
  "lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-2";
