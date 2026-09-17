"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Search } from "lucide-react";
import {
  studentLabel,
  refLabel,
  type TransferRequest,
} from "@/app/services/transit.service";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTransfers } from "@/hooks/transit/useTransfers";
import { useDebouncedValue } from "@/hooks/transit/useTransitUi";
import { cn } from "@/lib/utils";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { TransitEmptyState, TransitErrorState } from "@/components/transit/TransitStates";
import { TransfersTable } from "@/components/transit/TransfersTable";
import { NewTransferButtons } from "@/components/transit/NewTransferButtons";

/** The status tabs, in the order a transfer moves through them. */
const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Requested", value: "requested" },
  { label: "Source Approved", value: "source_approved" },
  { label: "Target Approved", value: "target_approved" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

/** Narrows the loaded page to what the admin typed. */
function matches(transfer: TransferRequest, query: string): boolean {
  if (!query) return true;
  const haystack = [
    studentLabel(transfer.studentId, ""),
    refLabel(transfer.sourceSchoolId, ""),
    refLabel(transfer.targetSchoolId, ""),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/**
 * Every transfer this school is a party to, incoming and outgoing.
 *
 * The status tab is the URL's `?status=`, and the API does that filtering; the
 * search box narrows the page that came back.
 */
export default function TransfersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = useSchoolId();
  const activeStatus = searchParams.get("status") ?? "";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, error, refetch } = useTransfers(activeStatus);

  const transfers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return (data ?? []).filter((transfer) => matches(transfer, query));
  }, [data, debouncedSearch]);

  function selectStatus(status: string) {
    router.replace(`/transit/transfers${status ? `?status=${status}` : ""}`);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", text.strong)}>Transfers</h1>
          <p className={cn("text-sm mt-1", text.muted)}>
            All incoming and outgoing student transfer requests
          </p>
        </div>
        <NewTransferButtons />
      </header>

      <div
        role="tablist"
        aria-label="Transfer status"
        className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-100 dark:border-slate-800"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeStatus === tab.value}
            onClick={() => selectStatus(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeStatus === tab.value
                ? "border-[#003366] dark:border-sky-500 text-[#003366] dark:text-sky-400"
                : cn("border-transparent hover:text-[#030E18] dark:hover:text-slate-100", text.muted)
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", text.muted)} />
        <input
          type="search"
          aria-label="Search transfers by student or school"
          placeholder="Search by student or school..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={cn("w-full pl-9 pr-4 py-2 text-sm rounded-lg", surface.input)}
        />
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <TransitErrorState
          error={error}
          onRetry={() => refetch()}
          fallbackTitle="We couldn't load transfers"
        />
      ) : transfers.length === 0 ? (
        <TransitEmptyState
          icon={ArrowLeftRight}
          title="No transfers found"
          message={
            debouncedSearch
              ? "No transfer matches that search."
              : activeStatus
                ? "No transfer is in this status right now."
                : "Start one with Push Transfer or Pull Transfer."
          }
        />
      ) : (
        <TransfersTable transfers={transfers} schoolId={schoolId} />
      )}
    </div>
  );
}
