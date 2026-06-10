"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeftRight, Search } from "lucide-react";
import { listTransfers, TransferRequest, TransferStatus } from "@/app/services/transit.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Requested", value: "requested" },
  { label: "Source Approved", value: "source_approved" },
  { label: "Target Approved", value: "target_approved" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_COLORS: Record<TransferStatus, string> = {
  requested: "bg-amber-100 text-amber-700",
  source_approved: "bg-blue-100 text-blue-700",
  target_approved: "bg-indigo-100 text-indigo-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<TransferStatus, string> = {
  requested: "Requested",
  source_approved: "Source Approved",
  target_approved: "Target Approved",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function studentName(s: TransferRequest["studentId"]): string {
  if (typeof s === "string") return s;
  return `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s._id;
}

function schoolName(s: TransferRequest["sourceSchoolId"]): string {
  if (typeof s === "string") return s;
  return s.name;
}

function className(c: TransferRequest["targetClassId"]): string {
  if (!c) return "—";
  if (typeof c === "string") return c;
  return `${c.name} (${c.gradeLevel})`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TransfersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get("status") ?? "";

  const [activeStatus, setActiveStatus] = useState(statusParam);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const data = await listTransfers(status || undefined);
      setTransfers(data);
    } catch {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeStatus);
  }, [activeStatus, load]);

  const handleTab = (status: string) => {
    setActiveStatus(status);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.replace(`/transit/transfers${status ? `?${params}` : ""}`);
  };

  const filtered = transfers.filter((t) => {
    if (!search) return true;
    const sName = studentName(t.studentId).toLowerCase();
    const src = schoolName(t.sourceSchoolId).toLowerCase();
    const tgt = schoolName(t.targetSchoolId).toLowerCase();
    const q = search.toLowerCase();
    return sName.includes(q) || src.includes(q) || tgt.includes(q);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030E18]">Transfers</h1>
          <p className="text-sm text-[#929292] mt-1">
            All incoming and outgoing student transfer requests
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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-100 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTab(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeStatus === tab.value
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-[#929292] hover:text-[#030E18]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
        <input
          type="text"
          placeholder="Search by student or school..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#003366] transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#929292]">
          <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No transfers found</p>
          <p className="text-sm mt-1">
            {search ? "Try a different search term" : "No transfer requests yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Student</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">From</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">To</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Target Class</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Initiated By</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Status</th>
                <th className="px-4 py-3 text-left font-medium text-[#929292]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/transit/transfers/${t._id}`)}
                >
                  <td className="px-4 py-3 font-medium text-[#030E18]">
                    {studentName(t.studentId)}
                  </td>
                  <td className="px-4 py-3 text-[#4A5568]">{schoolName(t.sourceSchoolId)}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{schoolName(t.targetSchoolId)}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{className(t.targetClassId)}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-[#4A5568]">{t.initiatedBy}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        STATUS_COLORS[t.status]
                      )}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#929292]">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
