"use client";

import React, { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { useParentFilters, useParentProfileFields, useParents } from "@/hooks/users/useParents";
import RosterErrorState from "@/components/users/RosterErrorState";
import RosterPagination from "@/components/users/RosterPagination";
import ParentsTable, { parentName } from "@/components/users/parents/ParentsTable";
import ParentDetailPanel from "@/components/users/parents/ParentDetailPanel";
import {
  emptyParentStats,
  ParentFiltersBar,
  ParentStatCards,
} from "@/components/users/parents/ParentsToolbar";
import type { Parent } from "@/app/services/parent.service";

/** Rows per page. The API paginates, so this is what it is asked for. */
const PAGE_SIZE = 25;

/** Downloads the parents on screen as a CSV the admin can open in a spreadsheet. */
function exportParents(parents: Parent[]): void {
  const header = "Name,Email,Phone,Children,Status";
  const rows = parents.map((parent) =>
    [
      parentName(parent),
      parent.userId?.email ?? "",
      parent.userId?.phoneNumber ?? "",
      parent.childrenCount ?? parent.children?.length ?? 0,
      parent.userId?.isActive ? "Active" : "Inactive",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "talim-parents.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ParentsDirectory() {
  const filters = useParentFilters();
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const query = useParents({
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.debouncedSearch,
    status: filters.status,
    gender: filters.gender,
    sortBy: filters.sortBy,
  });

  const parents = useMemo(() => query.data?.data ?? [], [query.data]);
  const stats = query.data?.stats ?? emptyParentStats;
  const total = query.data?.meta?.total ?? parents.length;

  const selectedParent = useMemo(
    () => parents.find((parent) => parent._id === selectedParentId) ?? parents[0],
    [parents, selectedParentId]
  );

  const profileUserIds = useMemo(() => {
    if (!selectedParent) return [];
    return [
      selectedParent.userId?._id,
      ...(selectedParent.children ?? []).map((child) => child.userId?._id),
    ].filter((id): id is string => Boolean(id));
  }, [selectedParent]);

  const profiles = useParentProfileFields(profileUserIds);

  return (
    <div className="mx-auto w-full max-w-[1460px] px-[clamp(14px,3vw,26px)] pb-16 pt-[clamp(18px,3vw,28px)]">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="m-0 text-[clamp(24px,3.4vw,32px)] font-extrabold tracking-[-0.6px] text-tl-ink">
              Parents
            </h1>
            <p className="mt-2 text-sm text-tl-muted">View and manage parents information.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => exportParents(parents)}
              disabled={parents.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-tl-line bg-tl-surface px-5 text-sm font-semibold text-tl-body shadow-sm hover:bg-tl-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        <ParentStatCards stats={stats} />

        <ParentFiltersBar
          search={filters.search}
          onSearchChange={filters.setSearch}
          status={filters.status}
          onStatusChange={filters.setStatus}
          gender={filters.gender}
          onGenderChange={filters.setGender}
          sortBy={filters.sortBy}
          onSortChange={filters.setSortBy}
        />

        {query.isError ? (
          <RosterErrorState
            error={query.error}
            resource="parents"
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <ParentsTable
                parents={parents}
                selectedId={selectedParent?._id}
                onSelect={setSelectedParentId}
                isLoading={query.isPending}
                total={total}
              />
              <ParentDetailPanel parent={selectedParent} profiles={profiles} />
            </div>

            {total > PAGE_SIZE && (
              <RosterPagination
                page={filters.page}
                pageSize={PAGE_SIZE}
                total={total}
                pageSizeOptions={[PAGE_SIZE]}
                itemLabel="parents"
                onPageChange={filters.setPage}
                onPageSizeChange={() => undefined}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** `/users/parents` — the parent directory, behind `manage:parents`. */
export default function ParentsPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_PARENTS}>
      <ParentsDirectory />
    </RequirePermission>
  );
}
