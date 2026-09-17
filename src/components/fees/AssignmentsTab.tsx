"use client";

import { useEffect, useState } from "react";
import { FiArchive, FiRefreshCw } from "react-icons/fi";
import { useFeeAssignmentAction } from "@/hooks/fees/mutations";
import { useFeeAssignments } from "@/hooks/fees/queries";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { FeesPanelState } from "./FeesPanelState";
import { TablePagination } from "./TablePagination";
import { formatDate, refName } from "./formatters";
import {
  brandTextClass,
  cardClass,
  iconButtonClass,
  tableBodyClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

const PAGE_SIZE = 10;

/** The two views of the assignment list. */
const SUB_TABS = [
  { id: "assigned", label: "Assigned" },
  { id: "archived", label: "Archived" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

/**
 * The Fee Assignments tab: which fee is attached to which class, with publish,
 * unpublish, archive and restore.
 *
 * @param props - Whether the user may change an assignment.
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
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === tab.id
                ? "border-[#003366] text-[#003366] dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
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
              <table className="w-full text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeadCellClass}>Fee Name</th>
                    <th className={tableHeadCellClass}>Assigned Class</th>
                    <th className={tableHeadCellClass}>Due Date</th>
                    <th className={tableHeadCellClass}>Amount (NGN)</th>
                    <th className={tableHeadCellClass}>Status</th>
                    <th className={tableHeadCellClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className={tableBodyClass}>
                  {rows.map((assignment) => (
                    <tr key={assignment._id} className={tableRowClass}>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                        {refName(assignment.feeItemId)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {refName(assignment.classId)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(assignment.dueDate)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${brandTextClass}`}>
                        {assignment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <FeeStatusBadge status={assignment.status} />
                      </td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <div className="flex items-center gap-1">
                            {assignment.status === "archived" ? (
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() =>
                                  action.mutate({ type: "restore", id: assignment._id })
                                }
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 disabled:opacity-60"
                              >
                                <FiRefreshCw size={12} /> Restore
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
                                    className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 disabled:opacity-60"
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
                                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 disabled:opacity-60"
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
                                  className={`${iconButtonClass} hover:text-red-500 disabled:opacity-60`}
                                  title="Archive"
                                  aria-label="Archive assignment"
                                >
                                  <FiArchive size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
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
