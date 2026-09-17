"use client";

/**
 * The six headline numbers.
 *
 * Each card is gated by the permission that governs the page it links to — a
 * sub-administrator who cannot open Fees never sees a fee collection rate, and
 * the query behind it is never sent either (see `useDashboardOverview`).
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BellRing,
  HandCoins,
  School,
  UserCog,
  UserRound,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import type { DashboardSummary, SchoolDashboardData } from "@/app/services/dashboard.service";
import { formatNairaShort } from "./format";
import { CardSkeleton, TrendBadge } from "./primitives";

interface KpiCardsProps {
  base: SchoolDashboardData | null;
  summary: DashboardSummary | null;
  isLoading: boolean;
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
}

interface KpiCardDef {
  label: string;
  value: string;
  sub1?: string;
  sub2?: string;
  trend?: number;
  icon: React.ReactNode;
  iconCls: string;
  href: string;
  /** Undefined means the card is open to every signed-in administrator. */
  permission?: string;
}

export function KpiCards({ base, summary, isLoading, can }: KpiCardsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const allCards: KpiCardDef[] = [
    {
      label: "Total Students",
      value: (summary?.students.total ?? base?.totalStudents ?? 0).toLocaleString(),
      sub1: summary ? `${summary.students.active.toLocaleString()} Active` : undefined,
      sub2: summary ? `${summary.students.inactive} Inactive` : undefined,
      trend: summary?.students.trendPercent,
      icon: <UserRound className="w-4 h-4" />,
      iconCls: "bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400",
      href: "/users/students",
      permission: Permission.MANAGE_STUDENTS,
    },
    {
      label: "Total Teachers",
      value: (summary?.teachers.total ?? base?.totalTeachers ?? 0).toLocaleString(),
      sub1: summary ? `${summary.teachers.formTeachers} Form Teachers` : undefined,
      trend: summary?.teachers.trendPercent,
      icon: <UserCog className="w-4 h-4" />,
      iconCls: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      href: "/users/teachers",
      permission: Permission.MANAGE_TEACHERS,
    },
    {
      label: "Total Classes",
      value: (summary?.classes.total ?? base?.totalClasses ?? 0).toLocaleString(),
      sub1: summary ? `${summary.classes.capacityUtilization}% Capacity` : undefined,
      trend: summary?.classes.trendPercent,
      icon: <School className="w-4 h-4" />,
      iconCls: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
      href: "/classes",
      permission: Permission.MANAGE_CLASSES,
    },
    {
      label: "Fee Collection Rate",
      value: summary ? `${summary.fees.collectionRate.toFixed(1)}%` : "—",
      sub1: summary ? `${formatNairaShort(summary.fees.collectedAmount)} collected` : undefined,
      sub2: summary ? `of ${formatNairaShort(summary.fees.expectedAmount)}` : undefined,
      trend: summary?.fees.trendPercent,
      icon: <HandCoins className="w-4 h-4" />,
      iconCls: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      href: "/fees-management",
      permission: Permission.MANAGE_FEES,
    },
    {
      label: "Wallet Balance",
      value: summary ? formatNairaShort(summary.wallet.balance) : "—",
      icon: <WalletCards className="w-4 h-4" />,
      iconCls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      href: "/finance",
      permission: Permission.MANAGE_FINANCE,
    },
    {
      label: "Notifications",
      value: (summary?.notifications.unreadTotal ?? 0).toLocaleString(),
      sub1: summary ? `${summary.notifications.messages} Messages` : undefined,
      sub2: summary ? `${summary.notifications.alerts} Alerts` : undefined,
      trend: summary?.notifications.trendPercent,
      icon: <BellRing className="w-4 h-4" />,
      iconCls: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
      href: "/messages",
      // Every administrator has notifications of their own.
    },
  ];

  const cards = allCards.filter((c) => !c.permission || can(c.permission));

  if (cards.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center">
        <p className="text-sm text-gray-400 dark:text-slate-500">
          No metrics available for your current permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => router.push(card.href)}
          className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 text-left hover:shadow-md hover:border-[#003366]/20 dark:hover:border-slate-600 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn("p-2 rounded-lg", card.iconCls)}>{card.icon}</div>
            {card.trend !== undefined && <TrendBadge value={card.trend} />}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1 tabular-nums leading-tight">
            {card.value}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 leading-snug">
            {card.label}
          </div>
          {(card.sub1 || card.sub2) && (
            <div className="text-xs text-gray-400 dark:text-slate-500 space-y-0.5 mb-3">
              {card.sub1 && <div>{card.sub1}</div>}
              {card.sub2 && <div>{card.sub2}</div>}
            </div>
          )}
          <div className="text-xs text-[#003366] dark:text-blue-400 font-medium group-hover:underline flex items-center gap-1 mt-3">
            View all <ArrowRight className="w-3 h-3" />
          </div>
        </button>
      ))}
    </div>
  );
}
