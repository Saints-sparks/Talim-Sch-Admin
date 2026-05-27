"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import TalimModal from "@/components/ui/TalimModal";
import { PermissionSelector } from "./PermissionSelector";
import { subAdminService, SubAdmin } from "@/services/subAdminService";
import { toast } from "@/components/CustomToast";

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subAdmin: SubAdmin | null;
  onSuccess: (updated: SubAdmin) => void;
}

export function EditPermissionsModal({
  isOpen,
  onClose,
  subAdmin,
  onSuccess,
}: EditPermissionsModalProps) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync permissions when subAdmin changes
  useEffect(() => {
    if (subAdmin) {
      setPermissions([...(subAdmin.permissions ?? [])]);
    }
  }, [subAdmin]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!subAdmin) return;
    if (permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await subAdminService.updatePermissions(subAdmin.userId, {
        permissions,
      });
      toast.success(
        `Permissions updated for ${updated.firstName} ${updated.lastName}`
      );
      onSuccess(updated);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update permissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!subAdmin) return null;

  return (
    <TalimModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Permissions"
      subtitle={`Update access rights for ${subAdmin.firstName} ${subAdmin.lastName}`}
      icon={<ShieldCheck className="w-5 h-5 text-white" />}
      isSubmitting={isSubmitting}
      footer={
        <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || permissions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Permissions"
            )}
          </button>
        </div>
      }
    >
      <div className="px-8 py-6">
        <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Removing a permission immediately revokes access to that section of
            the portal — the change takes effect on the sub-admin&apos;s next
            page load.
          </p>
        </div>
        <PermissionSelector selected={permissions} onChange={setPermissions} />
      </div>
    </TalimModal>
  );
}
