/**
 * The sub-admin table: one row per account, with the three actions on it.
 *
 * Purely presentational — every action reports the row it was pressed on and
 * the section decides what to confirm and what to call.
 */
"use client";

import { ShieldCheck, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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
    <div className="w-10 h-10 rounded-full bg-tl-select text-tl-brand flex items-center justify-center text-sm font-semibold shrink-0">
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
    <div className="bg-tl-surface rounded-xl border border-tl-line overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-tl-line-soft bg-tl-subtle">
            <th className="px-5 py-3 text-left text-xs font-semibold text-tl-muted uppercase tracking-wider">
              Name
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-tl-muted uppercase tracking-wider">
              Permissions
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-tl-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-tl-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tl-line-soft">
          {subAdmins.map((sub) => (
            <tr key={sub.userId} className="hover:bg-tl-bg transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar sub={sub} />
                  <div>
                    <p className="text-sm font-semibold text-tl-ink">
                      {sub.firstName} {sub.lastName}
                    </p>
                    <p className="text-xs text-tl-muted">{sub.email}</p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {sub.permissions.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-tl-select text-tl-link"
                    >
                      {getPermissionLabel(p)}
                    </span>
                  ))}
                  {sub.permissions.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-tl-track text-tl-muted">
                      +{sub.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </td>

              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    sub.isActive ? "bg-tl-success-bg text-tl-success" : "bg-tl-track text-tl-muted"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sub.isActive ? "bg-tl-success" : "bg-tl-faint"
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
                    className="p-1.5 rounded-lg text-tl-faint hover:text-tl-link hover:bg-tl-select transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(sub)}
                    title={sub.isActive ? "Suspend" : "Activate"}
                    aria-label={`${sub.isActive ? "Suspend" : "Activate"} ${sub.firstName} ${sub.lastName}`}
                    className="p-1.5 rounded-lg text-tl-faint hover:text-tl-warning hover:bg-tl-warning-bg transition-colors"
                  >
                    {sub.isActive ? (
                      <ToggleRight className="w-4 h-4 text-tl-success" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(sub)}
                    title="Remove sub-admin"
                    aria-label={`Remove ${sub.firstName} ${sub.lastName} as sub-admin`}
                    className="p-1.5 rounded-lg text-tl-faint hover:text-tl-danger hover:bg-tl-danger-bg transition-colors"
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
