"use client";

import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";
import type { FeeItem } from "@/app/services/fees.service";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { feeTypeLabel, formatDate, formatNaira, refName } from "./formatters";
import { brandTextClass, bodyTextClass, headingClass, modalBackdropClass, modalPanelClass, mutedTextClass } from "./ui";

/**
 * Read-only detail view of one fee item.
 *
 * @param props - The item to show (null closes the modal) and the close handler.
 * @returns The modal, or null when nothing is selected.
 */
export function FeeItemDetailsModal({
  item,
  onClose,
}: {
  item: FeeItem | null;
  onClose: () => void;
}) {
  useBodyScrollLock(Boolean(item));
  if (!item) return null;

  const facts: Array<{ label: string; value: ReactNode }> = [
    { label: "Category", value: refName(item.categoryId) },
    { label: "Status", value: <FeeStatusBadge status={item.status} /> },
    { label: "Fee Type", value: <span className="capitalize">{feeTypeLabel(item.feeType)}</span> },
    { label: "Amount", value: <span className={brandTextClass}>{formatNaira(item.defaultAmount)}</span> },
    { label: "Due Date", value: formatDate(item.defaultDueDate, "Not set") },
    { label: "Late Fee", value: formatNaira(item.lateFeeAmount || 0) },
  ];

  return (
    <div className={modalBackdropClass} role="dialog" aria-modal="true" aria-label={item.name}>
      <div className={`${modalPanelClass} max-w-lg`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className={`text-lg font-semibold ${headingClass}`}>{item.name}</h3>
            <p className={`text-sm mt-1 ${mutedTextClass}`}>{item.description || "No description"}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close fee details"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {facts.map((fact) => (
            <div key={fact.label}>
              <p className="text-xs text-gray-400 dark:text-gray-500">{fact.label}</p>
              <div className={`font-medium mt-0.5 ${bodyTextClass}`}>{fact.value}</div>
            </div>
          ))}
        </div>

        <div className={`mt-5 border-t border-gray-100 dark:border-gray-800 pt-4 grid gap-2 text-sm ${mutedTextClass}`}>
          <p>
            Visible to parents:{" "}
            <span className="font-medium">{item.isVisibleToParents ? "Yes" : "No"}</span>
          </p>
          <p>
            Included in collection:{" "}
            <span className="font-medium">{item.includeInCollection ? "Yes" : "No"}</span>
          </p>
          <p>
            Partial payment:{" "}
            <span className="font-medium">{item.allowPartialPayment ? "Allowed" : "Not allowed"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
