"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  GraduationCap,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  getTransfer,
  sourceApproveTransfer,
  targetApproveTransfer,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
  TransferRequest,
  TransferStatus,
} from "@/app/services/transit.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<TransferStatus, string> = {
  requested: "bg-amber-100 text-amber-700 border-amber-200",
  source_approved: "bg-blue-100 text-blue-700 border-blue-200",
  target_approved: "bg-indigo-100 text-indigo-700 border-indigo-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<TransferStatus, string> = {
  requested: "Requested",
  source_approved: "Source Approved",
  target_approved: "Target Approved",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STEPS: { status: TransferStatus; label: string }[] = [
  { status: "requested", label: "Requested" },
  { status: "source_approved", label: "Source Approved" },
  { status: "target_approved", label: "Target Approved" },
  { status: "accepted", label: "Accepted" },
];

function getStepIndex(status: TransferStatus): number {
  if (status === "rejected" || status === "cancelled") return -1;
  return STEPS.findIndex((s) => s.status === status);
}

function nameOf(obj: unknown): string {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  const o = obj as Record<string, unknown>;
  if (o.firstName || o.lastName) return `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim();
  if (o.name) return o.name as string;
  return String(o._id ?? "—");
}

function fmt(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-[#929292]">{label}</span>
      <span className="text-sm font-medium text-[#030E18] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [transfer, setTransfer] = useState<TransferRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);

  useEffect(() => {
    getTransfer(id)
      .then(setTransfer)
      .catch(() => toast.error("Failed to load transfer"))
      .finally(() => setLoading(false));
  }, [id]);

  async function runAction(label: string, fn: () => Promise<TransferRequest>) {
    setActionLoading(label);
    try {
      const updated = await fn();
      setTransfer(updated);
      toast.success(`Transfer ${label.toLowerCase()} successfully`);
      setShowRejectInput(false);
      setShowCancelInput(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || `Failed to ${label.toLowerCase()} transfer`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="p-6 text-center text-[#929292]">
        <p>Transfer not found.</p>
      </div>
    );
  }

  const currentStep = getStepIndex(transfer.status);
  const isTerminal = ["accepted", "rejected", "cancelled"].includes(transfer.status);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#929292] hover:text-[#030E18] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transfers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030E18]">Transfer Request</h1>
          <p className="text-sm text-[#929292] mt-0.5">ID: {transfer._id}</p>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium border",
            STATUS_COLORS[transfer.status]
          )}
        >
          {STATUS_LABELS[transfer.status]}
        </span>
      </div>

      {/* Progress stepper */}
      {!["rejected", "cancelled"].includes(transfer.status) && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#030E18] mb-4">Progress</h2>
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <div key={step.status} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                        done
                          ? "bg-[#003366] text-white"
                          : "bg-gray-100 text-[#929292]"
                      )}
                    >
                      {done && !active ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs text-center leading-tight",
                        done ? "text-[#003366] font-medium" : "text-[#929292]"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mb-4 transition-colors",
                        idx < currentStep ? "bg-[#003366]" : "bg-gray-100"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Info */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#003366]" />
            <h2 className="text-sm font-semibold text-[#030E18]">Student</h2>
          </div>
          <InfoRow label="Name" value={nameOf(transfer.studentId)} />
          {typeof transfer.studentId !== "string" && transfer.studentId.studentId && (
            <InfoRow label="Student ID" value={transfer.studentId.studentId} />
          )}
          {typeof transfer.studentId !== "string" && transfer.studentId.gradeLevel && (
            <InfoRow label="Grade Level" value={transfer.studentId.gradeLevel} />
          )}
        </div>

        {/* School Info */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-[#003366]" />
            <h2 className="text-sm font-semibold text-[#030E18]">Schools</h2>
          </div>
          <InfoRow label="Source School" value={nameOf(transfer.sourceSchoolId)} />
          <InfoRow label="Target School" value={nameOf(transfer.targetSchoolId)} />
          <InfoRow
            label="Source Class"
            value={transfer.sourceClassId ? nameOf(transfer.sourceClassId) : "—"}
          />
        </div>

        {/* Target Details */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-[#003366]" />
            <h2 className="text-sm font-semibold text-[#030E18]">Target Details</h2>
          </div>
          <InfoRow label="Target Class" value={nameOf(transfer.targetClassId)} />
          <InfoRow label="Initiated By" value={<span className="capitalize">{transfer.initiatedBy}</span>} />
          <InfoRow label="Requested" value={fmt(transfer.createdAt)} />
          {transfer.reason && <InfoRow label="Reason" value={transfer.reason} />}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#003366]" />
            <h2 className="text-sm font-semibold text-[#030E18]">Timeline</h2>
          </div>
          <InfoRow label="Submitted" value={fmt(transfer.createdAt)} />
          {transfer.sourceApprovedAt && (
            <InfoRow label="Source Approved" value={fmt(transfer.sourceApprovedAt)} />
          )}
          {transfer.targetApprovedAt && (
            <InfoRow label="Target Approved" value={fmt(transfer.targetApprovedAt)} />
          )}
          {transfer.acceptedAt && (
            <InfoRow label="Accepted" value={fmt(transfer.acceptedAt)} />
          )}
          {transfer.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-[#929292] mb-1">Notes</p>
              <p className="text-sm text-[#4A5568]">{transfer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      {transfer.documents?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#003366]" />
            <h2 className="text-sm font-semibold text-[#030E18]">Attached Documents</h2>
          </div>
          <div className="space-y-2">
            {transfer.documents.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#003366] hover:underline"
              >
                <FileText className="w-4 h-4" />
                Document {i + 1}
                <ChevronRight className="w-3 h-3 ml-auto" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!isTerminal && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#030E18] mb-4">Actions</h2>

          <div className="flex flex-wrap gap-3">
            {transfer.status === "requested" && (
              <button
                disabled={!!actionLoading}
                onClick={() => runAction("Source Approved", () => sourceApproveTransfer(transfer._id))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "Source Approved" ? "Processing..." : "Approve (Source School)"}
              </button>
            )}

            {(transfer.status === "requested" || transfer.status === "source_approved") && (
              <button
                disabled={!!actionLoading}
                onClick={() => runAction("Target Approved", () => targetApproveTransfer(transfer._id))}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "Target Approved" ? "Processing..." : "Approve (Target School)"}
              </button>
            )}

            {transfer.status === "target_approved" && (
              <button
                disabled={!!actionLoading}
                onClick={() => runAction("Accepted", () => acceptTransfer(transfer._id))}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "Accepted" ? "Processing..." : "Accept Transfer"}
              </button>
            )}

            {/* Reject */}
            {!showRejectInput ? (
              <button
                disabled={!!actionLoading}
                onClick={() => setShowRejectInput(true)}
                className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            ) : (
              <div className="w-full flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Reason for rejection (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-rose-400"
                />
                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    runAction("Rejected", () => rejectTransfer(transfer._id, rejectReason || undefined))
                  }
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "Rejected" ? "Processing..." : "Confirm Reject"}
                </button>
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-2 text-sm text-[#929292] hover:text-[#030E18]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Cancel */}
            {!showCancelInput ? (
              <button
                disabled={!!actionLoading}
                onClick={() => setShowCancelInput(true)}
                className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel Transfer
              </button>
            ) : (
              <div className="w-full flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Reason for cancellation (optional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                />
                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    runAction("Cancelled", () => cancelTransfer(transfer._id, cancelReason || undefined))
                  }
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "Cancelled" ? "Processing..." : "Confirm Cancel"}
                </button>
                <button
                  onClick={() => setShowCancelInput(false)}
                  className="px-3 py-2 text-sm text-[#929292] hover:text-[#030E18]"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal state banner */}
      {isTerminal && (
        <div
          className={cn(
            "rounded-xl p-4 flex items-center gap-3 border",
            transfer.status === "accepted"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-gray-50 border-gray-200 text-gray-600"
          )}
        >
          {transfer.status === "accepted" ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-medium">
            This transfer has been{" "}
            <span className="capitalize">{transfer.status}</span>
            {transfer.notes ? ` — ${transfer.notes}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
