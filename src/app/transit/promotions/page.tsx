"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Plus } from "lucide-react";
import {
  listPromotionRuns,
  commitPromotionRun,
  cancelPromotionRun,
  PromotionRun,
} from "@/app/services/transit.service";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";

type RunStatus = PromotionRun["status"];

const STATUS_COLORS: Record<RunStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  validated: "bg-blue-100 text-blue-700",
  committed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PromotionsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<PromotionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    listPromotionRuns()
      .then(setRuns)
      .catch(() => toast.error("Failed to load promotion runs"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCommit(run: PromotionRun) {
    setActionId(run._id);
    try {
      const updated = await commitPromotionRun(run._id);
      setRuns((prev) => prev.map((r) => (r._id === run._id ? updated : r)));
      toast.success("Promotion run committed successfully");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to commit promotion run");
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(run: PromotionRun) {
    setActionId(run._id);
    try {
      const updated = await cancelPromotionRun(run._id);
      setRuns((prev) => prev.map((r) => (r._id === run._id ? updated : r)));
      toast.success("Promotion run cancelled");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to cancel promotion run");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030E18]">Promotions</h1>
          <p className="text-sm text-[#929292] mt-1">
            Promote students to the next class at end of an academic year
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 text-[#929292]">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No promotion runs yet</p>
          <p className="text-sm mt-1">Contact support or use the API to create a promotion run</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run._id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        STATUS_COLORS[run.status]
                      )}
                    >
                      {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                    <span className="text-xs text-[#929292]">Created {fmt(run.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#4A5568]">
                    {run.decisions.length} student decision{run.decisions.length !== 1 ? "s" : ""}
                  </p>
                  {run.validationResult && (
                    <p className="text-xs text-[#929292] mt-1">
                      {run.validationResult.eligible.length} eligible ·{" "}
                      {run.validationResult.ineligible.length} ineligible
                      {run.validationResult.warnings.length > 0
                        ? ` · ${run.validationResult.warnings.length} warning(s)`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {run.status === "validated" && (
                    <button
                      disabled={actionId === run._id}
                      onClick={() => handleCommit(run)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionId === run._id ? "..." : "Commit"}
                    </button>
                  )}
                  {["draft", "validated"].includes(run.status) && (
                    <button
                      disabled={actionId === run._id}
                      onClick={() => handleCancel(run)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {actionId === run._id ? "..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
