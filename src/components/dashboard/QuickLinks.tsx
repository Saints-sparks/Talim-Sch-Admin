"use client";

/**
 * Shortcuts to the areas this administrator actually governs. A link the
 * viewer's role cannot open is never shown, rather than letting the API refuse
 * them on arrival.
 */

import React from "react";
import Link from "next/link";
import {
  Banknote,
  CalendarDays,
  CalendarOff,
  ClipboardCheck,
  GraduationCap,
  Receipt,
  School,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";

interface QuickLinksProps {
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
}

export function QuickLinks({ can }: QuickLinksProps) {
  const allLinks = [
    {
      label: "Students",
      sub: "Manage students",
      icon: <Users className="w-5 h-5" />,
      href: "/users/students",
      cls: "bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400",
      permission: Permission.MANAGE_STUDENTS,
    },
    {
      label: "Classes",
      sub: "Manage classes",
      icon: <School className="w-5 h-5" />,
      href: "/classes",
      cls: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
      permission: Permission.MANAGE_CLASSES,
    },
    {
      label: "Teachers",
      sub: "Manage teachers",
      icon: <GraduationCap className="w-5 h-5" />,
      href: "/users/teachers",
      cls: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      permission: Permission.MANAGE_TEACHERS,
    },
    {
      label: "Fees",
      sub: "Manage fees",
      icon: <Receipt className="w-5 h-5" />,
      href: "/fees-management",
      cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      permission: Permission.MANAGE_FEES,
    },
    {
      label: "Assessments",
      sub: "Create & grade",
      icon: <ClipboardCheck className="w-5 h-5" />,
      href: "/assessments",
      cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      permission: Permission.MANAGE_ASSESSMENTS,
    },
    {
      label: "Timetable",
      sub: "Class schedules",
      icon: <CalendarDays className="w-5 h-5" />,
      href: "/timetable",
      cls: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
      permission: Permission.MANAGE_TIMETABLE,
    },
    {
      label: "Finance",
      sub: "View finances",
      icon: <Banknote className="w-5 h-5" />,
      href: "/finance",
      cls: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      permission: Permission.MANAGE_FINANCE,
    },
    {
      label: "Leave",
      sub: "Approve leaves",
      icon: <CalendarOff className="w-5 h-5" />,
      href: "/leave-requests",
      cls: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
      permission: Permission.MANAGE_LEAVE_REQUESTS,
    },
  ];

  const links = allLinks.filter((l) => can(l.permission));

  if (links.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Quick Links</h3>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          Manage your school operations
        </span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col items-center gap-2 text-center"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200",
                link.cls
              )}
            >
              {link.icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-tight">
                {link.label}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block leading-tight">
                {link.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
