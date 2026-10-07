"use client";

import { useMemo, useState } from "react";
import { FiArchive, FiEdit2, FiPlus, FiRefreshCw } from "react-icons/fi";
import type { FeeCategory } from "@/app/services/fees.service";
import { useFeeCategoryAction } from "@/hooks/fees/mutations";
import { useFeeCategories, useFeeCategoriesSummary } from "@/hooks/fees/queries";
import { FeeCategoryModal } from "./FeeCategoryModal";
import { FeeStatCard } from "./FeeStatCard";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { FeesPanelState } from "./FeesPanelState";
import { StatGrid, rowButton, sectionTitle, table } from "@/components/tl";
import { cn } from "@/lib/utils";
import {
  actionsCellClass,
  frameClass,
  frameHeaderClass,
  iconButtonClass,
  strongCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

/**
 * The Fee Categories tab: the category counts, the list, and the create/edit
 * dialog.
 *
 * @param props - Whether the user may change categories.
 * @param props.canManage - False for an admin without `manage:fees`.
 * @returns The Categories tab.
 */
export function CategoriesTab({ canManage }: { canManage: boolean }) {
  const categories = useFeeCategories(true);
  const counts = useFeeCategoriesSummary();
  const action = useFeeCategoryAction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeeCategory | null>(null);

  const rows = useMemo(() => categories.data ?? [], [categories.data]);
  const activeCount = rows.filter((category) => category.status === "active").length;
  const archivedCount = rows.filter((category) => category.status === "archived").length;
  const totalItems = (counts.data ?? []).reduce(
    (sum, category) => sum + (category.feeCount ?? 0),
    0
  );

  const handleSave = (name: string, description: string) =>
    action.mutateAsync(
      editing
        ? { type: "update", id: editing._id, payload: { name, description } }
        : { type: "create", payload: { name, description } }
    );

  return (
    <div className="flex flex-col gap-[18px]">
      <StatGrid label="Category totals">
        <FeeStatCard
          label="Total Categories"
          value={rows.length}
          sub="All fee categories"
          loading={categories.isPending}
        />
        <FeeStatCard
          label="Active Categories"
          value={activeCount}
          sub="Currently active"
          loading={categories.isPending}
        />
        <FeeStatCard
          label="Archived Categories"
          value={archivedCount}
          sub={archivedCount === 0 ? "No archived categories" : "Restorable"}
          loading={categories.isPending}
        />
        <FeeStatCard
          label="Total Fee Items"
          value={counts.isError ? "—" : totalItems}
          sub="Across all categories"
          loading={counts.isPending}
        />
      </StatGrid>

      <div className={frameClass}>
        <div className={frameHeaderClass}>
          <h2 className={sectionTitle}>Fee Categories</h2>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className={rowButton}
            >
              <FiPlus size={14} aria-hidden /> Create Category
            </button>
          )}
        </div>

        <FeesPanelState
          loading={categories.isPending}
          error={categories.error}
          empty={rows.length === 0}
          subject="fee categories"
          emptyMessage="No categories yet. Create your first category."
          onRetry={() => categories.refetch()}
          rows={4}
        />

        {!categories.isPending && !categories.isError && rows.length > 0 && (
          <div className={tableScrollClass}>
            <table className={table}>
              <thead>
                <tr className={tableHeadClass}>
                  <th className={tableHeadCellClass}>Category Name</th>
                  <th className={tableHeadCellClass}>Description</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableHeadCellClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((category) => (
                  <tr key={category._id} className={tableRowClass}>
                    <td className={strongCellClass}>{category.name}</td>
                    <td className={cn(tableCellClass, "max-w-xs truncate text-tl-muted")}>
                      {category.description || "—"}
                    </td>
                    <td className={tableCellClass}>
                      <FeeStatusBadge status={category.status} />
                    </td>
                    <td className={actionsCellClass}>
                      {canManage ? (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(category);
                              setModalOpen(true);
                            }}
                            className={iconButtonClass}
                            title="Edit"
                            aria-label={`Edit ${category.name}`}
                          >
                            <FiEdit2 size={16} aria-hidden />
                          </button>
                          {category.status === "active" ? (
                            <button
                              type="button"
                              disabled={action.isPending}
                              onClick={() => action.mutate({ type: "archive", id: category._id })}
                              className={cn(iconButtonClass, "hover:bg-tl-danger-bg hover:text-tl-danger")}
                              title="Archive"
                              aria-label={`Archive ${category.name}`}
                            >
                              <FiArchive size={16} aria-hidden />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={action.isPending}
                              onClick={() => action.mutate({ type: "restore", id: category._id })}
                              className={cn(iconButtonClass, "hover:bg-tl-success-bg hover:text-tl-success")}
                              title="Restore"
                              aria-label={`Restore ${category.name}`}
                            >
                              <FiRefreshCw size={16} aria-hidden />
                            </button>
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
        )}
      </div>

      {canManage && (
        <FeeCategoryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          editing={editing}
          saving={action.isPending}
        />
      )}
    </div>
  );
}
