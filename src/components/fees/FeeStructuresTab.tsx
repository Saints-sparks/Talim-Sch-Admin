"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArchive, FiCopy, FiDownload, FiEdit2, FiEye, FiSearch, FiUpload } from "react-icons/fi";
import type { FeeItem, FeeItemStatus } from "@/app/services/fees.service";
import { useFeeItemAction } from "@/hooks/fees/mutations";
import { useFeeCategories, useFeeItems } from "@/hooks/fees/queries";
import { useDebouncedValue } from "@/hooks/fees/useDebouncedValue";
import { FeeItemDetailsModal } from "./FeeItemDetailsModal";
import { FeeItemCells, FeeItemsTableHead } from "./FeeItemsTableParts";
import { FeesPanelState } from "./FeesPanelState";
import { TablePagination } from "./TablePagination";
import {
  cardClass,
  iconButtonClass,
  inputClass,
  tableBodyClass,
  tableRowClass,
  tableScrollClass,
} from "./ui";

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: FeeItemStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "inactive", label: "Inactive" },
];

/**
 * The Fee Structures tab: every fee item, searched and paged by the server,
 * with the row actions an admin needs.
 *
 * @param props - Whether the user may change a fee item.
 * @returns The Fee Structures tab.
 */
export function FeeStructuresTab({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FeeItemStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<FeeItem | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const categories = useFeeCategories();
  const action = useFeeItemAction();

  // A narrowed filter can leave the user on a page that no longer exists.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, categoryId]);

  const items = useFeeItems({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
  });

  const rows = items.data?.data ?? [];
  const total = items.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search fee structures..."
            aria-label="Search fee structures"
            className={`${inputClass} pl-8`}
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as FeeItemStatus | "")}
          aria-label="Filter by status"
          className={`${inputClass} w-auto`}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-label="Filter by category"
          className={`${inputClass} w-auto`}
          disabled={categories.isPending || (categories.data ?? []).length === 0}
        >
          <option value="">All categories</option>
          {(categories.data ?? []).map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <FeesPanelState
          loading={items.isPending}
          error={items.error}
          empty={rows.length === 0}
          subject="fee structures"
          emptyMessage={
            debouncedSearch || status || categoryId
              ? "No fee structures match those filters."
              : "No fee structures yet. Create your first fee."
          }
          onRetry={() => items.refetch()}
        />

        {!items.isPending && !items.isError && rows.length > 0 && (
          <>
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
                                onClick={() =>
                                  router.push(`/fees-management/create?edit=${item._id}`)
                                }
                                className={iconButtonClass}
                                title="Edit"
                                aria-label={`Edit ${item.name}`}
                              >
                                <FiEdit2 size={14} />
                              </button>
                              {item.status !== "active" ? (
                                <button
                                  type="button"
                                  disabled={action.isPending}
                                  onClick={() =>
                                    action.mutate({ type: "status", id: item._id, status: "active" })
                                  }
                                  className={`${iconButtonClass} hover:text-green-600 disabled:opacity-60`}
                                  title="Publish"
                                  aria-label={`Publish ${item.name}`}
                                >
                                  <FiUpload size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={action.isPending}
                                  onClick={() =>
                                    action.mutate({
                                      type: "status",
                                      id: item._id,
                                      status: "inactive",
                                    })
                                  }
                                  className={`${iconButtonClass} hover:text-yellow-600 disabled:opacity-60`}
                                  title="Deactivate"
                                  aria-label={`Deactivate ${item.name}`}
                                >
                                  <FiDownload size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() => action.mutate({ type: "duplicate", id: item._id })}
                                className={`${iconButtonClass} disabled:opacity-60`}
                                title="Duplicate"
                                aria-label={`Duplicate ${item.name}`}
                              >
                                <FiCopy size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() => action.mutate({ type: "archive", id: item._id })}
                                className={`${iconButtonClass} hover:text-red-500 disabled:opacity-60`}
                                title="Archive"
                                aria-label={`Archive ${item.name}`}
                              >
                                <FiArchive size={14} />
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
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              busy={items.isFetching}
            />
          </>
        )}
      </div>

      <FeeItemDetailsModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
