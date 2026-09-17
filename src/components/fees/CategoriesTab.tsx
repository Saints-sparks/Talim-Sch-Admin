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
import {
  cardClass,
  headingClass,
  iconButtonClass,
  primaryButtonClass,
  tableBodyClass,
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between gap-3">
          <h3 className={`font-semibold text-sm ${headingClass}`}>Fee Categories</h3>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg ${primaryButtonClass}`}
            >
              <FiPlus size={12} /> Create Category
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
            <table className="w-full text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableHeadCellClass}>Category Name</th>
                  <th className={tableHeadCellClass}>Description</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableHeadCellClass}>Actions</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {rows.map((category) => (
                  <tr key={category._id} className={tableRowClass}>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                      {category.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <FeeStatusBadge status={category.status} />
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <div className="flex items-center gap-1">
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
                            <FiEdit2 size={14} />
                          </button>
                          {category.status === "active" ? (
                            <button
                              type="button"
                              disabled={action.isPending}
                              onClick={() => action.mutate({ type: "archive", id: category._id })}
                              className={`${iconButtonClass} hover:text-red-500 disabled:opacity-60`}
                              title="Archive"
                              aria-label={`Archive ${category.name}`}
                            >
                              <FiArchive size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={action.isPending}
                              onClick={() => action.mutate({ type: "restore", id: category._id })}
                              className={`${iconButtonClass} hover:text-green-600 disabled:opacity-60`}
                              title="Restore"
                              aria-label={`Restore ${category.name}`}
                            >
                              <FiRefreshCw size={14} />
                            </button>
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
