"use client";

import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { FeeItem } from "@/app/services/fees.service";
import { useFeeItems } from "@/hooks/fees/queries";
import { useDebouncedValue } from "@/hooks/fees/useDebouncedValue";
import { FeesPanelState } from "../FeesPanelState";
import { TablePagination } from "../TablePagination";
import { feeTypeLabel, formatNaira, refName } from "../formatters";
import {
  brandTextClass,
  cardClass,
  headingClass,
  inputClass,
  mutedTextClass,
  tableBodyClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "../ui";

const PAGE_SIZE = 10;

interface SelectFeeStepProps {
  selectedFee: FeeItem | null;
  onSelect: (fee: FeeItem) => void;
  /** Label of the academic year the assignments will be recorded against. */
  academicYearLabel: string;
}

/**
 * Step 1: pick the active fee to assign. The list is searched and paged by the
 * server, so a school with hundreds of fees still loads one screen.
 *
 * @param props - The current selection and the select handler.
 * @returns The step.
 */
export function SelectFeeStep({ selectedFee, onSelect, academicYearLabel }: SelectFeeStepProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const items = useFeeItems({
    page,
    limit: PAGE_SIZE,
    status: "active",
    search: debouncedSearch.trim() || undefined,
  });

  const rows = items.data?.data ?? [];
  const total = items.data?.total ?? 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 min-w-0 ${cardClass} p-4 space-y-4`}>
        <div>
          <h2 className={`font-semibold ${headingClass}`}>1. Select Fee</h2>
          <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
            Choose the active fee you want to assign.
          </p>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by fee name..."
            aria-label="Search fees"
            className={`${inputClass} pl-9`}
          />
        </div>

        <FeesPanelState
          loading={items.isPending}
          error={items.error}
          empty={rows.length === 0}
          subject="fee items"
          emptyMessage={
            debouncedSearch
              ? "No active fee matches that search."
              : "No active fees yet. Create and publish a fee first."
          }
          onRetry={() => items.refetch()}
        />

        {!items.isPending && !items.isError && rows.length > 0 && (
          <>
            <div className={tableScrollClass}>
              <table className="w-full text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="w-8 px-4 py-3" />
                    <th className={tableHeadCellClass}>Fee Name</th>
                    <th className={tableHeadCellClass}>Category</th>
                    <th className={tableHeadCellClass}>Type</th>
                    <th className={tableHeadCellClass}>Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody className={tableBodyClass}>
                  {rows.map((item) => {
                    const isSelected = selectedFee?._id === item._id;
                    return (
                      <tr
                        key={item._id}
                        onClick={() => onSelect(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-[#003366]/5 dark:bg-blue-400/10" : tableRowClass
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="radio"
                            name="assign-fee"
                            checked={isSelected}
                            onChange={() => onSelect(item)}
                            aria-label={`Select ${item.name}`}
                            className="accent-[#003366]"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {refName(item.categoryId)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize">
                            {feeTypeLabel(item.feeType)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-medium ${brandTextClass}`}>
                          {item.defaultAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
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

      <div className="w-full lg:w-64 shrink-0">
        <div className={`${cardClass} p-4 space-y-3`}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Selected Fee Summary
          </h3>
          {selectedFee ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className={mutedTextClass}>Fee Name</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 text-right">
                  {selectedFee.name}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className={mutedTextClass}>Category</span>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {refName(selectedFee.categoryId)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className={mutedTextClass}>Type</span>
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full capitalize">
                  {feeTypeLabel(selectedFee.feeType)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={mutedTextClass}>Academic Year</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {academicYearLabel}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={mutedTextClass}>Default Amount</span>
                <span className={`font-medium ${brandTextClass}`}>
                  {formatNaira(selectedFee.defaultAmount)}
                </span>
              </div>
              {selectedFee.description && (
                <div>
                  <span className={mutedTextClass}>Description</span>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-xs mt-0.5">
                    {selectedFee.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className={`text-xs ${mutedTextClass}`}>Select a fee to see its details.</p>
          )}
        </div>

        <div className="mt-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
          You can set a different amount and due date for each class in the next step.
        </div>
      </div>
    </div>
  );
}
