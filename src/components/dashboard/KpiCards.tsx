"use client";

/**
 * The six headline numbers.
 *
 * Each card is gated by the permission that governs the page it links to — a
 * sub-administrator who cannot open Fees never sees a fee collection rate, and
 * the query behind it is never sent either (see `useDashboardOverview`).
 */

import React from "react";
import { BellRing, HandCoins, School, UserCog, UserRound, WalletCards } from "lucide-react";
import { Permission } from "@/lib/permissions";
import type { DashboardSummary, SchoolDashboardData } from "@/app/services/dashboard.service";
import { EmptyNote, StatGrid, StatTile, card } from "@/components/tl";
import { formatNairaShort } from "./format";
import { CardSkeleton, PanelLoading, TrendBadge } from "./primitives";

/** Props for {@link KpiCards}. */
interface KpiCardsProps {
  /** Counts that need no extra permission. */
  base: SchoolDashboardData | null;
  /** The dashboard summary, once loaded. */
  summary: DashboardSummary | null;
  /** True while the base read loads. */
  isLoading: boolean;
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
}

/** One headline tile. */
interface KpiCardDef {
  label: string;
  value: string;
  sub1?: string;
  sub2?: string;
  trend?: number;
  icon: React.ReactNode;
  href: string;
  /** Undefined means the card is open to every signed-in administrator. */
  permission?: string;
}

/**
 * The dashboard's headline tiles, each shown only to an admin who may open the
 * page it links to. Each tile is a link to that page. The wallet tile says it
 * holds online payments only.
 *
 * @param props - See `KpiCardsProps`.
 * @param props.base - Counts that need no extra permission.
 * @param props.summary - The dashboard summary, once loaded.
 * @param props.isLoading - True while the summary loads.
 * @param props.can - Permission check for the signed-in admin.
 * @returns The tiles.
 */
export function KpiCards({ base, summary, isLoading, can }: KpiCardsProps) {
  if (isLoading) {
    return (
      <PanelLoading label="Loading key figures">
        <StatGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </StatGrid>
      </PanelLoading>
    );
  }

  const allCards: KpiCardDef[] = [
    {
      label: "Total Students",
      value: (summary?.students.total ?? base?.totalStudents ?? 0).toLocaleString(),
      sub1: summary ? `${summary.students.active.toLocaleString()} Active` : undefined,
      sub2: summary ? `${summary.students.inactive} Inactive` : undefined,
      trend: summary?.students.trendPercent,
      icon: <UserRound />,
      href: "/users/students",
      permission: Permission.MANAGE_STUDENTS,
    },
    {
      label: "Total Teachers",
      value: (summary?.teachers.total ?? base?.totalTeachers ?? 0).toLocaleString(),
      sub1: summary ? `${summary.teachers.formTeachers} Form Teachers` : undefined,
      trend: summary?.teachers.trendPercent,
      icon: <UserCog />,
      href: "/users/teachers",
      permission: Permission.MANAGE_TEACHERS,
    },
    {
      label: "Total Classes",
      value: (summary?.classes.total ?? base?.totalClasses ?? 0).toLocaleString(),
      sub1: summary ? `${summary.classes.capacityUtilization}% Capacity` : undefined,
      trend: summary?.classes.trendPercent,
      icon: <School />,
      href: "/classes",
      permission: Permission.MANAGE_CLASSES,
    },
    {
      label: "Fee Collection Rate",
      value: summary ? `${summary.fees.collectionRate.toFixed(1)}%` : "—",
      sub1: summary ? `${formatNairaShort(summary.fees.collectedAmount)} collected` : undefined,
      sub2: summary ? `of ${formatNairaShort(summary.fees.expectedAmount)}` : undefined,
      trend: summary?.fees.trendPercent,
      icon: <HandCoins />,
      href: "/fees-management",
      permission: Permission.MANAGE_FEES,
    },
    {
      label: "Wallet Balance",
      value: summary ? formatNairaShort(summary.wallet.balance) : "—",
      // Manual payments and confirmed bank transfers don't credit the wallet.
      sub1: summary ? "Online payments only" : undefined,
      icon: <WalletCards />,
      href: "/finance",
      permission: Permission.MANAGE_FINANCE,
    },
    {
      label: "Notifications",
      value: (summary?.notifications.unreadTotal ?? 0).toLocaleString(),
      sub1: summary ? `${summary.notifications.messages} Messages` : undefined,
      sub2: summary ? `${summary.notifications.alerts} Alerts` : undefined,
      trend: summary?.notifications.trendPercent,
      icon: <BellRing />,
      href: "/notifications",
      // Every administrator has notifications of their own (the page is open to all).
    },
  ];

  const cards = allCards.filter((c) => !c.permission || can(c.permission));

  if (cards.length === 0) {
    return (
      <div className={card}>
        <EmptyNote compact title="No metrics available for your current permissions." />
      </div>
    );
  }

  return (
    <StatGrid label="Key figures">
      {cards.map((tile) => (
        <StatTile
          key={tile.label}
          href={tile.href}
          label={tile.label}
          value={<span className="tabular-nums">{tile.value}</span>}
          icon={tile.icon}
          tip={`View all: ${tile.label}`}
          hint={
            tile.sub1 || tile.sub2 || tile.trend !== undefined ? (
              <span className="flex flex-col gap-1">
                {tile.sub1 || tile.sub2 ? (
                  <span>{[tile.sub1, tile.sub2].filter(Boolean).join(" · ")}</span>
                ) : null}
                {tile.trend !== undefined ? <TrendBadge value={tile.trend} /> : null}
              </span>
            ) : undefined
          }
        />
      ))}
    </StatGrid>
  );
}
