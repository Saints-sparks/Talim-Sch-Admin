"use client";

import type { FeeItem } from "@/app/services/fees.service";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { feeTypeLabel, refName } from "./formatters";
import { brandTextClass, tableHeadCellClass, tableHeadClass } from "./ui";

/**
 * The shared column headings of a fee items table. The caller adds its own
 * "Actions" heading so the Overview and Fee Structures tables stay one table
 * definition with two sets of row controls.
 *
 * @returns The `thead` element.
 */
export function FeeItemsTableHead() {
  return (
    <thead className={tableHeadClass}>
      <tr>
        <th className={tableHeadCellClass}>Fee Name</th>
        <th className={tableHeadCellClass}>Category</th>
        <th className={tableHeadCellClass}>Fee Type</th>
        <th className={tableHeadCellClass}>Amount (NGN)</th>
        <th className={tableHeadCellClass}>Status</th>
        <th className={tableHeadCellClass}>Actions</th>
      </tr>
    </thead>
  );
}

/**
 * The five data cells of a fee item row, before the actions cell.
 *
 * @param props - The fee item to render.
 * @returns The `td` elements.
 */
export function FeeItemCells({ item }: { item: FeeItem }) {
  return (
    <>
      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{refName(item.categoryId)}</td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
        {feeTypeLabel(item.feeType)}
      </td>
      <td className={`px-4 py-3 font-medium ${brandTextClass}`}>
        {item.defaultAmount.toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <FeeStatusBadge status={item.status} />
      </td>
    </>
  );
}
