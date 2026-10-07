"use client";

import React from "react";
import { Eye, MoreVertical } from "lucide-react";
import Avatar from "@/components/Avatar";
import { cn } from "@/lib/utils";
import type { Parent } from "@/app/services/parent.service";
import { formatDate, Info, StatusBadge } from "./atoms";

/** A parent's display name, or a placeholder when the account has no name. */
export function parentName(parent: Parent): string {
  return (
    `${parent.userId?.firstName ?? ""} ${parent.userId?.lastName ?? ""}`.trim() || "Unknown Parent"
  );
}

interface ParentsTableProps {
  /** The parents on the current page. */
  parents: Parent[];
  /** The parent whose detail panel is showing. */
  selectedId?: string;
  /** Selects a parent. */
  onSelect: (parentId: string) => void;
  /** True while the page is loading. */
  isLoading: boolean;
  /** Total parents the server reports across all pages. */
  total: number;
}

function ParentMobileCard({
  parent,
  selected,
  onSelect,
}: {
  parent: Parent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition",
        selected ? "border-tl-brand bg-tl-select" : "border-tl-line bg-tl-surface hover:bg-tl-bg"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={parent.userId?.userAvatar}
          firstName={parent.userId?.firstName}
          lastName={parent.userId?.lastName}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-tl-ink">{parentName(parent)}</p>
              <p className="mt-1 truncate text-sm text-tl-muted">{parent.userId?.email ?? "-"}</p>
            </div>
            <StatusBadge active={parent.userId?.isActive !== false} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Phone" value={parent.userId?.phoneNumber ?? "-"} />
            <Info
              label="Children"
              value={String(parent.childrenCount ?? parent.children?.length ?? 0)}
            />
            <Info label="Joined" value={formatDate(parent.userId?.createdAt ?? parent.createdAt)} />
            <Info label="Action" value={selected ? "Viewing" : "Tap to view"} />
          </div>
        </div>
      </div>
    </button>
  );
}

/** The parents list: cards on phones, a scrollable table from `md` up. */
export function ParentsTable({
  parents,
  selectedId,
  onSelect,
  isLoading,
  total,
}: ParentsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-tl-line bg-tl-surface shadow-sm">
      <div className="space-y-3 p-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-tl-track" />
          ))
        ) : parents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-tl-line px-4 py-10 text-center text-sm text-tl-muted">
            No parents found.
          </div>
        ) : (
          parents.map((parent) => (
            <ParentMobileCard
              key={parent._id}
              parent={parent}
              selected={selectedId === parent._id}
              onSelect={() => onSelect(parent._id)}
            />
          ))
        )}
      </div>

      <div className="hidden max-h-[60vh] overflow-auto md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead className="sticky top-0 z-10 bg-tl-subtle text-xs font-semibold text-tl-muted">
            <tr>
              <th className="px-5 py-4">Parent</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Children</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Joined On</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tl-line-soft">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-5 py-4" colSpan={6}>
                    <div className="h-10 animate-pulse rounded-xl bg-tl-track" />
                  </td>
                </tr>
              ))
            ) : parents.length === 0 ? (
              <tr>
                <td className="px-5 py-14 text-center text-sm text-tl-muted" colSpan={6}>
                  No parents found.
                </td>
              </tr>
            ) : (
              parents.map((parent) => (
                <tr
                  key={parent._id}
                  onClick={() => onSelect(parent._id)}
                  className={cn(
                    "cursor-pointer transition hover:bg-tl-bg",
                    selectedId === parent._id && "bg-tl-select"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={parent.userId?.userAvatar}
                        firstName={parent.userId?.firstName}
                        lastName={parent.userId?.lastName}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold text-tl-ink">{parentName(parent)}</p>
                        <p className="mt-1 text-sm text-tl-muted">{parent.userId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-tl-muted">
                    {parent.userId?.phoneNumber ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-tl-body">
                    {parent.childrenCount ?? parent.children?.length ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge active={parent.userId?.isActive !== false} />
                  </td>
                  <td className="px-5 py-4 text-sm text-tl-muted">
                    {formatDate(parent.userId?.createdAt ?? parent.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label={`View ${parentName(parent)}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(parent._id);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-tl-line text-tl-muted hover:bg-tl-select hover:text-tl-brand"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`More actions for ${parentName(parent)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-tl-line text-tl-muted hover:bg-tl-bg"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-tl-line px-4 py-4 text-sm text-tl-muted sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p>
          Showing {parents.length} of {total} parents
        </p>
      </div>
    </section>
  );
}

export default ParentsTable;
