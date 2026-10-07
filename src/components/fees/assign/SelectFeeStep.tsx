"use client";

import { useEffect, useState } from "react";
import type { FeeItem } from "@/app/services/fees.service";
import { useFeeItems } from "@/hooks/fees/queries";
import { useDebouncedValue } from "@/hooks/fees/useDebouncedValue";
import { FeesPanelState } from "../FeesPanelState";
import { TablePagination } from "../TablePagination";
import { feeTypeLabel, formatNaira, refName } from "../formatters";
import { Banner, CardHeader, Pill, SearchField, card, cardFrame, sectionTitle, table } from "@/components/tl";
import { cn } from "@/lib/utils";
import {
  strongCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableScrollClass,
} from "../ui";

const PAGE_SIZE = 10;

/** Props for {@link SelectFeeStep}. */
interface SelectFeeStepProps {
  /** The fee picked so far. */
  selectedFee: FeeItem | null;
  /** Picks a fee. */
  onSelect: (fee: FeeItem) => void;
  /** Label of the academic year the assignments will be recorded against. */
  academicYearLabel: string;
}

/**
 * Step 1: pick the active fee to assign. The list is searched and paged by the
 * server, so a school with hundreds of fees still loads one screen.
 *
 * @param props - The current selection and the select handler.
 * @param props.selectedFee - The fee picked so far.
 * @param props.onSelect - Picks a fee.
 * @param props.academicYearLabel - The academic year the assignments go to.
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
    <div className="flex flex-col items-start gap-[18px] lg:flex-row">
      <section className={cn(cardFrame, "w-full min-w-0 flex-1")}>
        <div className="flex flex-col gap-4 p-[clamp(18px,2.4vw,24px)] pb-4">
          <CardHeader title="1. Select Fee" subtitle="Choose the active fee you want to assign." />
          <SearchField
            value={search}
            onChange={setSearch}
            label="Search fees"
            placeholder="Search by fee name..."
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
              <table className={table}>
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="w-12 px-4 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className={tableHeadCellClass}>Fee Name</th>
                    <th className={tableHeadCellClass}>Category</th>
                    <th className={tableHeadCellClass}>Type</th>
                    <th className={tableHeadCellClass}>Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const isSelected = selectedFee?._id === item._id;
                    return (
                      <tr
                        key={item._id}
                        onClick={() => onSelect(item)}
                        className={cn(
                          tableRowClass,
                          "cursor-pointer",
                          isSelected && "bg-tl-select hover:bg-tl-select"
                        )}
                      >
                        <td className="px-4 py-2">
                          <span className="flex h-11 w-6 items-center">
                            <input
                              type="radio"
                              name="assign-fee"
                              checked={isSelected}
                              onChange={() => onSelect(item)}
                              aria-label={`Select ${item.name}`}
                              className="h-4 w-4 accent-tl-brand"
                            />
                          </span>
                        </td>
                        <td className={strongCellClass}>{item.name}</td>
                        <td className={tableCellClass}>{refName(item.categoryId)}</td>
                        <td className={tableCellClass}>
                          <Pill tone="info" className="capitalize">
                            {feeTypeLabel(item.feeType)}
                          </Pill>
                        </td>
                        <td className={cn(strongCellClass, "whitespace-nowrap")}>
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
      </section>

      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
        <section className={`${card} flex flex-col gap-3`}>
          <h3 className={sectionTitle}>Selected Fee Summary</h3>
          {selectedFee ? (
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-tl-muted">Fee Name</dt>
                <dd className="text-right font-bold text-tl-ink">{selectedFee.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-tl-muted">Category</dt>
                <dd>
                  <Pill tone="info">{refName(selectedFee.categoryId)}</Pill>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-tl-muted">Type</dt>
                <dd>
                  <Pill tone="success" className="capitalize">
                    {feeTypeLabel(selectedFee.feeType)}
                  </Pill>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-tl-muted">Academic Year</dt>
                <dd className="font-bold text-tl-ink">{academicYearLabel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-tl-muted">Default Amount</dt>
                <dd className="font-bold text-tl-brand">
                  {formatNaira(selectedFee.defaultAmount)}
                </dd>
              </div>
              {selectedFee.description && (
                <div>
                  <dt className="text-tl-muted">Description</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-tl-ink">
                    {selectedFee.description}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-[13px] text-tl-muted">Select a fee to see its details.</p>
          )}
        </section>

        <Banner tone="info">
          You can set a different amount and due date for each class in the next step.
        </Banner>
      </div>
    </div>
  );
}
