"use client";

/**
 * The "Quick Actions" panel on the curriculum dashboard.
 *
 * The two creating actions are only rendered for an administrator who holds
 * `manage:curriculum`; a sub-admin without it sees the read-only "Manage
 * Structure" shortcut rather than buttons the API would refuse.
 */
import React from "react";
import { BookOpen, ChevronRight, GraduationCap, Settings, Target } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";

interface CurriculumQuickActionsProps {
  onAddSubject: () => void;
  onAddCourse: () => void;
  onManageStructure: () => void;
}

interface ActionButtonProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
  hoverClass: string;
  onClick: () => void;
}

/** One action tile. */
function ActionButton({ title, subtitle, icon, iconClass, hoverClass, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between p-5 border-2 border-gray-200 dark:border-slate-700 rounded-xl transition-all duration-300 hover:shadow-lg ${hoverClass}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl transition-all duration-300 ${iconClass}`}>{icon}</div>
        <div className="text-left">
          <div className="font-semibold text-gray-900 dark:text-slate-100">{title}</div>
          <div className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

/**
 * Renders the quick-action panel.
 *
 * @param props - Handlers for each shortcut.
 * @returns The panel.
 */
export function CurriculumQuickActions({
  onAddSubject,
  onAddCourse,
  onManageStructure,
}: CurriculumQuickActionsProps) {
  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8"
      data-guide="curriculum-actions"
    >
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center">
          <Target className="h-5 w-5 mr-2 text-[#003366] dark:text-blue-400" />
          Quick Actions
        </h2>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
          <Tooltip
            content="Create a new subject area. You can add courses to it afterwards."
            side="top"
          >
            <ActionButton
              title="Add Subject"
              subtitle="Create new subject"
              icon={<BookOpen className="w-6 h-6 text-white" />}
              iconClass="bg-[#003366]"
              hoverClass="hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              onClick={onAddSubject}
            />
          </Tooltip>
        </PermissionGate>

        <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
          <Tooltip
            content="Create a course within the selected subject. Choose which class it belongs to."
            side="top"
          >
            <ActionButton
              title="Add Course"
              subtitle="Create new course"
              icon={<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />}
              iconClass="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40"
              hoverClass="hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={onAddCourse}
            />
          </Tooltip>
        </PermissionGate>

        <ActionButton
          title="Manage Structure"
          subtitle="View all settings"
          icon={<Settings className="w-6 h-6 text-purple-600 dark:text-purple-300" />}
          iconClass="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40"
          hoverClass="hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
          onClick={onManageStructure}
        />
      </div>
    </div>
  );
}
