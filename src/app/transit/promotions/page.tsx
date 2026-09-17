"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  canCommit,
  refId,
  type PromotionRun,
  type PromotionRunStatus,
} from "@/app/services/transit.service";
import { getAcademicYearLabel } from "@/app/services/academic.service";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { useClassOptions } from "@/hooks/transit/useTransitReference";
import {
  usePromotionRun,
  usePromotionRunAction,
  usePromotionRuns,
  type PromotionAction,
} from "@/hooks/transit/usePromotionRuns";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { SelectField, SkeletonRows, text } from "@/components/transit/ui";
import { TransitEmptyState, TransitErrorState } from "@/components/transit/TransitStates";
import { StatsCard } from "@/components/transit/promotions/promotionUi";
import {
  PromotionRunsTable,
  runActionKey,
} from "@/components/transit/promotions/PromotionRunsTable";
import { CreatePromotionRunModal } from "@/components/transit/promotions/CreatePromotionRunModal";
import {
  CancelRunModal,
  CommitConfirmModal,
  ValidationResultModal,
} from "@/components/transit/promotions/PromotionDialogs";
import { RunDetailsDrawer } from "@/components/transit/promotions/RunDetailsDrawer";

/** The status filter's options. */
const STATUSES: { label: string; value: "" | PromotionRunStatus }[] = [
  { label: "All Statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Validated", value: "validated" },
  { label: "Committed", value: "committed" },
  { label: "Cancelled", value: "cancelled" },
];

/** What to say after each transition. */
const DONE: Record<PromotionAction, string> = {
  validate: "Promotion run validated",
  commit: "Promotion run committed",
  cancel: "Promotion run cancelled",
};

/** What to say when one fails, before the server's own message. */
const FAILED: Record<PromotionAction, string> = {
  validate: "Couldn't validate the run",
  commit: "Couldn't commit the run",
  cancel: "Couldn't cancel the run",
};

/**
 * Promotion runs: a batch of class moves, validated as one unit and committed
 * as one unit.
 *
 * The status filter is the URL's `?status=` and the API applies it; the
 * academic-year filter narrows what came back, since the API has no parameter
 * for it.
 */
