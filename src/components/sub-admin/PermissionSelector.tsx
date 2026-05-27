"use client";

import React from "react";
import { Check } from "lucide-react";
import { Permission } from "@/lib/permissions";

// ─── Permission Definitions ───────────────────────────────────────────────────
// Values MUST match the backend Permission enum (manage:resource format).

export const PERMISSION_GROUPS = [
  {
    id: "academics",
    label: "Academics",
    description: "Class, curriculum, assessment and timetable management",
    permissions: [
      { value: Permission.MANAGE_CLASSES,    label: "Manage Classes" },
      { value: Permission.MANAGE_CURRICULUM, label: "Manage Curriculum" },
      { value: Permission.MANAGE_ASSESSMENTS,label: "Manage Assessments" },
      { value: Permission.MANAGE_TIMETABLE,  label: "Manage Timetable" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Fees, payments and financial reporting",
    permissions: [
      { value: Permission.MANAGE_FEES,     label: "Manage Fees" },
      { value: Permission.MANAGE_PAYMENTS, label: "Manage Payments" },
      { value: Permission.MANAGE_FINANCE,  label: "Manage Finance & Wallet" },
    ],
  },
  {
    id: "people",
    label: "People",
    description: "Student, teacher and parent management",
    permissions: [
      { value: Permission.MANAGE_STUDENTS, label: "Manage Students" },
      { value: Permission.MANAGE_TEACHERS, label: "Manage Teachers" },
      { value: Permission.MANAGE_PARENTS,  label: "Manage Parents" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    description: "Announcements, leave requests, transit, messages and settings",
    permissions: [
      { value: Permission.MANAGE_ANNOUNCEMENTS,  label: "Manage Announcements" },
      { value: Permission.MANAGE_LEAVE_REQUESTS, label: "Manage Leave Requests" },
      { value: Permission.MANAGE_TRANSIT,        label: "Manage Transit" },
      { value: Permission.MANAGE_MESSAGES,       label: "Manage Messages" },
      { value: Permission.MANAGE_SETTINGS,       label: "Manage Settings" },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.value)
);

// ─── Component ────────────────────────────────────────────────────────────────

interface PermissionSelectorProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionSelector({
  selected,
  onChange,
  disabled = false,
}: PermissionSelectorProps) {
  const toggle = (value: string) => {
    if (disabled) return;
    onChange(
      selected.includes(value)
        ? selected.filter((p) => p !== value)
        : [...selected, value]
    );
  };

  const toggleGroup = (groupPermissions: string[]) => {
    if (disabled) return;
    const allSelected = groupPermissions.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !groupPermissions.includes(p)));
    } else {
      const toAdd = groupPermissions.filter((p) => !selected.includes(p));
      onChange([...selected, ...toAdd]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(ALL_PERMISSIONS);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40"
        >
          Select All
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-40"
        >
          Clear All
        </button>
        <span className="ml-auto text-xs text-gray-400">
          {selected.length} / {ALL_PERMISSIONS.length} selected
        </span>
      </div>

      {/* Groups */}
      {PERMISSION_GROUPS.map((group) => {
        const groupPermValues = group.permissions.map((p) => p.value);
        const allGroupSelected = groupPermValues.every((p) =>
          selected.includes(p)
        );
        const someGroupSelected =
          !allGroupSelected &&
          groupPermValues.some((p) => selected.includes(p));

        return (
          <div
            key={group.id}
            className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
          >
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(groupPermValues)}
              disabled={disabled}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  allGroupSelected
                    ? "bg-blue-600 border-blue-600"
                    : someGroupSelected
                    ? "bg-blue-200 border-blue-400"
                    : "border-gray-300 dark:border-slate-500"
                }`}
              >
                {(allGroupSelected || someGroupSelected) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                  {group.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {group.description}
                </p>
              </div>
            </button>

            {/* Individual permissions */}
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {group.permissions.map((perm) => {
                const isChecked = selected.includes(perm.value);
                return (
                  <button
                    key={perm.value}
                    type="button"
                    onClick={() => toggle(perm.value)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                      isChecked
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                    } disabled:opacity-40`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 dark:border-slate-500"
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {perm.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
