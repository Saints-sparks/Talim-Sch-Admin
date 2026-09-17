"use client";

/**
 * Revenue for the last six months and where the term's fees stand.
 *
 * Rendered only for viewers who govern the school's money; the page does not
 * even fetch the numbers otherwise. Recharts has no Tailwind, so the chart
 * colours are resolved from the active theme rather than from `dark:` classes.
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
import { formatNairaFull, formatNairaShort } from "./format";
import { PanelEmptyState, PanelSkeleton, TrendBadge } from "./primitives";

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

interface FinancialSnapshotProps {
  finance: FinanceSummary | null;
  isLoading: boolean;
  isDark: boolean;
}

export function FinancialSnapshot({ finance, isLoading, isDark }: FinancialSnapshotProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PanelSkeleton minH={300} />
        <PanelSkeleton minH={300} />
      </div>
    );
  }

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
    borderRadius: "8px",
    color: isDark ? "#f1f5f9" : "#1f2937",
    fontSize: "12px",
  };

  const tickColor = isDark ? "#94a3b8" : "#6b7280";
  const gridColor = isDark ? "#334155" : "#f3f4f6";

  const donutData = finance
    ? [
        { name: "Paid", value: finance.feeStatus.paid, color: "#10b981" },
        { name: "Pending", value: finance.feeStatus.pending, color: "#f59e0b" },
        { name: "Overdue", value: finance.feeStatus.overdue, color: "#ef4444" },
      ]
    : [];

  const chartData =
    finance?.monthlyRevenue.map((d) => ({
      ...d,
      shortMonth: d.month.split(" ")[0],
    })) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Revenue Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              Revenue This Month
            </p>
            {finance ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {formatNairaShort(finance.revenueThisMonth)}
                </span>
                <TrendBadge value={finance.monthOverMonthPercent} />
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-400 dark:text-slate-500">—</span>
            )}
          </div>
          <Link
            href="/finance"
            className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0"
          >
            View finance <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={188}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="shortMonth"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
                tickFormatter={(v: number) => `₦${(v / 1_000_000).toFixed(0)}M`}
                width={42}
              />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                formatter={(value: RechartsValue) => [formatNairaFull(toAmount(value)), "Revenue"]}
                cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="amount" fill="#003366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <PanelEmptyState message="No revenue data available" />
        )}
      </div>

      {/* Fee Payment Status Donut */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
            Fee Payment Status
          </p>
          <Link
            href="/fees-management"
            className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View fees <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {finance ? (
          <div className="flex items-center gap-4">
            <div style={{ width: 168, height: 168, flexShrink: 0 }}>
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
                    contentStyle={tooltipStyle}
                    formatter={(value: RechartsValue) => [formatNairaFull(toAmount(value))]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              {donutData.map((item) => {
                const pct =
                  finance.feeStatus.totalExpected > 0
                    ? ((item.value / finance.feeStatus.totalExpected) * 100).toFixed(1)
                    : "0";
                return (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                        {item.name}{" "}
                        <span className="font-normal text-gray-400 dark:text-slate-500">
                          ({pct}%)
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {formatNairaShort(item.value)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                <div className="text-xs text-gray-400 dark:text-slate-500">Total Expected</div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {formatNairaShort(finance.feeStatus.totalExpected)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PanelEmptyState message="No fee data available" />
        )}
      </div>
    </div>
  );
}
