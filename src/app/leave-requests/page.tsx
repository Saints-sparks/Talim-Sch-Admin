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
import { Page, PageHeader } from "@/components/tl/Page";
import { EmptyNote } from "@/components/tl/states";
import { cardFrame, primaryButton } from "@/components/tl/styles";

/**
 * The leave-request review queue, in the tl page layout: heading, the status
 * filter and search, then the request cards.
 *
 * @returns The page.
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

  /**
   * Approves or rejects one request in place.
   *
   * @param leaveId - The request.
   * @param decision - Approve or reject.
   */
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

  const header = (
    <PageHeader
      eyebrowText="Communication"
      title="Request Leave"
      subtitle="Leave requests from students and staff. Approve or reject them here, or open one for the details."
    />
  );

  if (queue.isLoading) {
    return (
      <Page>
        {header}
        <LeaveRequestSkeleton />
      </Page>
    );
  }

  if (queue.isError) {
    return (
      <Page>
        {header}
        <ErrorState
          title="Error Loading Leave Requests"
          message={getErrorMessage(queue.error, "Failed to fetch leave requests")}
          onRetry={() => void queue.refetch()}
        />
      </Page>
    );
  }

  return (
    <Page guide="leave-requests">
      {header}
      <LeaveRequestFilters
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        counts={counts}
      />

      {visible.length === 0 ? (
        <EmptyQueue
          filter={filter}
          hasSearch={Boolean(search.trim())}
          onShowAll={() => setFilter("all")}
        />
      ) : (
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
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
    </Page>
  );
}

/**
 * What the queue shows when nothing matches the active tab or search.
 *
 * @param props - The filter, whether a search is typed, and "show all".
 * @param props.filter - The active tab.
 * @param props.hasSearch - Whether a search is typed.
 * @param props.onShowAll - Switches to All.
 * @returns The empty state.
 */
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
    <div className={cardFrame}>
      <EmptyNote
        title={
          hasSearch
            ? "No matching requests"
            : filter === "all"
              ? "No Leave Requests Yet"
              : `No ${label} Requests`
        }
        action={
          filter !== "all" ? (
            <button type="button" onClick={onShowAll} className={primaryButton}>
              View All Requests
            </button>
          ) : undefined
        }
      >
        {hasSearch
          ? "No request matches that search. Try a student's name, the leave type or a word from the reason."
          : filter === "all"
            ? "When students or staff submit leave requests, they'll appear here for you to review and action."
            : `There are currently no ${filter} leave requests. Check other filters or come back later.`}
      </EmptyNote>
    </div>
  );
}
