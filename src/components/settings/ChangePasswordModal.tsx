"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/CustomToast";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { ModalShell, OutlineBtn, PrimaryBtn } from "@/components/settings/ui";
import { useAuth } from "@/context/AuthContext";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { isPasswordValid } from "@/lib/passwordPolicy";
import { logger } from "@/lib/logger";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const FIELDS: Array<{ key: Field; label: string; autoComplete: string }> = [
  { key: "currentPassword", label: "Current Password", autoComplete: "current-password" },
  { key: "newPassword", label: "New Password", autoComplete: "new-password" },
  { key: "confirmPassword", label: "Confirm New Password", autoComplete: "new-password" },
];

/**
 * Changes the signed-in administrator's password.
 *
 * Goes through the auth context rather than the settings service: the server
 * rotates the session and returns a new access token, and only the context can
 * adopt it — the old call left the tab holding a token the server had revoked.
 * The rules shown are the shared password policy, so nothing that passes here
 * is rejected by the server.
 *
 * @param props.onClose - Closes the modal.
 */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState<Record<Field, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);

  const mismatch = values.confirmPassword.length > 0 && values.confirmPassword !== values.newPassword;
  const canSubmit =
    values.currentPassword.length > 0 &&
    isPasswordValid(values.newPassword) &&
    values.confirmPassword.length > 0 &&
    !mismatch &&
    !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setErrors({});
    try {
      await changePassword(values.currentPassword, values.newPassword, values.confirmPassword);
      toast.success("Password changed. Other devices will need to sign in again.");
      onClose();
    } catch (err) {
      const fieldErrors = err instanceof ApiError ? err.fieldErrors() : {};
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors as Partial<Record<Field, string>>);
      else {
        logger.error("settings/password", "change failed", err);
        toast.error(getErrorMessage(err, "We couldn't change your password. Please try again."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {FIELDS.map(({ key, label, autoComplete }) => (
          <div key={key}>
            <label
              htmlFor={`settings-${key}`}
              className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id={`settings-${key}`}
                type={show[key] ? "text" : "password"}
                autoComplete={autoComplete}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                aria-invalid={Boolean(errors[key]) || (key === "confirmPassword" && mismatch)}
                aria-describedby={key === "newPassword" ? "settings-password-rules" : undefined}
                disabled={saving}
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 outline-none"
              />
              <button
                type="button"
                aria-label={show[key] ? `Hide ${label}` : `Show ${label}`}
                onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
              >
                {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors[key] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key]}</p>}
            {key === "confirmPassword" && mismatch && !errors[key] && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">New passwords do not match</p>
            )}
          </div>
        ))}

        <PasswordRequirements password={values.newPassword} id="settings-password-rules" />

        <div className="flex gap-3 pt-2">
          <OutlineBtn onClick={onClose} disabled={saving} className="flex-1 justify-center">
            Cancel
          </OutlineBtn>
          <PrimaryBtn
            type="submit"
            loading={saving}
            disabled={!canSubmit}
            className="flex-1 justify-center"
          >
            Update Password
          </PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}
