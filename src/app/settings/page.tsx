"use client";

import React, { useState } from "react";
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";
import { SchoolProfileSection } from "@/components/settings/SchoolProfileSection";
import { AdminAccountSection } from "@/components/settings/AdminAccountSection";
import { AcademicSetupSection } from "@/components/settings/AcademicSetupSection";
import { ClassesCurriculumSection } from "@/components/settings/ClassesCurriculumSection";
import { AssessmentSettingsSection } from "@/components/settings/AssessmentSettingsSection";
import { FeesReceiptsSection } from "@/components/settings/FeesReceiptsSection";
import { PaymentsFinanceSection } from "@/components/settings/PaymentsFinanceSection";
import { CommunicationSection } from "@/components/settings/CommunicationSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { DataSystemSection } from "@/components/settings/DataSystemSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import {
  visibleSections,
  type SectionId,
  type SettingsSectionProps,
} from "@/components/settings/sections";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";

// ─── Main Settings Page ───────────────────────────────────────────────────────

const SECTION_MAP: Record<SectionId, React.ComponentType<SettingsSectionProps>> = {
  "school-profile": SchoolProfileSection,
  "admin-account": AdminAccountSection,
  "academic-setup": AcademicSetupSection,
  "classes-curriculum": ClassesCurriculumSection,
  "assessment-settings": AssessmentSettingsSection,
  "fees-receipts": FeesReceiptsSection,
  "payments-finance": PaymentsFinanceSection,
  communication: CommunicationSection,
  notifications: NotificationsSection,
  security: SecuritySection,
  "data-system": DataSystemSection,
  appearance: AppearanceSection,
  "sub-admins": SubAdminsSection,
};

/**
 * Settings — a sidebar of sections, one rendered at a time.
 *
 * The route itself already requires `manage:settings` (RouteGuard reads
 * `routePermissions`); `canManage` passes the same fact down so a role without
 * it never sees an edit control it cannot use. Sub-Admins is reserved for the
 * primary school admin.
 */
export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("school-profile");
  const { hasPermission, isFullAdmin } = usePermissions();

  const canManage = hasPermission(Permission.MANAGE_SETTINGS);
  const canManageSubAdmins = isFullAdmin && hasPermission(Permission.MANAGE_SUB_ADMINS);
  const sections = visibleSections(canManageSubAdmins);

  // A tab that stops being visible (role change, session refresh) falls back.
  const current = sections.some((s) => s.id === active) ? active : "school-profile";
  const ActiveSection = SECTION_MAP[current];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">Settings</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Manage your school&apos;s preferences
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Settings sections">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = current === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-colors ${
                  isActive
                    ? "bg-[#EBF0F7] dark:bg-slate-700 text-[#003366] dark:text-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-[#003366] dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${isActive ? "text-[#003366] dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[10px] text-gray-400 dark:text-slate-600">Talim School Admin v2.0</p>
        </div>
      </aside>

      {/* Right Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <ActiveSection canManage={canManage} onNavigate={setActive} />
        </div>
      </main>
    </div>
  );
}
