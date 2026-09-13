"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "@/components/CustomToast";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { useAuth } from "@/context/AuthContext";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { isPasswordValid } from "@/lib/passwordPolicy";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

/**
 * Change the signed-in admin's password. Available to every admin role
 * (it uses `POST /auth/change-password`, not the settings permission).
 * The server rotates the session, which AuthContext adopts.
 */
export default function ChangePasswordCard() {
  const { changePassword } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const mismatch = values.confirmPassword.length > 0 && values.confirmPassword !== values.newPassword;
  const canSubmit =
    values.currentPassword.length > 0 && isPasswordValid(values.newPassword) && !mismatch && values.confirmPassword.length > 0 && !saving;

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setErrors({});
    try {
      await changePassword(values.currentPassword, values.newPassword, values.confirmPassword);
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed. Other devices will need to sign in again.");
    } catch (err) {
      const fields = err instanceof ApiError ? err.fieldErrors() : {};
      if (Object.keys(fields).length) setErrors(fields as Partial<Record<Field, string>>);
      else toast.error(getErrorMessage(err, "We couldn't change your password. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const input = (field: Field, label: string, autoComplete: string, describedBy?: string) => (
    <div>
      <label htmlFor={`cp-${field}`} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-200">
        {label}
      </label>
      <input
        id={`cp-${field}`}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={values[field]}
        onChange={set(field)}
        aria-invalid={Boolean(errors[field]) || (field === "confirmPassword" && mismatch)}
        aria-describedby={describedBy}
        disabled={saving}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-[#003366]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      {errors[field] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[field]}</p>}
      {field === "confirmPassword" && mismatch && !errors[field] && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
          <KeyRound className="h-4 w-4 text-[#003366] dark:text-blue-300" aria-hidden />
          Change password
        </h3>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400"
          aria-label={show ? "Hide passwords" : "Show passwords"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {input("currentPassword", "Current password", "current-password")}
        <div>
          {input("newPassword", "New password", "new-password", "cp-rules")}
        </div>
        {input("confirmPassword", "Confirm new password", "new-password")}
      </div>
      <PasswordRequirements password={values.newPassword} id="cp-rules" />
      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002244] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
