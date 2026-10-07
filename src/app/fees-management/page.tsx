"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronDown, FiPlus } from "react-icons/fi";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { ArchivedTab } from "@/components/fees/ArchivedTab";
import { AssignmentsTab } from "@/components/fees/AssignmentsTab";
import { CategoriesTab } from "@/components/fees/CategoriesTab";
import { FeeStructuresTab } from "@/components/fees/FeeStructuresTab";
import { FeesSidebar } from "@/components/fees/FeesSidebar";
import { OverviewTab } from "@/components/fees/OverviewTab";
import { BankTransfersLink } from "@/components/payments/bankTransfers/BankTransfersLink";
import { Page, PageHeader, Tabs, focusRing, primaryButton } from "@/components/tl";
import { useCanManageFees } from "@/hooks/fees/permissions";
import { Permission } from "@/lib/permissions";

/** The page's sections, in tab order. */
const TABS = [
  { value: "overview", label: "Overview" },
  { value: "categories", label: "Fee Categories" },
  { value: "structures", label: "Fee Structures" },
  { value: "assignments", label: "Fee Assignments" },
  { value: "archived", label: "Archived" },
] as const;

/** One of the page's sections. */
type Tab = (typeof TABS)[number]["value"];

/** A row of the "Create New Fee" menu. */
const menuItemClass = `flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-tl-body hover:bg-tl-subtle ${focusRing}`;

/**
 * The fees dashboard. Each tab owns its own cached queries, so switching tabs
 * costs nothing and a mutation in one tab refreshes the others through the
 * fees invalidators.
 *
 * @returns The fees management screen.
 */
function FeesManagementScreen() {
  const router = useRouter();
  const canManage = useCanManageFees();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!createMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!createMenuRef.current?.contains(event.target as Node)) setCreateMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [createMenuOpen]);

  /**
   * Closes the create menu and opens a fees page.
   *
   * @param path - The page to open.
   */
  const go = (path: string) => {
    setCreateMenuOpen(false);
    router.push(path);
  };

  return (
    <Page>
      <PageHeader
        title="Fees Management"
        subtitle="Create, manage and assign multiple fees to one or more classes."
        actions={
          <>
            <BankTransfersLink />
            {canManage && (
              <div className="relative" ref={createMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={createMenuOpen}
                  onClick={() => setCreateMenuOpen((open) => !open)}
                  className={primaryButton}
                >
                  <FiPlus size={16} aria-hidden /> Create New Fee{" "}
                  <FiChevronDown size={15} aria-hidden />
                </button>
                {createMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-tl-line bg-tl-surface py-1.5 shadow-[0_18px_40px_-20px_rgba(15,27,46,0.35)]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => go("/fees-management/create")}
                      className={menuItemClass}
                    >
                      <FiPlus size={15} aria-hidden className="text-tl-faint" /> Create New Fee
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => go("/fees-management/assign")}
                      className={menuItemClass}
                    >
                      <FiPlus size={15} aria-hidden className="text-tl-faint" /> Add Existing Fee
                      to Classes
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        }
      />

      <Tabs
        options={TABS}
        value={activeTab}
        onChange={setActiveTab}
        label="Fees sections"
        idPrefix="fees"
      />

      <div className="flex flex-col items-start gap-[18px] lg:flex-row">
        <div
          role="tabpanel"
          id="fees-panel"
          aria-labelledby={`fees-tab-${activeTab}`}
          className="w-full min-w-0 flex-1"
        >
          {activeTab === "overview" && <OverviewTab canManage={canManage} />}
          {activeTab === "categories" && <CategoriesTab canManage={canManage} />}
          {activeTab === "structures" && <FeeStructuresTab canManage={canManage} />}
          {activeTab === "assignments" && <AssignmentsTab canManage={canManage} />}
          {activeTab === "archived" && <ArchivedTab canManage={canManage} />}
        </div>

        <FeesSidebar canManage={canManage} onViewCategories={() => setActiveTab("categories")} />
      </div>
    </Page>
  );
}

/**
 * Fees is money: the whole area needs `manage:fees`, the same permission the
 * backend's `FeesController` requires on every route.
 *
 * @returns The guarded fees page.
 */
export default function FeesManagementPage() {
  return (
    <RequirePermission permission={Permission.MANAGE_FEES}>
      <FeesManagementScreen />
    </RequirePermission>
  );
}