export default function PromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get("status") ?? "") as "" | PromotionRunStatus;
  const yearFilter = searchParams.get("academicYear") ?? "";

  const [createOpen, setCreateOpen] = useState(false);
  const [validationRun, setValidationRun] = useState<PromotionRun | null>(null);
  const [commitRun, setCommitRun] = useState<PromotionRun | null>(null);
  const [cancelRun, setCancelRun] = useState<PromotionRun | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState("");

  const runs = usePromotionRuns(statusFilter);
  const details = usePromotionRun(detailsId);
  const action = usePromotionRunAction();
  const years = useAcademicYears();
  const terms = useTerms();
  const { classes } = useClassOptions();

  const filteredRuns = useMemo(() => {
    const all = runs.data ?? [];
    if (!yearFilter) return all;
    return all.filter(
      (run) =>
        refId(run.fromAcademicYearId) === yearFilter || refId(run.toAcademicYearId) === yearFilter
    );
  }, [runs.data, yearFilter]);

  const stats = useMemo(() => {
    const all = runs.data ?? [];
    return {
      open: all.filter((run) => run.status === "draft").length,
      ready: all.filter((run) => canCommit(run)).length,
      committed: all.filter((run) => run.status === "committed").length,
    };
  }, [runs.data]);

  function updateFilters(next: { status?: string; academicYear?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const status = next.status ?? statusFilter;
    const academicYear = next.academicYear ?? yearFilter;
    if (status) params.set("status", status);
    else params.delete("status");
    if (academicYear) params.set("academicYear", academicYear);
    else params.delete("academicYear");
    const query = params.toString();
    router.replace(`/transit/promotions${query ? `?${query}` : ""}`);
  }

  async function run(next: PromotionAction, target: PromotionRun) {
    if (pendingKey) return;
    setPendingKey(runActionKey(next, target._id));
    try {
      const updated = await action.mutateAsync({ id: target._id, action: next });
      toast.success(DONE[next]);
      if (next === "validate") setValidationRun(updated);
      if (next === "commit") {
        setCommitRun(null);
        setValidationRun(null);
      }
      if (next === "cancel") setCancelRun(null);
    } catch (err) {
      logger.error("transit", `promotion run ${next} failed`, err);
      toast.error(getErrorMessage(err, FAILED[next]));
    } finally {
      setPendingKey("");
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header
          className={cn(
            "flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between"
          )}
        >
          <div>
            <h1 className={cn("text-2xl font-bold", text.strong)}>Promotions</h1>
            <p className={cn("mt-1 text-sm", text.muted)}>
              Manage student and class promotion runs across academic years
            </p>
          </div>
          <PermissionGate permission={Permission.MANAGE_TRANSIT}>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003366] hover:bg-[#003366]/90 px-4 text-sm font-semibold text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Promotion Run
            </button>
          </PermissionGate>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            label="Open Runs"
            value={stats.open}
            icon={<SlidersHorizontal className="h-5 w-5" />}
          />
          <StatsCard
            label="Validated Runs Ready to Commit"
            value={stats.ready}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <StatsCard
            label="Committed Runs"
            value={stats.committed}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:flex-row md:items-end">
          <div className="md:w-56">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(value) => updateFilters({ status: value })}
            >
              {STATUSES.map((status) => (
                <option key={status.value || "all"} value={status.value}>
                  {status.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="md:w-56">
            <SelectField
              label="Academic Year"
              value={yearFilter}
              onChange={(value) => updateFilters({ academicYear: value })}
              disabled={years.isLoading}
            >
              <option value="">All academic years</option>
              {(years.data ?? []).map((year) => (
                <option key={year._id} value={year._id}>
                  {getAcademicYearLabel(year)}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {runs.isLoading ? (
          <SkeletonRows />
        ) : runs.isError ? (
          <TransitErrorState
            error={runs.error}
            onRetry={() => runs.refetch()}
            fallbackTitle="We couldn't load promotion runs"
          />
        ) : filteredRuns.length === 0 ? (
          <TransitEmptyState
            icon={AlertTriangle}
            title="No promotion runs found"
            message={
              statusFilter || yearFilter
                ? "Nothing matches these filters."
                : "Create a run to promote a class into the next academic year."
            }
          />
        ) : (
          <PromotionRunsTable
            runs={filteredRuns}
            pendingKey={pendingKey}
            onView={(target) => setDetailsId(target._id)}
            onValidate={(target) => run("validate", target)}
            onCommit={setCommitRun}
            onCancel={setCancelRun}
          />
        )}
      </div>

      {createOpen && (
        <CreatePromotionRunModal
          academicYears={years.data ?? []}
          terms={terms.data ?? []}
          classes={classes}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      )}

      {validationRun && (
        <ValidationResultModal
          run={validationRun}
          pending={pendingKey === runActionKey("commit", validationRun._id)}
          onClose={() => setValidationRun(null)}
          onCommit={setCommitRun}
        />
      )}

      {commitRun && (
        <CommitConfirmModal
          run={commitRun}
          pending={pendingKey === runActionKey("commit", commitRun._id)}
          onClose={() => setCommitRun(null)}
          onConfirm={() => run("commit", commitRun)}
        />
      )}

      {cancelRun && (
        <CancelRunModal
          run={cancelRun}
          pending={pendingKey === runActionKey("cancel", cancelRun._id)}
          onClose={() => setCancelRun(null)}
          onConfirm={() => run("cancel", cancelRun)}
        />
      )}

      {detailsId && (
        <RunDetailsDrawer
          run={details.data ?? null}
          classes={classes}
          loading={details.isLoading}
          error={details.isError ? details.error : undefined}
          onRetry={() => details.refetch()}
          onClose={() => setDetailsId(null)}
        />
      )}
    </div>
  );
}
