"use client";

/**
 * Revenue for the last six months and where the term's fees stand.
 *
 * Rendered only for viewers who govern the school's money; the page does not
 * even fetch the numbers otherwise. Recharts has no Tailwind, so the chart
 * colours are the tl hex values, resolved from the active theme.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { FinanceSummary } from "@/app/services/dashboard.service";
import { CardHeader, card, textLink } from "@/components/tl";
import { formatNairaFull, formatNairaShort } from "./format";
import { PanelEmptyState, PanelLoading, PanelSkeleton, TrendBadge, panelGrid } from "./primitives";

/** What Recharts hands a tooltip formatter. */
type RechartsValue = ValueType | undefined;

/**
 * Reads the naira amount out of a Recharts tooltip value.
 *
 * @param value - The raw tooltip value.
 * @returns The amount as a number, 0 when the point has none.
 */
function toAmount(value: RechartsValue): number {
  if (value === undefined) return 0;
  return Number(Array.isArray(value) ? value[0] : value);
}

/** Props for {@link FinancialSnapshot}. */
interface FinancialSnapshotProps {
  /** The finance summary, or null when it failed or is empty. */
  finance: FinanceSummary | null;
  /** True while it loads. */
  isLoading: boolean;
  /** True in the dark theme, for the chart's strokes and fills. */
  isDark: boolean;
}

/**
 * The chart colours for the active theme (Recharts takes values, not
 * classes): the tl navy, line, muted text and status colours, lifted for the
 * dark theme so every mark stays readable on the dark surface.
 *
 * @param isDark - Whether the dark theme is on.
 * @returns The colours the two charts use.
 */
function chartColours(isDark: boolean) {
  return {
    bar: isDark ? "#7AA7FF" : "#0B2E5E",
    grid: isDark ? "#1E293B" : "#E6EAF2",
    tick: isDark ? "#A3B1C6" : "#5B6B80",
    cursor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,27,46,0.04)",
    paid: isDark ? "#4ADE80" : "#1B7A55",
    pending: "#E0A33B",
    overdue: isDark ? "#F87171" : "#D1573F",
    tooltip: {
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      border: `1px solid ${isDark ? "#334155" : "#E6EAF2"}`,
      borderRadius: "12px",
      color: isDark ? "#E2E8F0" : "#0F1B2E",
      fontSize: "12px",
      fontWeight: 700,
    } as React.CSSProperties,
  };
}

/** The legend dot class for each slice of the fee donut. */
const DOT: Record<string, string> = {
  Paid: "tl-dot-success",
  Pending: "tl-dot-warning",
  Overdue: "tl-dot-danger",
};

/**
 * Two cards: this month's revenue with the last six months as bars, and the
 * term's fees as a paid / pending / overdue donut with its legend.
 *
 * @param props - See {@link FinancialSnapshotProps}.
 * @param props.finance - The numbers.
 * @param props.isLoading - Whether they are loading.
 * @param props.isDark - Whether the dark theme is on.
 * @returns The two cards, or their skeletons.
 */
export function FinancialSnapshot({ finance, isLoading, isDark }: FinancialSnapshotProps) {
  if (isLoading) {
    return (
      <PanelLoading label="Loading the finance snapshot" className={panelGrid}>
        <PanelSkeleton minH={300} />
        <PanelSkeleton minH={300} />
      </PanelLoading>
    );
  }

  const colours = chartColours(isDark);

  const donutData = finance
    ? [
        { name: "Paid", value: finance.feeStatus.paid, color: colours.paid },
        { name: "Pending", value: finance.feeStatus.pending, color: colours.pending },
        { name: "Overdue", value: finance.feeStatus.overdue, color: colours.overdue },
      ]
    : [];

  const chartData =
    finance?.monthlyRevenue.map((d) => ({
      ...d,
      shortMonth: d.month.split(" ")[0],
    })) ?? [];

  return (
    <div className={panelGrid}>
      {/* Revenue bar chart */}
      <section aria-labelledby="dash-revenue-title" className={`${card} flex flex-col gap-4`}>
        <CardHeader
          title={<span id="dash-revenue-title">Revenue This Month</span>}
          actions={
            <Link href="/finance" className={textLink}>
              View finance <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
        {finance ? (
          <div className="-mt-2 flex flex-wrap items-center gap-2.5">
            <span className="text-[28px] font-extrabold tracking-[-0.5px] text-tl-ink tabular-nums">
              {formatNairaShort(finance.revenueThisMonth)}
            </span>
            <TrendBadge value={finance.monthOverMonthPercent} />
          </div>
        ) : (
          <span className="-mt-2 text-[28px] font-extrabold text-tl-faint">—</span>
        )}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={188}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colours.grid} vertical={false} />
              <XAxis
                dataKey="shortMonth"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colours.tick, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: colours.tick, fontSize: 11 }}
                tickFormatter={(v: number) => `₦${(v / 1_000_000).toFixed(0)}M`}
                width={42}
              />
              <RechartsTooltip
                contentStyle={colours.tooltip}
                formatter={(value: RechartsValue) => [formatNairaFull(toAmount(value)), "Revenue"]}
                cursor={{ fill: colours.cursor }}
              />
              <Bar dataKey="amount" fill={colours.bar} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <PanelEmptyState message="No revenue data available" />
        )}
      </section>

      {/* Fee payment status donut */}
      <section aria-labelledby="dash-fees-title" className={`${card} flex flex-col gap-4`}>
        <CardHeader
          title={<span id="dash-fees-title">Fee Payment Status</span>}
          actions={
            <Link href="/fees-management" className={textLink}>
              View fees <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
        {finance ? (
          <div className="flex flex-wrap items-center gap-5">
            <div className="h-[168px] w-[168px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={colours.tooltip}
                    formatter={(value: RechartsValue) => [formatNairaFull(toAmount(value))]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex min-w-[160px] flex-1 flex-col gap-3">
              {donutData.map((item) => {
                const pct =
                  finance.feeStatus.totalExpected > 0
                    ? ((item.value / finance.feeStatus.totalExpected) * 100).toFixed(1)
                    : "0";
                return (
                  <li key={item.name} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[item.name]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-tl-ink">
                        {item.name} <span className="font-semibold text-tl-muted">({pct}%)</span>
                      </div>
                      <div className="text-[13px] text-tl-muted tabular-nums">
                        {formatNairaShort(item.value)}
                      </div>
                    </div>
                  </li>
                );
              })}
              <li className="border-t border-tl-line-soft pt-2.5">
                <div className="text-xs font-extrabold uppercase tracking-[0.05em] text-tl-faint">
                  Total Expected
                </div>
                <div className="mt-0.5 text-base font-extrabold text-tl-ink tabular-nums">
                  {formatNairaShort(finance.feeStatus.totalExpected)}
                </div>
              </li>
            </ul>
          </div>
        ) : (
          <PanelEmptyState message="No fee data available" />
        )}
      </section>
    </div>
  );
}
