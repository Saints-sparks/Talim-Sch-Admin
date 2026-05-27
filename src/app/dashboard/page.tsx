"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserRound,
  UserRoundPlus,
  UserCog,
  GraduationCap,
  School,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CreditCard,
  Megaphone,
  ChevronRight,
  RefreshCw,
  Banknote,
  Activity,
  ArrowLeftRight,
  Clock,
  UserMinus,
  CalendarOff,
  ClipboardCheck,
  CalendarDays,
  BookMarked,
  BarChart3,
  AlertCircle,
  ShieldAlert,
  HandCoins,
  WalletCards,
  BellRing,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { useEnhancedDashboard } from "@/hooks/useDashboard";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import SetupProgressWidget from "@/components/SetupProgressWidget";
import type {
  SchoolDashboardData,
  DashboardSummary,
  FinanceSummary,
  AcademicSummary,
  PendingActionsData,
  RecentPayment,
  RecentAnnouncement,
} from "@/app/services/dashboard.service";

// ==================== Helpers ====================

function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatNairaFull(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ==================== Shared UI Primitives ====================

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      )}
    >
      {positive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function EmptyState({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-10"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-2">
        <Activity className="w-4 h-4 text-gray-400 dark:text-slate-500" />
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

// ==================== Skeleton Components ====================

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="w-14 h-5 bg-gray-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="w-16 h-7 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
      <div className="w-24 h-3 bg-gray-100 dark:bg-slate-700 rounded mb-1.5" />
      <div className="w-20 h-3 bg-gray-100 dark:bg-slate-700 rounded mb-4" />
      <div className="w-16 h-3 bg-gray-100 dark:bg-slate-700 rounded" />
    </div>
  );
}

function PanelSkeleton({ minH = 280 }: { minH?: number }) {
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse"
      style={{ minHeight: minH }}
    >
      <div className="w-36 h-4 bg-gray-200 dark:bg-slate-700 rounded mb-5" />
      <div className="bg-gray-100 dark:bg-slate-700 rounded-lg flex-1" style={{ height: minH - 80 }} />
    </div>
  );
}

// ==================== Sub-admin Access Banner ====================

