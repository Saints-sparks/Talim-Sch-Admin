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
  STATUS_TONE,
  leaveTypeLabel,
  statusKey,
  statusValue,
  studentAvatar,
  studentName,
} from "@/components/leave/leave.presentation";
import { useLeaveRequest, useUpdateLeaveStatus } from "@/hooks/leave/useLeaveRequests";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { ArrowLeft } from "lucide-react";
import { Page, PageHeader } from "@/components/tl/Page";
import { Pill } from "@/components/tl/bits";
import {
  cardFrame,
  cardTitle,
  fieldLabel,
  sectionTitle,
  textLink,
  textareaControl,
} from "@/components/tl/styles";

/**
 * The leave-request detail screen in the tl layout: Back, the heading, the
 * request card (who, status, details), and Take Action while pending.
 *
 * @returns The page.
 */
export default function LeaveRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leaveId = typeof params.id === "string" ? params.id : "";

  const [declineReason, setDeclineReason] = useState("");
  const request = useLeaveRequest(leaveId);
  const decide = useUpdateLeaveStatus();

  const goBack = () => router.push("/leave-requests");

  /**
   * Approves or rejects the request (a rejection carries the optional reason).
   *
   * @param decision - Approve or reject.
   */
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
      toast.error(
        getErrorMessage(
          error,
          `Failed to ${decision === "approved" ? "approve" : "reject"} request`
        )
      );
    }
  };

  return (
    <Page guide="leave-request">
      <button type="button" onClick={goBack} className={`${textLink} self-start`}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </button>
      <PageHeader title="Leave Request Details" />

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
        <div className={cardFrame}>
          <div className="border-b border-tl-line-soft bg-tl-subtle px-[clamp(18px,2.4vw,24px)] py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {/* Plain <img>: avatars come from arbitrary upload hosts and next/image has no remotePatterns configured. */}
                <img
                  src={studentAvatar(request.data)}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_AVATAR;
                  }}
                />
                <div className="min-w-0">
                  <h2 className={`${cardTitle} truncate`}>{studentName(request.data)}</h2>
                  <p className="text-sm text-tl-muted">
                    {[
                      request.data.studentProfile?.gradeLevel,
                      leaveTypeLabel(request.data.leaveType),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              </div>
              <Pill tone={STATUS_TONE[statusKey(request.data.status)]} dot className="capitalize">
                {statusKey(request.data.status)}
              </Pill>
            </div>
          </div>

          <div className="p-[clamp(18px,2.4vw,24px)]">
            <LeaveRequestDetails request={request.data} />

            {statusKey(request.data.status) === "pending" ? (
              <div className="mt-6 border-t border-tl-line-soft pt-6">
                <h3 className={`${sectionTitle} mb-4`}>Take Action</h3>
                <div className="mb-4 flex flex-col gap-1.5">
                  <label htmlFor="decline-reason" className={fieldLabel}>
                    Reason for rejection (optional — shown to the parent)
                  </label>
                  <textarea
                    id="decline-reason"
                    value={declineReason}
                    onChange={(event) => setDeclineReason(event.target.value)}
                    placeholder="Explain why this leave cannot be approved..."
                    rows={3}
                    className={textareaControl}
                  />
                </div>
                <LeaveDecisionActions
                  variant="detail"
                  isPending={decide.isPending}
                  onApprove={() => void handleDecision("approved")}
                  onReject={() => void handleDecision("rejected")}
                  fallback={
                    <p className="text-sm text-tl-muted">
                      You don&apos;t have permission to action leave requests.
                    </p>
                  }
                />
              </div>
            ) : (
              <div className="mt-6 border-t border-tl-line-soft pt-6">
                <p className="rounded-2xl border border-tl-line-soft bg-tl-subtle p-4 text-center text-sm text-tl-muted">
                  This request has already been {statusKey(request.data.status)}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
