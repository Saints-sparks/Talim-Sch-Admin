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
import { Permission } from "@/lib/permissions";
import { CardHeader, card, focusRing, toneClass } from "@/components/tl";

/** Props for {@link QuickLinks}. */
interface QuickLinksProps {
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
}

/**
 * "Quick Links": a card of shortcut tiles, one per area the viewer governs,
 * each with its own stable tone.
 *
 * @param props - See {@link QuickLinksProps}.
 * @param props.can - Permission check.
 * @returns The card, or null when the viewer governs no area.
 */
export function QuickLinks({ can }: QuickLinksProps) {
  const allLinks = [
    {
      label: "Students",
      sub: "Manage students",
      icon: <Users />,
      href: "/users/students",
      permission: Permission.MANAGE_STUDENTS,
    },
    {
      label: "Classes",
      sub: "Manage classes",
      icon: <School />,
      href: "/classes",
      permission: Permission.MANAGE_CLASSES,
    },
    {
      label: "Teachers",
      sub: "Manage teachers",
      icon: <GraduationCap />,
      href: "/users/teachers",
      permission: Permission.MANAGE_TEACHERS,
    },
    {
      label: "Fees",
      sub: "Manage fees",
      icon: <Receipt />,
      href: "/fees-management",
      permission: Permission.MANAGE_FEES,
    },
    {
      label: "Assessments",
      sub: "Create & grade",
      icon: <ClipboardCheck />,
      href: "/assessments",
      permission: Permission.MANAGE_ASSESSMENTS,
    },
    {
      label: "Timetable",
      sub: "Class schedules",
      icon: <CalendarDays />,
      href: "/timetable",
      permission: Permission.MANAGE_TIMETABLE,
    },
    {
      label: "Finance",
      sub: "View finances",
      icon: <Banknote />,
      href: "/finance",
      permission: Permission.MANAGE_FINANCE,
    },
    {
      label: "Leave",
      sub: "Approve leaves",
      icon: <CalendarOff />,
      href: "/leave-requests",
      permission: Permission.MANAGE_LEAVE_REQUESTS,
    },
  ];

  const links = allLinks.filter((l) => can(l.permission));

  if (links.length === 0) return null;

  return (
    <section className={card}>
      <CardHeader title="Quick Links" subtitle="Manage your school operations" />
      <ul className="mt-4 grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))]">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`group flex min-h-[44px] items-center gap-3 rounded-2xl border border-tl-line-soft bg-tl-subtle px-3 py-3 transition-colors hover:border-tl-control hover:bg-tl-select ${focusRing}`}
            >
              <span
                aria-hidden
                className={`${toneClass(link.href)} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tone-bg text-tone-fg [&>svg]:h-5 [&>svg]:w-5`}
              >
                {link.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight text-tl-ink">
                  {link.label}
                </span>
                <span className="mt-0.5 block text-xs leading-tight text-tl-muted">{link.sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