function SubAdminBanner({ permissions }: { permissions: string[] }) {
  const LABEL_MAP: Record<string, string> = {
    "manage:classes":        "Classes",
    "manage:curriculum":     "Curriculum",
    "manage:assessments":    "Assessments",
    "manage:timetable":      "Timetable",
    "manage:fees":           "Fees",
    "manage:payments":       "Payments",
    "manage:finance":        "Finance",
    "manage:students":       "Students",
    "manage:teachers":       "Teachers",
    "manage:parents":        "Parents",
    "manage:announcements":  "Announcements",
    "manage:leave_requests": "Leave Requests",
    "manage:transit":        "Transit",
    "manage:messages":       "Messages",
    "manage:settings":       "Settings",
  };

  if (permissions.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/40 px-4 py-3 flex items-center gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Your account has no permissions assigned yet. Contact your school administrator to grant you access.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-[#003366] dark:text-blue-400" />
        <p className="text-xs font-semibold text-[#003366] dark:text-blue-400 uppercase tracking-wide">
          Sub-Administrator · Your Access
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {permissions.map((p) => (
          <span
            key={p}
            className="text-xs bg-[#003366]/10 dark:bg-blue-900/30 text-[#003366] dark:text-blue-300 px-2 py-0.5 rounded-full font-medium"
          >
            {LABEL_MAP[p] ?? p}
          </span>
        ))}
      </div>
    </div>
  );
}

// ==================== Section 1: KPI Cards ====================

interface KpiCardsProps {
  base: SchoolDashboardData | null;
  summary: DashboardSummary | null;
  isLoading: boolean;
  hasPermission: (p: string) => boolean;
  isFullAdmin: boolean;
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
  permission?: string; // undefined = always show
}

function KpiCards({ base, summary, isLoading, hasPermission, isFullAdmin }: KpiCardsProps) {
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
      // Notifications are always visible
    },
  ];

  // Full admins see all cards; sub-admins only see cards they have permission for
  const cards = allCards.filter(
    (c) => !c.permission || isFullAdmin || hasPermission(c.permission)
  );

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
      {cards.map((card, i) => (
        <button
          key={i}
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

// ==================== Section 2: Financial Snapshot ====================

interface FinancialSnapshotProps {
  finance: FinanceSummary | null;
  isLoading: boolean;
  isDark: boolean;
  hasPermission: (p: string) => boolean;
  isFullAdmin: boolean;
}

function FinancialSnapshot({ finance, isLoading, isDark, hasPermission, isFullAdmin }: FinancialSnapshotProps) {
  const canViewFinance = isFullAdmin ||
    hasPermission(Permission.MANAGE_FEES) ||
    hasPermission(Permission.MANAGE_FINANCE) ||
    hasPermission(Permission.MANAGE_PAYMENTS);

  if (!canViewFinance) return null;
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

  const chartData = finance?.monthlyRevenue.map((d) => ({
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
                formatter={(value: any) => [formatNairaFull(value as number), "Revenue"]}
                cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="amount" fill="#003366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No revenue data available" />
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
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any) => [formatNairaFull(value as number)]}
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
          <EmptyState message="No fee data available" />
        )}
      </div>
    </div>
  );
}

// ==================== Section 3: Academic Activity ====================

interface AcademicActivityProps {
  academic: AcademicSummary | null;
  base: SchoolDashboardData | null;
  isLoading: boolean;
  hasPermission: (p: string) => boolean;
  isFullAdmin: boolean;
}

function AcademicActivity({ academic, base, isLoading, hasPermission, isFullAdmin }: AcademicActivityProps) {
  const canViewAcademics = isFullAdmin ||
    hasPermission(Permission.MANAGE_CLASSES) ||
    hasPermission(Permission.MANAGE_CURRICULUM) ||
    hasPermission(Permission.MANAGE_ASSESSMENTS) ||
    hasPermission(Permission.MANAGE_TIMETABLE);

  if (!canViewAcademics) return null;
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PanelSkeleton minH={220} />
        <PanelSkeleton minH={220} />
        <PanelSkeleton minH={220} />
      </div>
    );
  }

  const distribution =
    academic?.studentDistribution?.map((d) => ({
      className: d.className,
      count: d.count,
    })) ??
    base?.studentDistribution?.map((d) => ({
      className: d.className,
      count: d.studentCount,
    })) ??
    [];

  const topClasses = distribution.slice(0, 5);
  const maxCount = topClasses.length > 0 ? Math.max(...topClasses.map((c) => c.count)) : 1;
  const term = academic?.currentTerm;
  const assessments = academic?.assessments;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Term Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
          Current Term Progress
        </h3>
        {term ? (
          <>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
              {term.name} · {term.academicYear}
            </p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                {term.elapsedPercent}%
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-500">Elapsed</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-[#003366] dark:bg-blue-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(term.elapsedPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mb-4">
              <span>
                Start:{" "}
                {new Date(term.startDate).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>
                End:{" "}
                {new Date(term.endDate).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#003366] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg w-fit">
              <Clock className="w-3.5 h-3.5" />
              {term.daysRemaining} days remaining
            </div>
          </>
        ) : (
          <EmptyState message="No term data available" compact />
        )}
      </div>

      {/* Assessments Overview — only if user can manage assessments */}
      {(isFullAdmin || hasPermission(Permission.MANAGE_ASSESSMENTS)) && (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            Assessments Overview
          </h3>
          <Link
            href="/assessments"
            className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {assessments ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Active",
                value: assessments.active,
                cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
              },
              {
                label: "Pending",
                value: assessments.pending,
                cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
              },
              {
                label: "Completed",
                value: assessments.completed,
                cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Cancelled",
                value: assessments.cancelled,
                cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
              },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-3 text-center", item.cls)}>
                <div className="text-2xl font-bold tabular-nums">{item.value}</div>
                <div className="text-xs mt-0.5 opacity-80">{item.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No assessment data" compact />
        )}
      </div>
      )}

      {/* Top Classes by Enrollment — only if user can manage classes */}
      {(isFullAdmin || hasPermission(Permission.MANAGE_CLASSES)) && (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            Top Classes by Enrollment
          </h3>
          <Link
            href="/classes"
            className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {topClasses.length > 0 ? (
          <div className="space-y-3">
            {topClasses.map((cls, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-xs font-medium text-gray-700 dark:text-slate-300 w-14 flex-shrink-0 truncate">
                  {cls.className}
                </div>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-[#003366] dark:bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${(cls.count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="text-xs tabular-nums text-gray-500 dark:text-slate-400 w-7 text-right">
                  {cls.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No enrollment data" compact />
        )}
      </div>
      )}
    </div>
  );
}

// ==================== Section 4: Pending Actions ====================

interface PendingActionsProps {
  pendingActions: PendingActionsData | null;
  isLoading: boolean;
  hasPermission: (p: string) => boolean;
  isFullAdmin: boolean;
}

function PendingActionsSection({ pendingActions, isLoading, hasPermission, isFullAdmin }: PendingActionsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse"
          >
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
            <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
            <div className="w-28 h-3.5 bg-gray-100 dark:bg-slate-700 rounded mb-2" />
            <div className="w-20 h-3 bg-gray-100 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!pendingActions) return null;

  const actions = [
    {
      key: "transfers",
      icon: <ArrowLeftRight className="w-5 h-5" />,
      title: "Pending Transfer Requests",
      count: pendingActions.transfers.incoming + pendingActions.transfers.outgoing,
      description: `${pendingActions.transfers.incoming} incoming · ${pendingActions.transfers.outgoing} outgoing`,
      href: "/transit/transfers",
      iconCls: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      borderCls: "border-red-100 dark:border-red-900/30",
      linkCls: "text-red-600 dark:text-red-400",
      permission: Permission.MANAGE_TRANSIT,
    },
    {
      key: "leave",
      icon: <Clock className="w-5 h-5" />,
      title: "Leave Requests",
      count: pendingActions.leaveRequests.pending,
      description: `${pendingActions.leaveRequests.pending} pending approval`,
      href: "/leave-requests",
      iconCls: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      borderCls: "border-amber-100 dark:border-amber-900/30",
      linkCls: "text-amber-600 dark:text-amber-400",
      permission: Permission.MANAGE_LEAVE_REQUESTS,
    },
    {
      key: "promotions",
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Open Promotion Runs",
      count: pendingActions.promotionRuns.open,
      description: `${pendingActions.promotionRuns.pendingValidation} pending validation`,
      href: "/transit/promotions",
      iconCls: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      borderCls: "border-orange-100 dark:border-orange-900/30",
      linkCls: "text-orange-600 dark:text-orange-400",
      permission: Permission.MANAGE_TRANSIT,
    },
    {
      key: "unenrolled",
      icon: <UserMinus className="w-5 h-5" />,
      title: "Students Without Enrollment",
      count: pendingActions.studentsWithoutEnrollment.count,
      description: `${pendingActions.studentsWithoutEnrollment.count} students unassigned`,
      href: "/users/students",
      iconCls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      borderCls: "border-slate-200 dark:border-slate-700",
      linkCls: "text-slate-600 dark:text-slate-400",
      permission: Permission.MANAGE_STUDENTS,
    },
  ].filter((a) => a.count > 0 && (isFullAdmin || hasPermission(a.permission)));

  if (actions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          Pending Actions
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className={cn(
              "group bg-white dark:bg-slate-800 rounded-xl border p-5 hover:shadow-md transition-all duration-200",
              action.borderCls
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-xl", action.iconCls)}>
                {action.icon}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors mt-0.5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1 tabular-nums">
              {action.count}
            </div>
            <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 leading-snug">
              {action.title}
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              {action.description}
            </div>
            <div className={cn("text-xs font-semibold flex items-center gap-1", action.linkCls)}>
              Review <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ==================== Section 5: Recent Activity ====================

interface RecentActivityProps {
  payments: RecentPayment[];
  announcements: RecentAnnouncement[];
  isLoading: boolean;
}

function RecentActivity({ payments, announcements, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PanelSkeleton minH={260} />
        <PanelSkeleton minH={260} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Recent Payments */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            Recent Payments
          </h3>
          <Link
            href="/fees-management"
            className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {payments.length > 0 ? (
          <div className="space-y-1">
            {payments.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-[#003366]/10 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#003366] dark:text-blue-400">
                    {p.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                    {p.studentName}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                    <CreditCard className="w-2.5 h-2.5" />
                    {p.method}
                    <span>·</span>
                    {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-slate-100">
                    {formatNairaFull(p.amount)}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-medium",
                      p.status === "success"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : p.status === "pending"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}
                  >
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No recent payments to display" />
        )}
      </div>

      {/* Recent Announcements */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            Recent Announcements
          </h3>
          <Link
            href="/messages"
            className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {announcements.length > 0 ? (
          <div className="space-y-1">
            {announcements.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate mb-1">
                    {a.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#003366]/8 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                      {a.audience}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {formatDistanceToNow(new Date(a.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                    {a.readRate}%
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">read rate</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No recent announcements" />
        )}
      </div>
    </div>
  );
}

// ==================== Section 6: Quick Links ====================

interface QuickLinksProps {
  hasPermission: (p: string) => boolean;
  isFullAdmin: boolean;
}

function QuickLinks({ hasPermission, isFullAdmin }: QuickLinksProps) {
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

  const links = allLinks.filter(
    (l) => isFullAdmin || hasPermission(l.permission)
  );

  if (links.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          Quick Links
        </h3>
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

// ==================== Main Dashboard Page ====================

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission, isFullAdmin, isSubAdmin, permissions } = usePermissions();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data, isLoading, error, refresh } = useEnhancedDashboard();

  const schoolName = user?.schoolName ?? data.base?.schoolInfo?.name ?? "Your School";
  const adminName = user?.firstName ?? "Admin";

  if (error && !data.base && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={refresh}
            className="px-5 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#002244] transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Shorthand for passing RBAC props to every section
  const rbac = { hasPermission, isFullAdmin };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Hero ───────────────────────────────────── */}
        <div className="mb-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-slate-100 leading-tight">
                {getGreeting()},{" "}
                <span className="text-[#003366] dark:text-blue-400">{adminName}</span>!
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Here&apos;s what&apos;s happening at{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {schoolName}
                </span>{" "}
                today.
              </p>
              {data.academic?.currentTerm && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-900/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {data.academic.currentTerm.name} · {data.academic.currentTerm.academicYear}
                </div>
              )}
            </div>

            {/* Quick Actions — only shown if the user has the relevant permission */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {(isFullAdmin || hasPermission(Permission.MANAGE_STUDENTS)) && (
                <button
                  onClick={() => router.push("/users/students")}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <UserRoundPlus className="w-4 h-4" />
                  Add Student
                </button>
              )}
              {(isFullAdmin || hasPermission(Permission.MANAGE_FEES) || hasPermission(Permission.MANAGE_PAYMENTS)) && (
                <button
                  onClick={() => router.push("/fees-management/create")}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <HandCoins className="w-4 h-4" />
                  Record Payment
                </button>
              )}
              {(isFullAdmin || hasPermission(Permission.MANAGE_ANNOUNCEMENTS)) && (
                <button
                  onClick={() => router.push("/announcements")}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#002244] transition-colors shadow-sm"
                >
                  <Megaphone className="w-4 h-4" />
                  New Announcement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Sub-admin access banner ────────────────── */}
        {isSubAdmin && <SubAdminBanner permissions={permissions} />}

        {/* ── Onboarding Progress (full admin only) ─── */}
        {isFullAdmin && (
          <div className="mb-6">
            <SetupProgressWidget />
          </div>
        )}

        {/* ── KPI Cards ─────────────────────────────── */}
        <KpiCards base={data.base} summary={data.summary} isLoading={isLoading} {...rbac} />

        {/* ── Financial Snapshot ────────────────────── */}
        <FinancialSnapshot finance={data.finance} isLoading={isLoading} isDark={isDark} {...rbac} />

        {/* ── Academic Activity ─────────────────────── */}
        <AcademicActivity academic={data.academic} base={data.base} isLoading={isLoading} {...rbac} />

        {/* ── Pending Actions ───────────────────────── */}
        <PendingActionsSection pendingActions={data.pendingActions} isLoading={isLoading} {...rbac} />

        {/* ── Recent Activity ───────────────────────── */}
        <RecentActivity
          payments={data.recentPayments}
          announcements={data.recentAnnouncements}
          isLoading={isLoading}
        />

        {/* ── Quick Links ───────────────────────────── */}
        <QuickLinks {...rbac} />
      </div>
    </div>
  );
}
