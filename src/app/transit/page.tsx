"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Users, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { getTransitDashboard, TransitDashboard } from "@/app/services/transit.service";
import { toast } from "@/components/CustomToast";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#030E18]">{value}</p>
        <p className="text-sm text-[#929292] mt-0.5">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function TransitDashboardPage() {
  const [stats, setStats] = useState<TransitDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransitDashboard()
      .then(setStats)
      .catch(() => toast.error("Failed to load transit dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030E18]">Transit</h1>
          <p className="text-sm text-[#929292] mt-1">
            Manage student transfers, class promotions, and academic year closures
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/transit/transfers/new/target"
            className="flex items-center gap-2 px-4 py-2 border border-[#003366] text-[#003366] rounded-lg text-sm font-medium hover:bg-[#003366]/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Pull Transfer
          </Link>
          <Link
            href="/transit/transfers/new/source"
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#003366]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Push Transfer
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Pending Incoming Transfers"
            value={stats.pendingIncoming}
            icon={ArrowLeftRight}
            color="bg-amber-500"
            href="/transit/transfers?status=requested"
          />
          <StatCard
            label="Pending Outgoing Transfers"
            value={stats.pendingOutgoing}
            icon={ArrowLeftRight}
            color="bg-blue-500"
            href="/transit/transfers?status=source_approved"
          />
          <StatCard
            label="Open Promotion Runs"
            value={stats.openPromotionRuns}
            icon={TrendingUp}
            color="bg-purple-500"
            href="/transit/promotions"
          />
          <StatCard
            label="Active Enrollments"
            value={stats.totalActiveEnrollments}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            label="Students Without Enrollment"
            value={stats.studentsWithoutEnrollment}
            icon={AlertCircle}
            color="bg-rose-500"
          />
        </div>
      ) : null}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-[#030E18] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/transit/transfers"
            className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-[#003366]/30 hover:shadow-md transition-all"
          >
            <ArrowLeftRight className="w-6 h-6 text-[#003366] mb-3" />
            <h3 className="font-semibold text-[#030E18]">Student Transfers</h3>
            <p className="text-sm text-[#929292] mt-1">
              View and manage all incoming and outgoing transfer requests
            </p>
          </Link>
          <Link
            href="/transit/promotions"
            className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-[#003366]/30 hover:shadow-md transition-all"
          >
            <TrendingUp className="w-6 h-6 text-[#003366] mb-3" />
            <h3 className="font-semibold text-[#030E18]">Class Promotions</h3>
            <p className="text-sm text-[#929292] mt-1">
              Promote students to the next class at end of academic year
            </p>
          </Link>
          <Link
            href="/settings"
            className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-[#003366]/30 hover:shadow-md transition-all"
          >
            <Users className="w-6 h-6 text-[#003366] mb-3" />
            <h3 className="font-semibold text-[#030E18]">Academic Year Closure</h3>
            <p className="text-sm text-[#929292] mt-1">
              Close an academic year and snapshot all records before the new season
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
