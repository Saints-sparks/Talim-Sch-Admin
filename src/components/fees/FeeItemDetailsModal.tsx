"use client";

import type { ReactNode } from "react";
import type { FeeItem } from "@/app/services/fees.service";
import { Sheet, eyebrow, tile } from "@/components/tl";
import { cn } from "@/lib/utils";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { feeTypeLabel, formatDate, formatNaira, refName } from "./formatters";

/**
 * Read-only detail view of one fee item, in the design system's sheet (named
 * by the fee's name).
 *
 * @param props - The item to show (null closes the sheet) and the close handler.
 * @param props.item - The fee item, or null.
 * @param props.onClose - Closes the sheet.
 * @returns The sheet, or null when nothing is selected.
 */
export function FeeItemDetailsModal({
  item,
  onClose,
}: {
  item: FeeItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const facts: Array<{ label: string; value: ReactNode }> = [
    { label: "Category", value: refName(item.categoryId) },
    { label: "Status", value: <FeeStatusBadge status={item.status} /> },
    { label: "Fee Type", value: <span className="capitalize">{feeTypeLabel(item.feeType)}</span> },
    { label: "Amount", value: formatNaira(item.defaultAmount) },
    { label: "Due Date", value: formatDate(item.defaultDueDate, "Not set") },
    { label: "Late Fee", value: formatNaira(item.lateFeeAmount || 0) },
  ];

  const settings: Array<{ label: string; value: string }> = [
    { label: "Visible to parents", value: item.isVisibleToParents ? "Yes" : "No" },
    { label: "Included in collection", value: item.includeInCollection ? "Yes" : "No" },
    { label: "Partial payment", value: item.allowPartialPayment ? "Allowed" : "Not allowed" },
  ];

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={item.name}
      subtitle={item.description || "No description"}
    >
      <dl className="grid grid-cols-2 gap-2.5">
        {facts.map((fact) => (
          <div key={fact.label} className={cn(tile, "py-3")}>
            <dt className={eyebrow}>{fact.label}</dt>
            <dd className="mt-1 text-sm font-bold text-tl-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <dl className="flex flex-col border-t border-tl-line-soft pt-2 text-sm">
        {settings.map((setting) => (
          <div key={setting.label} className="flex items-center justify-between gap-3 py-1.5">
            <dt className="text-tl-muted">{setting.label}:</dt>
            <dd className="font-bold text-tl-ink">{setting.value}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
