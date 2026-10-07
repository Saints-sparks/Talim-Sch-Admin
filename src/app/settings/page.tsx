"use client";

import React, { useEffect, useState } from "react";
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";
import { SchoolProfileSection } from "@/components/settings/SchoolProfileSection";
import { AdminAccountSection } from "@/components/settings/AdminAccountSection";
import { AcademicSetupSection } from "@/components/settings/AcademicSetupSection";
import { SchoolDaySection } from "@/components/settings/SchoolDaySection";
import { SchoolCalendarSection } from "@/components/settings/SchoolCalendarSection";
import { ClassesCurriculumSection } from "@/components/settings/ClassesCurriculumSection";
import { AssessmentSettingsSection } from "@/components/settings/AssessmentSettingsSection";
import { GradingSection } from "@/components/settings/GradingSection";
import { FeesReceiptsSection } from "@/components/settings/FeesReceiptsSection";
import { PaymentsFinanceSection } from "@/components/settings/PaymentsFinanceSection";
import { CommunicationSection } from "@/components/settings/CommunicationSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { DataSystemSection } from "@/components/settings/DataSystemSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import {
  sectionFromQuery,
  visibleSections,
  type SectionId,
  type SettingsSectionProps,
} from "@/components/settings/sections";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { versionLabel } from "@/lib/appVersion";
import { PageHeader } from "@/components/tl/Page";
import { cardFrame, focusRing, pagePad, pageStack } from "@/components/tl/styles";

// ─── Main Settings Page ───────────────────────────────────────────────────────

const SECTION_MAP: Record<SectionId, React.ComponentType<SettingsSectionProps>> = {
  "school-profile": SchoolProfileSection,
  "admin-account": AdminAccountSection,
  "academic-setup": AcademicSetupSection,
  "school-day": SchoolDaySection,
  "school-calendar": SchoolCalendarSection,
  "classes-curriculum": ClassesCurriculumSection,
  "assessment-settings": AssessmentSettingsSection,
  grading: GradingSection,
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
 * Settings — a list of sections beside the content (a scrolling row above it
 * on narrow screens), one section rendered at a time, in the tl layout.
 *
 * The route itself already requires `manage:settings` (RouteGuard reads
 * `routePermissions`); `canManage` passes the same fact down so a role without
 * it never sees an edit control it cannot use. Sub-Admins is reserved for the
 * primary school admin.
 *
 * @returns The settings page.
 */
export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("school-profile");
  const { hasPermission, isFullAdmin } = usePermissions();

  const canManage = hasPermission(Permission.MANAGE_SETTINGS);
  const canManageSubAdmins = isFullAdmin && hasPermission(Permission.MANAGE_SUB_ADMINS);
  const sections = visibleSections(canManageSubAdmins);

  // `/settings?section=school-day` opens that tab (links from other pages).
  // Read once on mount from `window.location` rather than `useSearchParams`,
  // which would need a Suspense boundary around the whole page.
  useEffect(() => {
    const requested = sectionFromQuery(
      new URLSearchParams(window.location.search).get("section"),
      sections
    );
    if (requested) setActive(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A tab that stops being visible (role change, session refresh) falls back.
  const current = sections.some((s) => s.id === active) ? active : "school-profile";
  const ActiveSection = SECTION_MAP[current];

  return (
    <div className={`${pagePad} ${pageStack}`}>
      <PageHeader title="Settings" subtitle="Manage your school's preferences" />

      <div className="grid items-start gap-[18px] min-[1100px]:grid-cols-[264px_minmax(0,1fr)]">
        {/* Sections: a column beside the content on wide screens, a scrolling row above it on narrow ones. */}
        <aside className={`${cardFrame} min-[1100px]:sticky min-[1100px]:top-4`}>
          <nav
            className="flex gap-1 overflow-x-auto p-2 min-[1100px]:max-h-[calc(100dvh-220px)] min-[1100px]:flex-col min-[1100px]:overflow-y-auto min-[1100px]:overflow-x-visible"
            aria-label="Settings sections"
          >
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = current === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActive(s.id)}
                  title={s.desc}
                  className={`flex min-h-[44px] shrink-0 items-start gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors min-[1100px]:w-full ${focusRing} ${
                    isActive
                      ? "bg-tl-select text-tl-brand"
                      : "text-tl-muted hover:bg-tl-bg hover:text-tl-ink"
                  }`}
                >
                  <Icon
                    aria-hidden
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-tl-brand" : "text-tl-faint"}`}
                  />
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-sm ${isActive ? "font-extrabold text-tl-brand" : "font-bold text-tl-body"}`}
                    >
                      {s.label}
                    </span>
                    <span className="mt-0.5 hidden truncate text-xs leading-tight text-tl-muted min-[1100px]:block">
                      {s.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="hidden border-t border-tl-line-soft px-5 py-3 min-[1100px]:block">
            <p className="text-xs font-semibold text-tl-muted">{versionLabel()}</p>
          </div>
        </aside>

        <div className="min-w-0">
          <ActiveSection canManage={canManage} onNavigate={setActive} />
        </div>
      </div>
    </div>
  );
}
