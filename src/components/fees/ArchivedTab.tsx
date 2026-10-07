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
import { Segmented, rowButton, table } from "@/components/tl";
import { cn } from "@/lib/utils";
import {
  actionsCellClass,
  frameClass,
  strongCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

const PAGE_SIZE = 10;

/** Which kind of archived record the tab is showing. */
const TYPES = [
  { value: "categories", label: "Categories" },
  { value: "items", label: "Items" },
  { value: "assignments", label: "Assignments" },
] as const;

/** One kind of archived record. */
type ArchivedType = (typeof TYPES)[number]["value"];

/**
 * The Archived tab: everything that was archived, and the one action that
 * matters — putting it back.
 *
 * @param props - Whether the user may restore records.
 * @param props.canManage - False for an admin without `manage:fees`.
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

  /**
   * Restores one archived record of the kind on show.
   *
   * @param id - The record.
   */
  const restore = (id: string) => {
    if (type === "categories") categoryAction.mutate({ type: "restore", id });
    else if (type === "items") itemAction.mutate({ type: "restore", id });
    else assignmentAction.mutate({ type: "restore", id });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <Segmented
        options={TYPES}
        value={type}
        onChange={setType}
        label="Show archived"
        className="self-start"
      />

      <div className={frameClass}>
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
              <table className={table}>
                <thead>
                  <tr className={tableHeadClass}>
                    <th className={tableHeadCellClass}>Name</th>
                    <th className={tableHeadCellClass}>Archived At</th>
                    <th className={tableHeadCellClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={tableRowClass}>
                      <td className={strongCellClass}>{row.name}</td>
                      <td className={cn(tableCellClass, "whitespace-nowrap text-tl-muted")}>
                        {formatDate(row.updatedAt)}
                      </td>
                      <td className={actionsCellClass}>
                        {canManage ? (
                          <button
                            type="button"
                            disabled={restoring}
                            onClick={() => restore(row.id)}
                            className={rowButton}
                          >
                            <FiRefreshCw size={13} aria-hidden /> Restore
                          </button>
                        ) : (
                          <span className="px-1 text-sm text-tl-faint">—</span>
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
