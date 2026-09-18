/**
 * The sub-admin table: one row per account, with the three actions on it.
 *
 * Purely presentational — every action reports the row it was pressed on and
 * the section decides what to confirm and what to call.
 */
"use client";

import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { type SubAdmin } from "@/app/services/sub-admin.service";
import { PERMISSION_GROUPS } from "./PermissionSelector";

/**
 * The human label for a permission value.
 *
 * @param value - A backend permission value, e.g. `manage:fees`.
 * @returns Its label, or the raw value when it is not one the UI knows.
 */
function getPermissionLabel(value: string): string {
  for (const group of PERMISSION_GROUPS) {
    const permission = group.permissions.find((p) => p.value === value);
    if (permission) return permission.label;
  }
  return value;
}

/**
 * @param props.sub - The sub-admin to picture.
 * @returns Their photo, or their initials when they have none.
 */
function Avatar({ sub }: { sub: SubAdmin }) {
  if (sub.userAvatar) {
    // A plain <img>: avatars are arbitrary remote hosts, which next/image
    // would need configured domains for.
    return (
      <img
        src={sub.userAvatar}
        alt={`${sub.firstName} ${sub.lastName}`}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  const initials = `${sub.firstName?.[0] ?? ""}${sub.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-[#003366]/10 text-[#003366] flex items-center justify-center text-sm font-semibold shrink-0 dark:bg-blue-900/30 dark:text-blue-200">
      {initials}
    </div>
  );
}

/** Props for {@link SubAdminsTable}. */
export interface SubAdminsTableProps {
  /** The rows to show. */
  subAdmins: SubAdmin[];
  /** Opens the permission editor for a row. */
  onEdit: (sub: SubAdmin) => void;
  /** Asks to suspend or reactivate a row. */
  onToggleStatus: (sub: SubAdmin) => void;
  /** Asks to remove a row. */
  onRemove: (sub: SubAdmin) => void;
}

/**
 * @param props - See {@link SubAdminsTableProps}.
 * @returns The sub-admin table.
 */
export function SubAdminsTable({
  subAdmins,
  onEdit,
  onToggleStatus,
  onRemove,
}: SubAdminsTableProps) {
  // The container scrolls on narrow screens, so the page never does.
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Permissions
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {subAdmins.map((sub) => (
            <tr
              key={sub.userId}
              className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar sub={sub} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {sub.firstName} {sub.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{sub.email}</p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {sub.permissions.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {getPermissionLabel(p)}
                    </span>
                  ))}
                  {sub.permissions.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                      +{sub.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </td>

              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    sub.isActive
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sub.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {sub.isActive ? "Active" : "Suspended"}
                </span>
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(sub)}
                    title="Edit permissions"
                    aria-label={`Edit permissions for ${sub.firstName} ${sub.lastName}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(sub)}
                    title={sub.isActive ? "Suspend" : "Activate"}
                    aria-label={`${sub.isActive ? "Suspend" : "Activate"} ${sub.firstName} ${sub.lastName}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    {sub.isActive ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(sub)}
                    title="Remove sub-admin"
                    aria-label={`Remove ${sub.firstName} ${sub.lastName} as sub-admin`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
