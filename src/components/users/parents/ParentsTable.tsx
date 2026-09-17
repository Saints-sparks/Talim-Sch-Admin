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
        selected
          ? "border-[#003366] bg-blue-50/70 dark:border-blue-500 dark:bg-blue-900/20"
          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50",
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
              <p className="truncate font-semibold text-slate-950 dark:text-white">{parentName(parent)}</p>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                {parent.userId?.email ?? "-"}
              </p>
            </div>
            <StatusBadge active={parent.userId?.isActive !== false} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Phone" value={parent.userId?.phoneNumber ?? "-"} />
            <Info label="Children" value={String(parent.childrenCount ?? parent.children?.length ?? 0)} />
            <Info label="Joined" value={formatDate(parent.userId?.createdAt ?? parent.createdAt)} />
            <Info label="Action" value={selected ? "Viewing" : "Tap to view"} />
          </div>
        </div>
      </div>
    </button>
  );
}

/** The parents list: cards on phones, a scrollable table from `md` up. */
export function ParentsTable({ parents, selectedId, onSelect, isLoading, total }: ParentsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <div className="space-y-3 p-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />
          ))
        ) : parents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
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
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-300">
            <tr>
              <th className="px-5 py-4">Parent</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Children</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Joined On</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-5 py-4" colSpan={6}>
                    <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
                  </td>
                </tr>
              ))
            ) : parents.length === 0 ? (
              <tr>
                <td className="px-5 py-14 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={6}>
                  No parents found.
                </td>
              </tr>
            ) : (
              parents.map((parent) => (
                <tr
                  key={parent._id}
                  onClick={() => onSelect(parent._id)}
                  className={cn(
                    "cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700/50",
                    selectedId === parent._id && "bg-blue-50/50 dark:bg-blue-900/20",
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
                        <p className="font-semibold text-slate-950 dark:text-white">{parentName(parent)}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {parent.userId?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {parent.userId?.phoneNumber ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {parent.childrenCount ?? parent.children?.length ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge active={parent.userId?.isActive !== false} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
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
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#003366] dark:hover:text-blue-400"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`More actions for ${parentName(parent)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
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

      <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-700 px-4 py-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p>
          Showing {parents.length} of {total} parents
        </p>
      </div>
    </section>
  );
}

export default ParentsTable;
