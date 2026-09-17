"use client";

import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import {
  useFeeAssignmentAction,
  useFeeCategoryAction,
  useFeeItemAction,
} from "@/hooks/fees/mutations";
import { useFeeAssignments, useFeeCategories, useFeeItems } from "@/hooks/fees/queries";
import { FeesPanelState } from "./FeesPanelState";
import { TablePagination } from "./TablePagination";
import { formatDate, refName } from "./formatters";
import {
  cardClass,
  tableBodyClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

const PAGE_SIZE = 10;

/** Which kind of archived record the tab is showing. */
const TYPES = [
  { id: "categories", label: "categories" },
  { id: "items", label: "items" },
  { id: "assignments", label: "assignments" },
] as const;

type ArchivedType = (typeof TYPES)[number]["id"];

/**
 * The Archived tab: everything that was archived, and the one action that
 * matters — putting it back.
 *
 * @param props - Whether the user may restore records.
 * @returns The Archived tab.
 */
export function ArchivedTab({ canManage }: { canManage: boolean }) {
  const [type, setType] = useState<ArchivedType>("categories");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [type]);

  const categories = useFeeCategories(true);
  const items = useFeeItems(
    { page, limit: PAGE_SIZE, status: "archived" },
    { enabled: type === "items" }
  );
  const assignments = useFeeAssignments(
    { page, limit: PAGE_SIZE, status: "archived" },
    { enabled: type === "assignments" }
  );

  const categoryAction = useFeeCategoryAction();
  const itemAction = useFeeItemAction();
  const assignmentAction = useFeeAssignmentAction();

  const archivedCategories = (categories.data ?? []).filter(
    (category) => category.status === "archived"
  );

  const query =
    type === "categories" ? categories : type === "items" ? items : assignments;

  const rows: Array<{ id: string; name: string; updatedAt: string }> =
    type === "categories"
      ? archivedCategories.map((category) => ({
          id: category._id,
          name: category.name,
          updatedAt: category.updatedAt,
        }))
      : type === "items"
        ? (items.data?.data ?? []).map((item) => ({
            id: item._id,
            name: item.name,
            updatedAt: item.updatedAt,
          }))
        : (assignments.data?.data ?? []).map((assignment) => ({
            id: assignment._id,
            name: `${refName(assignment.feeItemId)} · ${refName(assignment.classId)}`,
            updatedAt: assignment.updatedAt,
          }));

  const total =
    type === "categories"
      ? archivedCategories.length
      : type === "items"
        ? items.data?.total ?? 0
        : assignments.data?.total ?? 0;
  const restoring =
    categoryAction.isPending || itemAction.isPending || assignmentAction.isPending;

  const restore = (id: string) => {
    if (type === "categories") categoryAction.mutate({ type: "restore", id });
    else if (type === "items") itemAction.mutate({ type: "restore", id });
    else assignmentAction.mutate({ type: "restore", id });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TYPES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setType(entry.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
              type === entry.id
                ? "bg-[#003366] text-white dark:bg-blue-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <FeesPanelState
          loading={query.isPending}
          error={query.error}
          empty={rows.length === 0}
          subject={`archived ${type}`}
          emptyMessage={`No archived ${type} found.`}
          onRetry={() => query.refetch()}
          rows={3}
        />

        {!query.isPending && !query.isError && rows.length > 0 && (
          <>
            <div className={tableScrollClass}>
              <table className="w-full text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeadCellClass}>Name</th>
                    <th className={tableHeadCellClass}>Archived At</th>
                    <th className={tableHeadCellClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className={tableBodyClass}>
                  {rows.map((row) => (
                    <tr key={row.id} className={tableRowClass}>
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <button
                            type="button"
                            disabled={restoring}
                            onClick={() => restore(row.id)}
                            className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900 px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 disabled:opacity-60"
                          >
                            <FiRefreshCw size={12} /> Restore
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {type !== "categories" && (
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                busy={query.isFetching}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
