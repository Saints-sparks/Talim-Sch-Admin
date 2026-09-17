"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StudentById } from "@/app/services/student.service";

/** One read-only field: an icon, a label and the value in a bordered box. */
export function DetailField({
  icon: Icon,
  label,
  value,
  className = "",
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <div
        className={`px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm sm:text-base ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** The student's avatar and status, repeated down the left of every tab. */
export function StudentIdentityCard({
  student,
  tone,
  badge,
}: {
  student: StudentById;
  /** Tailwind colour family for the fallback avatar and the badge, e.g. "blue". */
  tone: "blue" | "green" | "purple";
  /** Text in the pill under the name. */
  badge: string;
}) {
  const fallbackTone = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  }[tone];
  const badgeTone = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  }[tone];

  return (
    <div className="flex flex-col items-center space-y-4 order-1 lg:order-none">
      <div className="text-center">
        <div className="relative">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-gray-100 dark:ring-slate-700">
            <AvatarImage
              src={student.userId.userAvatar || "/placeholder.svg"}
              alt={`${student.userId.firstName} ${student.userId.lastName}`}
            />
            <AvatarFallback className={`${fallbackTone} text-white text-lg sm:text-2xl font-semibold`}>
              {student.userId.firstName?.[0]}
              {student.userId.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-slate-800 ${
              student.isActive ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="text-center mt-4 space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {student.userId.firstName} {student.userId.lastName}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">Student</p>
          <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium inline-block ${badgeTone}`}>
            {badge}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A tab heading: a tinted icon and the section title. */
export function TabHeading({
  icon: Icon,
  title,
  tone,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: "blue" | "green" | "purple" | "orange";
  subtitle?: string;
}) {
  const tones = {
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300",
    purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300",
    orange: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300",
  }[tone];

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${tones}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/** A date as the browser's locale short date, or "Not specified". */
export function localDate(value?: string): string {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleDateString();
}
