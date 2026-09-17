"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { transferAbilities } from "@/app/services/transit.service";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTransfer, useTransferAction, type TransferAction } from "@/hooks/transit/useTransfers";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { TransitErrorState } from "@/components/transit/TransitStates";
import { TransferStatusBadge } from "@/components/transit/TransferStatusBadge";
import { TransferProgress } from "@/components/transit/TransferProgress";
import { TransferSummary } from "@/components/transit/TransferSummary";
import { TransferActions } from "@/components/transit/TransferActions";

/** What to say in the toast after each transition succeeds. */
const DONE_MESSAGES: Record<TransferAction["type"], string> = {
  "source-approve": "Student released to the receiving school",
  "target-approve": "Transfer approved",
  accept: "Transfer accepted — the student is now enrolled here",
  reject: "Transfer rejected",
  cancel: "Transfer cancelled",
};

/** What to say when one fails, before the server's own message. */
const FAILED_MESSAGES: Record<TransferAction["type"], string> = {
  "source-approve": "Couldn't release the student",
  "target-approve": "Couldn't approve the transfer",
  accept: "Couldn't accept the transfer",
  reject: "Couldn't reject the transfer",
  cancel: "Couldn't cancel the transfer",
};

/**
 * One transfer request, with the actions this school may take on it.
 *
 * Which side the school is on, and what it may do in the current status, comes
 * from `transferAbilities` — the same order the API enforces: the source school
 * releases the student, then the target school approves and accepts.
 */
export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const schoolId = useSchoolId();

  const { data: transfer, isLoading, isError, error, refetch } = useTransfer(id);
  const action = useTransferAction(id);
  const [pending, setPending] = useState<TransferAction["type"] | null>(null);

  async function run(next: TransferAction) {
    setPending(next.type);
    try {
      await action.mutateAsync(next);
      toast.success(DONE_MESSAGES[next.type]);
    } catch (err) {
      logger.error("transit", `transfer ${next.type} failed`, err);
      toast.error(getErrorMessage(err, FAILED_MESSAGES[next.type]));
    } finally {
      setPending(null);
    }
  }

  const abilities = transferAbilities(transfer, schoolId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.push("/transit/transfers")}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors hover:underline",
          text.muted
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transfers
      </button>

      {isLoading && <SkeletonRows count={4} height="h-24" />}

      {isError && (
        <TransitErrorState
          error={error}
          onRetry={() => refetch()}
          fallbackTitle="We couldn't load this transfer"
        />
      )}

      {transfer && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={cn("text-2xl font-bold", text.strong)}>Transfer Request</h1>
              <p className={cn("text-sm mt-0.5", text.muted)}>ID: {transfer._id}</p>
            </div>
            <TransferStatusBadge status={transfer.status} size="md" />
          </div>

          <TransferProgress status={transfer.status} />

          <TransferSummary transfer={transfer} abilities={abilities} />

          <TransferActions abilities={abilities} pending={pending} onAction={run} />

          {abilities.isTerminal && (
            <div
              className={cn(
                "rounded-xl p-4 flex items-center gap-3 border",
                transfer.status === "accepted"
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300"
                  : cn(surface.inset, text.body)
              )}
            >
              {transfer.status === "accepted" ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <p className="text-sm font-medium">
                This transfer has been <span className="capitalize">{transfer.status}</span>
                {transfer.notes ? ` — ${transfer.notes}` : ""}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
