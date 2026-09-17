"use client";

/**
 * Leave requests — the queue a school administrator works through.
 *
 * The API returns the school's whole queue in one response, so the tabs and
 * the search box filter what is already cached instead of refetching. A
 * decision is made in place and invalidates the queue, and Approve / Reject
 * only appear for reviewers holding MANAGE_LEAVE_REQUESTS.
 */
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/CustomToast";
import LeaveRequestSkeleton from "@/components/LeaveRequestSkeleton";
import { ErrorState } from "@/components/StateComponents";
import { LeaveRequestCard } from "@/components/leave/LeaveRequestCard";
import { LeaveRequestFilters } from "@/components/leave/LeaveRequestFilters";
import {
  countByStatus,
  filterLeaveRequests,
  statusValue,
  type LeaveFilter,
} from "@/components/leave/leave.presentation";
import { useLeaveRequests, useUpdateLeaveStatus } from "@/hooks/leave/useLeaveRequests";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";

/**
 * The leave-request review queue.
 */
export default function LeaveRequestsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<LeaveFilter>("all");
  const [search, setSearch] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const queue = useLeaveRequests();
  const decide = useUpdateLeaveStatus();

  const requests = useMemo(() => queue.data ?? [], [queue.data]);
  const counts = useMemo(() => countByStatus(requests), [requests]);
  const visible = useMemo(
    () => filterLeaveRequests(requests, filter, search),
    [requests, filter, search]
  );

  const handleDecision = async (leaveId: string, decision: "approved" | "rejected") => {
    setDecidingId(leaveId);
    try {
      await decide.mutateAsync({ leaveId, status: statusValue(decision), viewed: true });
      toast.success(`Request ${decision} successfully!`);
    } catch (error) {
      logger.error("leave-requests", `Failed to mark request ${decision}`, error);
      toast.error(getErrorMessage(error, "Failed to update request status"));
    } finally {
      setDecidingId(null);
    }
  };

  if (queue.isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="pt-4">
          <LeaveRequestSkeleton />
        </div>
      </div>
    );
  }

  if (queue.isError) {
    return (
      <div className="min-h-screen p-4">
        <div className="pt-4">
          <ErrorState
            title="Error Loading Leave Requests"
            message={getErrorMessage(queue.error, "Failed to fetch leave requests")}
            onRetry={() => void queue.refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="pt-4">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-[19px] font-semibold text-slate-900 dark:text-white">Request Leave</h1>
          <LeaveRequestFilters
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
            counts={counts}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyQueue filter={filter} hasSearch={Boolean(search.trim())} onShowAll={() => setFilter("all")} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((request) => (
              <LeaveRequestCard
                key={request._id}
                request={request}
                isDeciding={decidingId === request._id}
                onOpen={(leaveId) => router.push(`/leave-requests/${leaveId}`)}
                onApprove={(leaveId) => void handleDecision(leaveId, "approved")}
                onReject={(leaveId) => void handleDecision(leaveId, "rejected")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** What the queue shows when nothing matches the active tab or search. */
function EmptyQueue({
  filter,
  hasSearch,
  onShowAll,
}: {
  filter: LeaveFilter;
  hasSearch: boolean;
  onShowAll: () => void;
}) {
  const label = filter.charAt(0).toUpperCase() + filter.slice(1);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-24 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#003366]/10 dark:bg-blue-900/30">
        <svg
          className="h-10 w-10 text-[#003366] dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
        {hasSearch
          ? "No matching requests"
          : filter === "all"
            ? "No Leave Requests Yet"
            : `No ${label} Requests`}
      </h3>
      <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {hasSearch
          ? "No request matches that search. Try a student's name, the leave type or a word from the reason."
          : filter === "all"
            ? "When students or staff submit leave requests, they'll appear here for you to review and action."
            : `There are currently no ${filter} leave requests. Check other filters or come back later.`}
      </p>
      {filter !== "all" && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-6 rounded-xl bg-[#003366] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#002244]"
        >
          View All Requests
        </button>
      )}
    </div>
  );
}
