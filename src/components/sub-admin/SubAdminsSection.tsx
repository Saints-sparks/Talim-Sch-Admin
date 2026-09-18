/**
 * Sub-Admins — the staff a primary school admin delegates part of the portal
 * to.
 *
 * The backend puts `@Roles(SCHOOL_ADMIN) @Permissions(MANAGE_SUB_ADMINS)` on
 * every route here, so the section gates itself on both rather than relying on
 * the Settings tab or the route guard that renders it: a role that cannot
 * manage sub-admins is told so instead of being shown buttons the API refuses.
 *
 * Data comes from a paginated TanStack Query; the modals and the two confirm
 * dialogs invalidate it rather than patching a local array, so a change made
 * here and a change made in another tab agree.
 */
"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { type SubAdmin } from "@/app/services/sub-admin.service";
import { CreateSubAdminModal } from "./CreateSubAdminModal";
import { PromoteTeacherModal } from "./PromoteTeacherModal";
import { EditPermissionsModal } from "./EditPermissionsModal";
import { SubAdminsTable } from "./SubAdminsTable";
import {
  useCanManageSubAdmins,
  useSubAdminActions,
  useSubAdmins,
} from "./useSubAdmins";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { getErrorMessage } from "@/lib/apiError";

// ─── Confirm dialog ───────────────────────────────────────────────────────────

/** Props for {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * @param props - See {@link ConfirmDialogProps}.
 * @returns A yes/no dialog, or `null` when closed.
 */
function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmClass = "bg-red-600 hover:bg-red-700 text-white",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

/**
 * @returns The sub-admin management section.
 */
export function SubAdminsSection() {
  const canManage = useCanManageSubAdmins();

  const [page, setPage] = useState(1);
  const list = useSubAdmins(page, canManage);
  const { refreshList, toggleStatus, demote, isActioning } = useSubAdminActions();

  const [showCreate, setShowCreate] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [editTarget, setEditTarget] = useState<SubAdmin | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<SubAdmin | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SubAdmin | null>(null);

  const subAdmins = list.data?.data ?? [];
  const totalPages = list.data?.meta.lastPage ?? 1;

  // Only the primary school admin may act here, whatever their permissions.
  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-1">
          Reserved for the school administrator
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
          Only the school&apos;s primary administrator can create, edit or remove sub-admins.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Sub-Admins</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Delegate school administration responsibilities to trusted staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshList}
            disabled={list.isFetching}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh sub-admins"
          >
            <RefreshCw className={`w-4 h-4 ${list.isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowPromote(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Promote Teacher
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            New Sub-Admin
          </button>
        </div>
      </div>

      {/* Content */}
      {list.isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading sub-admins…
        </div>
      ) : list.isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            {getErrorMessage(list.error, "Failed to load sub-admins")}
          </p>
          <button
            type="button"
            onClick={() => void list.refetch()}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : subAdmins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-1">
            No Sub-Admins Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
            Create a new sub-admin account or promote an existing teacher to help manage the school
            portal.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={() => setShowPromote(true)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Promote a Teacher
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-lg bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors"
            >
              Create Sub-Admin
            </button>
          </div>
        </div>
      ) : (
        <>
          <SubAdminsTable
            subAdmins={subAdmins}
            onEdit={setEditTarget}
            onToggleStatus={setToggleTarget}
            onRemove={setDemoteTarget}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || list.isFetching}
                  aria-label="Previous page"
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || list.isFetching}
                  aria-label="Next page"
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals — each invalidates the list rather than patching it locally */}
      <CreateSubAdminModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={refreshList}
      />
      <PromoteTeacherModal
        isOpen={showPromote}
        onClose={() => setShowPromote(false)}
        onSuccess={refreshList}
      />
      <EditPermissionsModal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        subAdmin={editTarget}
        onSuccess={() => {
          refreshList();
          setEditTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        title={toggleTarget?.isActive ? "Suspend Sub-Admin?" : "Activate Sub-Admin?"}
        description={
          toggleTarget?.isActive
            ? `${toggleTarget?.firstName} ${toggleTarget?.lastName} will lose portal access until reactivated.`
            : `${toggleTarget?.firstName} ${toggleTarget?.lastName} will regain access to their assigned areas.`
        }
        confirmLabel={toggleTarget?.isActive ? "Suspend" : "Activate"}
        confirmClass={
          toggleTarget?.isActive
            ? "bg-amber-600 hover:bg-amber-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }
        isLoading={isActioning}
        onConfirm={() => {
          const target = toggleTarget;
          if (!target) return;
          void toggleStatus(target).finally(() => setToggleTarget(null));
        }}
        onCancel={() => setToggleTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(demoteTarget)}
        title="Remove Sub-Admin?"
        description={`${demoteTarget?.firstName} ${demoteTarget?.lastName} will lose all admin access. If they were promoted from teacher, they will revert to their teacher role.`}
        confirmLabel="Remove Sub-Admin"
        isLoading={isActioning}
        onConfirm={() => {
          const target = demoteTarget;
          if (!target) return;
          void demote(target).finally(() => setDemoteTarget(null));
        }}
        onCancel={() => setDemoteTarget(null)}
      />
    </div>
  );
}
