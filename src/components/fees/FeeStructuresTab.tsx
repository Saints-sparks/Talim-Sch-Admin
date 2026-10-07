"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArchive, FiCopy, FiDownload, FiEdit2, FiEye, FiUpload } from "react-icons/fi";
import type { FeeItem, FeeItemStatus } from "@/app/services/fees.service";
import { useFeeItemAction } from "@/hooks/fees/mutations";
import { useFeeCategories, useFeeItems } from "@/hooks/fees/queries";
import { useDebouncedValue } from "@/hooks/fees/useDebouncedValue";
import { FeeItemDetailsModal } from "./FeeItemDetailsModal";
import { FeeItemCells, FeeItemsTableHead } from "./FeeItemsTableParts";
import { FeesPanelState } from "./FeesPanelState";
import { TablePagination } from "./TablePagination";
import { SearchField, selectControl, table } from "@/components/tl";
import { cn } from "@/lib/utils";
import {
  actionsCellClass,
  frameClass,
  iconButtonClass,
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
 * @param props.canManage - False for an admin without `manage:fees`.
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
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search fee structures"
          placeholder="Search fee structures..."
          className="max-w-sm flex-1"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as FeeItemStatus | "")}
          aria-label="Filter by status"
          className={selectControl}
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
          className={selectControl}
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

      <div className={frameClass}>
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
                                onClick={() =>
                                  router.push(`/fees-management/create?edit=${item._id}`)
                                }
                                className={iconButtonClass}
                                title="Edit"
                                aria-label={`Edit ${item.name}`}
                              >
                                <FiEdit2 size={16} aria-hidden />
                              </button>
                              {item.status !== "active" ? (
                                <button
                                  type="button"
                                  disabled={action.isPending}
                                  onClick={() =>
                                    action.mutate({ type: "status", id: item._id, status: "active" })
                                  }
                                  className={cn(iconButtonClass, "hover:bg-tl-success-bg hover:text-tl-success")}
                                  title="Publish"
                                  aria-label={`Publish ${item.name}`}
                                >
                                  <FiUpload size={16} aria-hidden />
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
                                  className={cn(iconButtonClass, "hover:bg-tl-warning-bg hover:text-tl-warning")}
                                  title="Deactivate"
                                  aria-label={`Deactivate ${item.name}`}
                                >
                                  <FiDownload size={16} aria-hidden />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() => action.mutate({ type: "duplicate", id: item._id })}
                                className={iconButtonClass}
                                title="Duplicate"
                                aria-label={`Duplicate ${item.name}`}
                              >
                                <FiCopy size={16} aria-hidden />
                              </button>
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() => action.mutate({ type: "archive", id: item._id })}
                                className={cn(iconButtonClass, "hover:bg-tl-danger-bg hover:text-tl-danger")}
                                title="Archive"
                                aria-label={`Archive ${item.name}`}
                              >
                                <FiArchive size={16} aria-hidden />
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
