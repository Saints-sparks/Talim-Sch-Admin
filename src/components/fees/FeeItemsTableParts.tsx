"use client";

import type { FeeItem } from "@/app/services/fees.service";
import { td, th, theadRow } from "@/components/tl";
import { cn } from "@/lib/utils";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { feeTypeLabel, refName } from "./formatters";

/**
 * The shared column headings of a fee items table. The caller adds its own
 * "Actions" heading so the Overview and Fee Structures tables stay one table
 * definition with two sets of row controls.
 *
 * @returns The `thead` element.
 */
export function FeeItemsTableHead() {
  return (
    <thead>
      <tr className={theadRow}>
        <th className={th}>Fee Name</th>
        <th className={th}>Category</th>
        <th className={th}>Fee Type</th>
        <th className={th}>Amount (NGN)</th>
        <th className={th}>Status</th>
        <th className={th}>Actions</th>
      </tr>
    </thead>
  );
}

/**
 * The five data cells of a fee item row, before the actions cell.
 *
 * @param props - The fee item to render.
 * @param props.item - The fee item.
 * @returns The `td` elements.
 */
export function FeeItemCells({ item }: { item: FeeItem }) {
  return (
    <>
      <td className={cn(td, "font-bold text-tl-ink")}>{item.name}</td>
      <td className={td}>{refName(item.categoryId)}</td>
      <td className={cn(td, "capitalize")}>{feeTypeLabel(item.feeType)}</td>
      <td className={cn(td, "whitespace-nowrap font-bold text-tl-ink")}>
        {item.defaultAmount.toLocaleString()}
      </td>
      <td className={td}>
        <FeeStatusBadge status={item.status} />
      </td>
    </>
  );
}
