"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarCheck,
  CheckCircle,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTransitDashboard } from "@/hooks/transit/useTransitDashboard";
import { cn } from "@/lib/utils";
import { surface, text } from "@/components/transit/ui";
import { TransitErrorState } from "@/components/transit/TransitStates";
import { NewTransferButtons } from "@/components/transit/NewTransferButtons";

/** One counter on the overview, optionally linking to the list behind it. */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "rounded-xl p-5 flex items-start gap-4 shadow-sm transition-shadow h-full",
        surface.card,
        href && "hover:shadow-md"
      )}
    >
      <span className={cn("p-3 rounded-lg shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </span>
      <span>
        <span className={cn("block text-2xl font-bold", text.strong)}>{value}</span>
        <span className={cn("block text-sm mt-0.5", text.muted)}>{label}</span>
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

/** One of the three shortcuts under the counters. */
function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl p-5 transition-all hover:shadow-md hover:border-[#003366]/30 dark:hover:border-sky-500/40",
        surface.card
      )}
    >
      <Icon className={cn("w-6 h-6 mb-3", text.brand)} />
      <h3 className={cn("font-semibold", text.strong)}>{title}</h3>
      <p className={cn("text-sm mt-1", text.muted)}>{description}</p>
    </Link>
  );
}

/** Which dashboard counter a card shows. */
type CounterKey =
  | "pendingIncoming"
  | "pendingOutgoing"
  | "openPromotionRuns"
  | "totalActiveEnrollments"
  | "studentsWithoutEnrollment";

/** The counters, in the order they appear on the overview. */
const CARDS: { key: CounterKey; label: string; icon: LucideIcon; color: string; href?: string }[] = [
  {
    key: "pendingIncoming",
    label: "Pending Incoming Transfers",
    icon: ArrowLeftRight,
    color: "bg-amber-500",
    href: "/transit/transfers?status=requested",
  },
  {
    key: "pendingOutgoing",
    label: "Pending Outgoing Transfers",
    icon: ArrowLeftRight,
    color: "bg-blue-500",
    href: "/transit/transfers?status=source_approved",
  },
  {
    key: "openPromotionRuns",
    label: "Open Promotion Runs",
    icon: TrendingUp,
    color: "bg-purple-500",
    href: "/transit/promotions",
  },
  {
    key: "totalActiveEnrollments",
    label: "Active Enrollments",
    icon: CheckCircle,
    color: "bg-green-500",
    href: "/transit/enrollments?status=active",
  },
  {
    key: "studentsWithoutEnrollment",
    label: "Students Without Enrollment",
    icon: AlertCircle,
    color: "bg-rose-500",
    href: "/transit/enrollments",
  },
];

/** The transit overview: what is waiting, and where to go next. */
export default function TransitDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useTransitDashboard();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", text.strong)}>Transit</h1>
          <p className={cn("text-sm mt-1", text.muted)}>
            Manage student transfers, class promotions, and academic year closures
            {data?.currentAcademicYear?.year ? ` · ${data.currentAcademicYear.year}` : ""}
          </p>
        </div>
        <NewTransferButtons />
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-hidden>
          {CARDS.map((card) => (
            <div
              key={card.key}
              className={cn("rounded-xl p-5 h-24 animate-pulse", surface.card)}
            />
          ))}
        </div>
      ) : isError ? (
        <TransitErrorState
          error={error}
          onRetry={() => refetch()}
          fallbackTitle="We couldn't load the transit overview"
        />
      ) : (
        data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CARDS.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                value={data[card.key]}
                icon={card.icon}
                color={card.color}
                href={card.href}
              />
            ))}
          </div>
        )
      )}

      <section>
        <h2 className={cn("text-base font-semibold mb-4", text.strong)}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            href="/transit/transfers"
            icon={ArrowLeftRight}
            title="Student Transfers"
            description="View and manage all incoming and outgoing transfer requests"
          />
          <QuickAction
            href="/transit/promotions"
            icon={TrendingUp}
            title="Class Promotions"
            description="Promote students to the next class at end of academic year"
          />
          <QuickAction
            href="/transit/enrollments"
            icon={Users}
            title="Enrollments"
            description="Enrol students into a class and academic year, one or many at a time"
          />
          <QuickAction
            href="/settings"
            icon={CalendarCheck}
            title="Academic Year Closure"
            description="Close an academic year and snapshot all records before the new season"
          />
        </div>
      </section>
    </div>
  );
}
