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
import { StatGrid, focusRing, rowButton, sectionTitle, table } from "@/components/tl";
import {
  actionsCellClass,
  frameClass,
  frameHeaderClass,
  iconButtonClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

/** A row of the fee item actions menu, before its colour. */
const menuRowClass = `flex min-h-[44px] w-full items-center gap-2 px-3.5 py-2 text-left text-sm font-semibold disabled:opacity-60 ${focusRing}`;

/** A row of the fee item actions menu. */
const menuItemClass = `${menuRowClass} text-tl-body hover:bg-tl-subtle`;

/** Fee items shown on the dashboard before the user goes to Fee Structures. */
const OVERVIEW_PAGE_SIZE = 10;

/** Props for {@link OverviewTab}. */
interface OverviewTabProps {
  /** False for an admin without MANAGE_FEES: the table is read-only. */
  canManage: boolean;
}

/**
 * The dashboard tab: the school's fee totals and the most recent fee items.
 *
 * @param props - Whether the user may act on a fee item.
 * @param props.canManage - False for an admin without `manage:fees`.
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
    { status: "active", label: "Publish", icon: <FiUpload size={14} aria-hidden /> },
    { status: "draft", label: "Mark Draft", icon: <FiDownload size={14} aria-hidden /> },
    { status: "inactive", label: "Deactivate", icon: <FiArchive size={14} aria-hidden /> },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <StatGrid label="Fee totals">
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
      </StatGrid>

      <StatGrid label="Collection">
        <FeeStatCard
          label="Paid Amount"
          value={totals ? formatNaira(totals.paidAmount) : "—"}
          sub="Total collected"
          color="text-tl-success"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Outstanding Amount"
          value={totals ? formatNaira(totals.outstandingAmount) : "—"}
          sub="Pending collection"
          color="text-tl-danger"
          loading={loadingTotals}
        />
        <FeeStatCard
          label="Active Assignments"
          value={totals?.activeAssignments ?? "—"}
          sub="Classes assigned"
          loading={loadingTotals}
        />
      </StatGrid>

      {summary.isError && (
        <div className={frameClass}>
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

      <div className={frameClass}>
        <div className={frameHeaderClass}>
          <h2 className={sectionTitle}>Fee Items</h2>
          {canManage && (
            <button
              type="button"
              onClick={() => router.push("/fees-management/create")}
              className={rowButton}
            >
              <FiPlus size={14} aria-hidden /> Create New Fee
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
            <table className={table}>
              <FeeItemsTableHead />
              <tbody>
                {rows.map((item) => (
                  <tr key={item._id} className={tableRowClass}>
                    <FeeItemCells item={item} />
                    <td className={actionsCellClass}>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setViewing(item)}
                          className={iconButtonClass}
                          title="View details"
                          aria-label={`View ${item.name}`}
                        >
                          <FiEye size={16} aria-hidden />
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
                              <FiEdit2 size={16} aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => openMenu(event, item._id)}
                              className={iconButtonClass}
                              title="Actions"
                              aria-label={`Actions for ${item.name}`}
                            >
                              <FiMoreVertical size={16} aria-hidden />
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
            className="fixed z-50 w-44 overflow-hidden rounded-2xl border border-tl-line bg-tl-surface py-1.5 shadow-[0_18px_40px_-20px_rgba(15,27,46,0.35)]"
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
                  className={menuItemClass}
                >
                  {entry.icon} {entry.label}
                </button>
              ))}
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run({ type: "duplicate", id: menuItem._id })}
              className={menuItemClass}
            >
              <FiCopy size={14} aria-hidden /> Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuFor(null);
                router.push(`/fees-management/assign?feeId=${menuItem._id}`);
              }}
              className={menuItemClass}
            >
              <FiPlus size={14} aria-hidden /> Assign to Classes
            </button>
            <hr className="my-1 border-tl-line-soft" />
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run({ type: "archive", id: menuItem._id })}
              className={`${menuRowClass} text-tl-danger hover:bg-tl-danger-bg`}
            >
              <FiArchive size={14} aria-hidden /> Archive
            </button>
          </div>
        </>
      )}

      <FeeItemDetailsModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
