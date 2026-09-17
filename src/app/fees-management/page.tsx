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
import { headingClass, mutedTextClass, pageClass, primaryButtonClass } from "@/components/fees/ui";
import { useCanManageFees } from "@/hooks/fees/permissions";
import { Permission } from "@/lib/permissions";

const TABS = ["Overview", "Fee Categories", "Fee Structures", "Fee Assignments", "Archived"] as const;

type Tab = (typeof TABS)[number];

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
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
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

  const go = (path: string) => {
    setCreateMenuOpen(false);
    router.push(path);
  };

  return (
    <div className={pageClass}>
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-bold ${headingClass}`}>Fees Management</h1>
            <p className={`text-sm mt-0.5 ${mutedTextClass}`}>
              Create, manage and assign multiple fees to one or more classes.
            </p>
          </div>

          {canManage && (
            <div className="relative" ref={createMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={createMenuOpen}
                onClick={() => setCreateMenuOpen((open) => !open)}
                className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2 ${primaryButtonClass}`}
              >
                <FiPlus size={15} /> Create New Fee <FiChevronDown size={14} />
              </button>
              {createMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg py-1 z-20 w-52"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => go("/fees-management/create")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FiPlus size={14} /> Create New Fee
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => go("/fees-management/assign")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FiPlus size={14} /> Add Existing Fee to Classes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "border-[#003366] text-[#003366] dark:border-blue-400 dark:text-blue-300"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Overview" && <OverviewTab canManage={canManage} />}
            {activeTab === "Fee Categories" && <CategoriesTab canManage={canManage} />}
            {activeTab === "Fee Structures" && <FeeStructuresTab canManage={canManage} />}
            {activeTab === "Fee Assignments" && <AssignmentsTab canManage={canManage} />}
            {activeTab === "Archived" && <ArchivedTab canManage={canManage} />}
          </div>

          <FeesSidebar
            canManage={canManage}
            onViewCategories={() => setActiveTab("Fee Categories")}
          />
        </div>
      </div>
    </div>
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
