"use client";

import { useRouter } from "next/navigation";
import { SectionSkeleton } from "@/components/ui/loading";
import { useFeeCategoriesSummary, useReceiptSettings } from "@/hooks/fees/queries";
import { feesErrorMessage } from "./errors";
import { ReceiptSignatureCard } from "./ReceiptSignatureCard";
import { brandTextClass, cardClass, mutedTextClass } from "./ui";

/** How many categories fit in the sidebar before "View All". */
const SIDEBAR_CATEGORIES = 6;

interface FeesSidebarProps {
  /** Switches the main area to the Fee Categories tab. */
  onViewCategories: () => void;
  /** False for an admin without MANAGE_FEES. */
  canManage: boolean;
}

/**
 * The right-hand column: category counts, the shortcuts, and the receipt
 * signature card.
 *
 * @param props - Tab switcher and whether the user may change fees.
 * @returns The sidebar.
 */
export function FeesSidebar({ onViewCategories, canManage }: FeesSidebarProps) {
  const router = useRouter();
  const categories = useFeeCategoriesSummary();
  const receipt = useReceiptSettings();

  const active = (categories.data ?? []).filter((category) => category.status === "active");

  return (
    <div className="w-full lg:w-64 shrink-0 space-y-4">
      <div className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Fee Categories</h3>
          <button
            type="button"
            onClick={onViewCategories}
            className={`text-xs hover:underline ${brandTextClass}`}
          >
            View All
          </button>
        </div>
        {categories.isPending ? (
          <SectionSkeleton rows={3} rowClassName="h-6" />
        ) : categories.isError ? (
          <p className="text-xs text-red-500">{feesErrorMessage(categories.error, "categories")}</p>
        ) : active.length === 0 ? (
          <p className={`text-xs ${mutedTextClass}`}>No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {active.slice(0, SIDEBAR_CATEGORIES).map((category) => (
              <div key={category._id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {category.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {category.feeCount ?? 0} Items
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {canManage && (
        <div className={`${cardClass} p-4`}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push("/fees-management/create")}
              className={`w-full text-left text-xs hover:underline py-1 ${brandTextClass}`}
            >
              Create New Fee
            </button>
            <button
              type="button"
              onClick={() => router.push("/fees-management/assign")}
              className={`w-full text-left text-xs hover:underline py-1 ${brandTextClass}`}
            >
              Add Existing Fee to Classes
            </button>
          </div>
        </div>
      )}

      <ReceiptSignatureCard
        settings={receipt.data}
        loading={receipt.isPending}
        error={receipt.error}
        canEdit={canManage}
      />
    </div>
  );
}
