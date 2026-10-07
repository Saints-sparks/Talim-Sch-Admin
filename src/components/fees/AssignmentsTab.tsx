"use client";

import { useEffect, useState } from "react";
import { FiArchive, FiRefreshCw } from "react-icons/fi";
import { useFeeAssignmentAction } from "@/hooks/fees/mutations";
import { useFeeAssignments } from "@/hooks/fees/queries";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { FeesPanelState } from "./FeesPanelState";
import { TablePagination } from "./TablePagination";
import { formatDate, refName } from "./formatters";
import { Segmented, rowButton, table } from "@/components/tl";
import { cn } from "@/lib/utils";
import {
  actionsCellClass,
  frameClass,
  iconButtonClass,
  strongCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

const PAGE_SIZE = 10;

/** The two views of the assignment list. */
const SUB_TABS = [
  { value: "assigned", label: "Assigned" },
  { value: "archived", label: "Archived" },
] as const;

/** One of the two views. */
type SubTab = (typeof SUB_TABS)[number]["value"];

/**
 * The Fee Assignments tab: which fee is attached to which class, with publish,
 * unpublish, archive and restore.
 *
 * @param props - Whether the user may change an assignment.
 * @param props.canManage - False for an admin without `manage:fees`.
 * @returns The Assignments tab.
 */
export function AssignmentsTab({ canManage }: { canManage: boolean }) {
  const [subTab, setSubTab] = useState<SubTab>("assigned");
  const [page, setPage] = useState(1);
  const action = useFeeAssignmentAction();

  useEffect(() => {
    setPage(1);
  }, [subTab]);

  const assignments = useFeeAssignments(
    subTab === "archived"
      ? { page, limit: PAGE_SIZE, status: "archived" }
      : { page, limit: PAGE_SIZE }
  );

  const rows = assignments.data?.data ?? [];
  const total = assignments.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-[18px]">
      <Segmented
        options={SUB_TABS}
        value={subTab}
        onChange={setSubTab}
        label="Show assignments"
        className="self-start"
      />

      <div className={frameClass}>
        <FeesPanelState
          loading={assignments.isPending}
          error={assignments.error}
          empty={rows.length === 0}
          subject="fee assignments"
          emptyMessage={
            subTab === "archived"
              ? "No archived assignments."
              : "No assignments yet. Assign a fee to a class to get started."
          }
          onRetry={() => assignments.refetch()}
        />

        {!assignments.isPending && !assignments.isError && rows.length > 0 && (
          <>
            <div className={tableScrollClass}>
              <table className={table}>
                <thead>
                  <tr className={tableHeadClass}>
                    <th className={tableHeadCellClass}>Fee Name</th>
                    <th className={tableHeadCellClass}>Assigned Class</th>
                    <th className={tableHeadCellClass}>Due Date</th>
                    <th className={tableHeadCellClass}>Amount (NGN)</th>
                    <th className={tableHeadCellClass}>Status</th>
                    <th className={tableHeadCellClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((assignment) => (
                    <tr key={assignment._id} className={tableRowClass}>
                      <td className={strongCellClass}>{refName(assignment.feeItemId)}</td>
                      <td className={tableCellClass}>{refName(assignment.classId)}</td>
                      <td className={cn(tableCellClass, "whitespace-nowrap")}>
                        {formatDate(assignment.dueDate)}
                      </td>
                      <td className={cn(strongCellClass, "whitespace-nowrap")}>
                        {assignment.amount.toLocaleString()}
                      </td>
                      <td className={tableCellClass}>
                        <FeeStatusBadge status={assignment.status} />
                      </td>
                      <td className={actionsCellClass}>
                        {canManage ? (
                          <div className="flex items-center gap-1.5">
                            {assignment.status === "archived" ? (
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() =>
                                  action.mutate({ type: "restore", id: assignment._id })
                                }
                                className={rowButton}
                              >
                                <FiRefreshCw size={13} aria-hidden /> Restore
                              </button>
                            ) : (
                              <>
                                {assignment.status === "active" ? (
                                  <button
                                    type="button"
                                    disabled={action.isPending}
                                    onClick={() =>
                                      action.mutate({ type: "unpublish", id: assignment._id })
                                    }
                                    className={rowButton}
                                  >
                                    Unpublish
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={action.isPending}
                                    onClick={() =>
                                      action.mutate({ type: "publish", id: assignment._id })
                                    }
                                    className={rowButton}
                                  >
                                    Publish
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={action.isPending}
                                  onClick={() =>
                                    action.mutate({ type: "archive", id: assignment._id })
                                  }
                                  className={cn(iconButtonClass, "hover:bg-tl-danger-bg hover:text-tl-danger")}
                                  title="Archive"
                                  aria-label="Archive assignment"
                                >
                                  <FiArchive size={16} aria-hidden />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="px-1 text-sm text-tl-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              busy={assignments.isFetching}
            />
          </>
        )}
      </div>
    </div>
  );
}
