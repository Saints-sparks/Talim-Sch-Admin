"use client";

import { useRouter } from "next/navigation";
import { card, sectionTitle, skeletonBlock, textLink } from "@/components/tl";
import {
  useFeeCategoriesSummary,
  useReceiptSettings,
  useReceiptSettingsAccess,
} from "@/hooks/fees/queries";
import { feesErrorMessage } from "./errors";
import { ReceiptSignatureCard } from "./ReceiptSignatureCard";

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
 * The signature is a receipt setting, kept at `/settings/receipt` (A5). A
 * fees admin may read it (the card shows the signature), but changing it
 * needs `manage:settings`, so only then are the controls offered.
 *
 * @param props - Tab switcher and whether the user may change fees.
 * @param props.onViewCategories - Switches the main area to the Fee Categories tab.
 * @param props.canManage - False for an admin without `manage:fees`.
 * @returns The sidebar.
 */
export function FeesSidebar({ onViewCategories, canManage }: FeesSidebarProps) {
  const router = useRouter();
  const categories = useFeeCategoriesSummary();
  const receiptAccess = useReceiptSettingsAccess();
  const receipt = useReceiptSettings();

  const active = (categories.data ?? []).filter((category) => category.status === "active");

  return (
    <aside aria-label="Fees shortcuts" className="flex w-full shrink-0 flex-col gap-[18px] lg:w-72">
      <section className={card}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className={sectionTitle}>Fee Categories</h2>
          <button type="button" onClick={onViewCategories} className={textLink}>
            View All
          </button>
        </div>
        {categories.isPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Loading categories</span>
            {[0, 1, 2].map((row) => (
              <div key={row} aria-hidden className={`${skeletonBlock} h-6 rounded-lg`} />
            ))}
          </div>
        ) : categories.isError ? (
          <p className="text-[13px] font-semibold text-tl-danger">
            {feesErrorMessage(categories.error, "categories")}
          </p>
        ) : active.length === 0 ? (
          <p className="text-[13px] text-tl-muted">No categories yet.</p>
        ) : (
          <ul className="flex flex-col">
            {active.slice(0, SIDEBAR_CATEGORIES).map((category) => (
              <li
                key={category._id}
                className="flex items-center justify-between gap-2 border-t border-tl-line-soft py-2.5 first:border-t-0"
              >
                <span className="truncate text-sm font-semibold text-tl-body">{category.name}</span>
                <span className="shrink-0 text-[13px] text-tl-muted">
                  {category.feeCount ?? 0} Items
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <section className={card}>
          <h2 className={`${sectionTitle} mb-1`}>Quick Actions</h2>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => router.push("/fees-management/create")}
              className={textLink}
            >
              Create New Fee
            </button>
            <button
              type="button"
              onClick={() => router.push("/fees-management/assign")}
              className={textLink}
            >
              Add Existing Fee to Classes
            </button>
          </div>
        </section>
      )}

      {receiptAccess.canRead && (
        <ReceiptSignatureCard
          settings={receipt.data}
          loading={receipt.isPending}
          error={receipt.error}
          canEdit={receiptAccess.canEdit}
        />
      )}
    </aside>
  );
}
