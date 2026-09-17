"use client";

import React from "react";
import { Mail, Pencil, Phone } from "lucide-react";
import Avatar from "@/components/Avatar";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import type { Parent, ParentChild } from "@/app/services/parent.service";
import type { ProfileFieldsByUserId } from "@/hooks/users/useParents";
import { formatDate, formatDateTime, Info, StatusBadge } from "./atoms";
import { parentName } from "./ParentsTable";

interface ParentDetailPanelProps {
  /** The selected parent, or `undefined` when nothing is selected. */
  parent?: Parent;
  /** Date of birth and gender for the parent and their children. */
  profiles: ProfileFieldsByUserId;
}

/** A child's display name, or a placeholder when the account has no name. */
function childName(child: ParentChild): string {
  return `${child.userId?.firstName ?? ""} ${child.userId?.lastName ?? ""}`.trim() || "Unknown Student";
}

/** The right-hand panel: one parent's profile and the children linked to them. */
export function ParentDetailPanel({ parent, profiles }: ParentDetailPanelProps) {
  if (!parent) {
    return (
      <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
        Select a parent to view their profile and linked children.
      </aside>
    );
  }

  const parentProfile = profiles[parent.userId?._id] ?? {};

  return (
    <aside className="space-y-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            src={parent.userId?.userAvatar}
            firstName={parent.userId?.firstName}
            lastName={parent.userId?.lastName}
            className="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                {parentName(parent)}
              </h2>
              <StatusBadge active={parent.userId?.isActive !== false} />
            </div>
            <p className="mt-3 flex min-w-0 items-center gap-2 break-all text-sm text-slate-500 dark:text-slate-400">
              <Mail className="h-4 w-4" />
              {parent.userId?.email ?? "-"}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Phone className="h-4 w-4" />
              {parent.userId?.phoneNumber ?? "-"}
            </p>
          </div>
        </div>
        <PermissionGate permission={Permission.MANAGE_PARENTS}>
          <button
            type="button"
            disabled
            title="Editing a parent's details is not available yet."
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-4 text-sm sm:grid-cols-2">
        <Info
          label="Date of Birth"
          value={formatDate(parentProfile.dateOfBirth ?? parent.userId?.dateOfBirth)}
        />
        <Info label="Gender" value={parentProfile.gender ?? parent.userId?.gender ?? "-"} />
        <Info label="Joined On" value={formatDate(parent.userId?.createdAt ?? parent.createdAt)} />
        <Info label="Last Login" value={formatDateTime(parent.userId?.lastLogin)} />
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-slate-950 dark:text-white">
            Children ({parent.children?.length ?? 0})
          </h3>
          <PermissionGate permission={Permission.MANAGE_PARENTS}>
            <button
              type="button"
              disabled
              title="Children are linked when a student is enrolled with this parent's contact details."
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 px-3 text-sm font-semibold text-[#003366] dark:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Link Child
            </button>
          </PermissionGate>
        </div>

        <div className="space-y-3">
          {parent.children?.length ? (
            parent.children.map((child) => (
              <div
                key={child._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex gap-3">
                  <Avatar
                    src={child.userId?.userAvatar}
                    firstName={child.userId?.firstName}
                    lastName={child.userId?.lastName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950 dark:text-white">{childName(child)}</p>
                      <span className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-bold text-[#003366] dark:text-blue-400">
                        Student
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {child.gradeLevel ?? child.classId?.gradeLevel ?? "-"} •{" "}
                      {child.classId?.name ?? "No class"}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Mail className="h-4 w-4" />
                      {child.userId?.email ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Info
                    label="Date of Birth"
                    value={formatDate(
                      profiles[child.userId?._id]?.dateOfBirth ?? child.userId?.dateOfBirth,
                    )}
                  />
                  <Info label="Status" value={child.isActive ? "Active" : "Inactive"} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No children are linked to this parent yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        You can view and manage the children linked to this parent. To make changes, please unlink the
        child first.
      </div>
    </aside>
  );
}

export default ParentDetailPanel;
