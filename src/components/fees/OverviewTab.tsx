"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  FiArchive,
  FiCopy,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMoreVertical,
  FiPlus,
  FiUpload,
} from "react-icons/fi";
import type { FeeItem, FeeItemStatus } from "@/app/services/fees.service";
import { useFeeItemAction } from "@/hooks/fees/mutations";
import { useFeeItems, useFeesSummary } from "@/hooks/fees/queries";
import { FeeItemDetailsModal } from "./FeeItemDetailsModal";
import { FeeItemCells, FeeItemsTableHead } from "./FeeItemsTableParts";
import { FeeStatCard } from "./FeeStatCard";
import { FeesPanelState } from "./FeesPanelState";
import { formatNaira } from "./formatters";
import {
  cardClass,
  headingClass,
  iconButtonClass,
  primaryButtonClass,
  tableBodyClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

/** Fee items shown on the dashboard before the user goes to Fee Structures. */
const OVERVIEW_PAGE_SIZE = 10;

interface OverviewTabProps {
  /** False for an admin without MANAGE_FEES: the table is read-only. */
  canManage: boolean;
}

/**
 * The dashboard tab: the school's fee totals and the most recent fee items.
 *
 * @param props - Whether the user may act on a fee item.
 * @returns The Overview tab.
 */
export function OverviewTab({ canManage }: OverviewTabProps) {
  const router = useRouter();
  const summary = useFeesSummary();
  const items = useFeeItems({ page: 1, limit: OVERVIEW_PAGE_SIZE });
  const action = useFeeItemAction();

  const [menuFor, setMenuFor] = useState<{ id: string; x: number; y: number } | null>(null);
  const [viewing, setViewing] = useState<FeeItem | null>(null);

  // A menu positioned against the viewport must not linger where it was.
  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuFor]);

  const rows = items.data?.data ?? [];
  const totals = summary.data;
  const loadingTotals = summary.isPending;

  const openMenu = (event: MouseEvent<HTMLButtonElement>, id: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuFor((current) => (current?.id === id ? null : { id, x: rect.right - 176, y: rect.bottom + 6 }));
  };

  const run = (next: Parameters<typeof action.mutate>[0]) => {
    setMenuFor(null);
    action.mutate(next);
  };

  const menuItem = menuFor ? rows.find((row) => row._id === menuFor.id) : null;

  const statusActions: Array<{ status: FeeItemStatus; label: string; icon: ReactNode }> = [
    { status: "active", label: "Publish", icon: <FiUpload size={12} /> },
    { status: "draft", label: "Mark Draft", icon: <FiDownload size={12} /> },
    { status: "inactive", label: "Deactivate", icon: <FiArchive size={12} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FeeStatCard
          label="Total Fee Items"
          value={totals?.totalFeeItems ?? "—"}
          sub="Across all categories"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Active Fee Items"
          value={totals?.activeFeeItems ?? "—"}
          sub="Currently active"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Total Expected Amount"
          value={totals ? formatNaira(totals.totalExpectedAmount) : "—"}
          sub="This academic year"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Fee Categories"
          value={totals?.feeCategories ?? "—"}
          sub="Custom categories"
          loading={loadingTotals}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeeStatCard
          label="Paid Amount"
          value={totals ? formatNaira(totals.paidAmount) : "—"}
          sub="Total collected"
          color="text-green-600 dark:text-green-400"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Outstanding Amount"
          value={totals ? formatNaira(totals.outstandingAmount) : "—"}
          sub="Pending collection"
          color="text-red-500 dark:text-red-400"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Active Assignments"
          value={totals?.activeAssignments ?? "—"}
          sub="Classes assigned"
          loading={loadingTotals}
        />
      </div>

      {summary.isError && (
        <div className={`${cardClass} overflow-hidden`}>
          <FeesPanelState
            loading={false}
            error={summary.error}
            empty={false}
            subject="the fee totals"
            emptyMessage=""
            onRetry={() => summary.refetch()}
          />
        </div>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between gap-3">
          <h3 className={`font-semibold text-sm ${headingClass}`}>Fee Items</h3>
          {canManage && (
            <button
              type="button"
              onClick={() => router.push("/fees-management/create")}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg ${primaryButtonClass}`}
            >
              <FiPlus size={12} /> Create New Fee
            </button>
          )}
        </div>

        <FeesPanelState
          loading={items.isPending}
          error={items.error}
          empty={rows.length === 0}
          subject="fee items"
          emptyMessage="No fee items yet. Create your first fee."
          onRetry={() => items.refetch()}
        />

        {!items.isPending && !items.isError && rows.length > 0 && (
          <div className={tableScrollClass}>
            <table className="w-full text-sm">
              <FeeItemsTableHead />
              <tbody className={tableBodyClass}>
                {rows.map((item) => (
                  <tr key={item._id} className={tableRowClass}>
                    <FeeItemCells item={item} />
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(item)}
                          className={iconButtonClass}
                          title="View details"
                          aria-label={`View ${item.name}`}
                        >
                          <FiEye size={14} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => router.push(`/fees-management/create?edit=${item._id}`)}
                              className={iconButtonClass}
                              title="Edit"
                              aria-label={`Edit ${item.name}`}
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => openMenu(event, item._id)}
                              className={iconButtonClass}
                              title="Actions"
                              aria-label={`Actions for ${item.name}`}
                            >
                              <FiMoreVertical size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {menuFor && menuItem && canManage && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close fee item actions"
            onClick={() => setMenuFor(null)}
          />
          <div
            className="fixed bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg py-1 z-50 w-44"
            style={{ left: Math.max(8, menuFor.x), top: menuFor.y }}
          >
            {statusActions
              .filter((entry) => menuItem.status !== entry.status)
              .map((entry) => (
                <button
                  key={entry.status}
                  type="button"
                  disabled={action.isPending}
                  onClick={() => run({ type: "status", id: menuItem._id, status: entry.status })}
                  className="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-60"
                >
                  {entry.icon} {entry.label}
                </button>
              ))}
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run({ type: "duplicate", id: menuItem._id })}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-60"
            >
              <FiCopy size={12} /> Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuFor(null);
                router.push(`/fees-management/assign?feeId=${menuItem._id}`);
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <FiPlus size={12} /> Assign to Classes
            </button>
            <hr className="my-1 border-gray-100 dark:border-gray-800" />
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run({ type: "archive", id: menuItem._id })}
              className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 disabled:opacity-60"
            >
              <FiArchive size={12} /> Archive
            </button>
          </div>
        </>
      )}

      <FeeItemDetailsModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
