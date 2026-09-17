"use client";

/**
 * One leave request, with everything a reviewer needs to decide it.
 *
 * The decision goes through the same mutation as the queue, so approving here
 * invalidates the queue behind it. A rejection can carry a reason, which the
 * API stores as `declineReason` and shows to the parent — the old "admin
 * comments" box was never sent anywhere.
 */
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/CustomToast";
import { ErrorState, LoadingState } from "@/components/StateComponents";
import { LeaveDecisionActions } from "@/components/leave/LeaveDecisionActions";
import { LeaveRequestDetails } from "@/components/leave/LeaveRequestDetails";
import {
  FALLBACK_AVATAR,
  STATUS_BADGE,
  statusKey,
  statusValue,
  studentAvatar,
  studentName,
} from "@/components/leave/leave.presentation";
import { useLeaveRequest, useUpdateLeaveStatus } from "@/hooks/leave/useLeaveRequests";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

/**
 * The leave-request detail screen.
 */
export default function LeaveRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leaveId = typeof params.id === "string" ? params.id : "";

  const [declineReason, setDeclineReason] = useState("");
  const request = useLeaveRequest(leaveId);
  const decide = useUpdateLeaveStatus();

  const goBack = () => router.push("/leave-requests");

  const handleDecision = async (decision: "approved" | "rejected") => {
    try {
      await decide.mutateAsync({
        leaveId,
        status: statusValue(decision),
        viewed: true,
        declineReason: decision === "rejected" ? declineReason.trim() || undefined : undefined,
      });
      toast.success(
        decision === "approved" ? "Leave request approved successfully!" : "Leave request rejected."
      );
      setDeclineReason("");
    } catch (error) {
      logger.error("leave-requests", `Failed to mark request ${decision}`, error);
      toast.error(getErrorMessage(error, `Failed to ${decision === "approved" ? "approve" : "reject"} request`));
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-900">
      <div className="flex-shrink-0 px-6 py-4">
        <div className="flex items-center">
          <button
            type="button"
            onClick={goBack}
            className="mr-4 rounded-md p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Leave Request Details
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6">
        <div className="h-full overflow-y-auto pb-6">
          {request.isLoading ? (
            <LoadingState message="Loading leave request..." />
          ) : request.isError ? (
            <ErrorState
              title="Couldn't load this leave request"
              message={getErrorMessage(request.error, "Failed to fetch leave request")}
              onRetry={() => void request.refetch()}
            />
          ) : !request.data ? (
            <ErrorState
              title="Request Not Found"
              message="The leave request you're looking for doesn't exist."
              onRetry={goBack}
              retryText="Back to Leave Requests"
            />
          ) : (
            <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-slate-800">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center">
                    {/* Plain <img>: avatars come from arbitrary upload hosts and next/image has no remotePatterns configured. */}
                    <img
                      src={studentAvatar(request.data)}
                      alt=""
                      className="mr-4 h-16 w-16 shrink-0 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_AVATAR;
                      }}
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-slate-800 dark:text-slate-100">
                        {studentName(request.data)}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400">
                        {[request.data.studentProfile?.gradeLevel, request.data.leaveType]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium capitalize",
                      STATUS_BADGE[statusKey(request.data.status)]
                    )}
                  >
                    {statusKey(request.data.status)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <LeaveRequestDetails request={request.data} />

                {statusKey(request.data.status) === "pending" ? (
                  <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                    <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Take Action
                    </h3>
                    <div className="mb-4">
                      <label
                        htmlFor="decline-reason"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Reason for rejection (optional — shown to the parent)
                      </label>
                      <textarea
                        id="decline-reason"
                        value={declineReason}
                        onChange={(event) => setDeclineReason(event.target.value)}
                        placeholder="Explain why this leave cannot be approved..."
                        rows={3}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <LeaveDecisionActions
                      variant="detail"
                      isPending={decide.isPending}
                      onApprove={() => void handleDecision("approved")}
                      onReject={() => void handleDecision("rejected")}
                      fallback={
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          You don&apos;t have permission to action leave requests.
                        </p>
                      }
                    />
                  </div>
                ) : (
                  <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                    <p className="rounded-md bg-slate-50 p-4 text-center text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                      This request has already been {statusKey(request.data.status)}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
