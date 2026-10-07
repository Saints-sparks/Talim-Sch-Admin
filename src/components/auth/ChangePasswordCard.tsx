"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "@/components/CustomToast";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { useAuth } from "@/context/AuthContext";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { isPasswordValid } from "@/lib/passwordPolicy";
import { usePasswordPolicy } from "@/hooks/usePasswordPolicy";
import {
  fieldControl,
  fieldError,
  fieldLabel,
  primaryButton,
  quietButton,
  sectionTitle,
} from "@/components/tl/styles";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

/**
 * Change the signed-in admin's password. Available to every admin role
 * (it uses `POST /auth/change-password`, not the settings permission).
 * The server rotates the session, which AuthContext adopts. The rules shown
 * and checked come from `GET /auth/password-policy` (see `usePasswordPolicy`).
 *
 * @returns The form.
 */
export default function ChangePasswordCard() {
  const { changePassword } = useAuth();
  const { rules, historyNote } = usePasswordPolicy();
  const [values, setValues] = useState<Record<Field, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const mismatch =
    values.confirmPassword.length > 0 && values.confirmPassword !== values.newPassword;
  const canSubmit =
    values.currentPassword.length > 0 &&
    isPasswordValid(values.newPassword, rules) &&
    !mismatch &&
    values.confirmPassword.length > 0 &&
    !saving;

  /**
   * The change handler of one field.
   *
   * @param field - Which field.
   * @returns The handler.
   */
  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  /**
   * Changes the password, or shows the API's field errors.
   *
   * @param e - The form's submit event.
   */
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

  /**
   * One labelled password input with its error.
   *
   * @param field - Which field.
   * @param label - Its label.
   * @param autoComplete - The browser's autocomplete hint.
   * @param describedBy - Ids that describe it (the rules).
   * @returns The field.
   */
  const input = (field: Field, label: string, autoComplete: string, describedBy?: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`cp-${field}`} className={fieldLabel}>
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
        className={fieldControl}
      />
      {errors[field] && <p className={fieldError}>{errors[field]}</p>}
      {field === "confirmPassword" && mismatch && !errors[field] && (
        <p className={fieldError}>Passwords do not match</p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center justify-between gap-3">
        <h3 className={`flex items-center gap-2 ${sectionTitle}`}>
          <KeyRound className="h-4 w-4 text-tl-brand" aria-hidden />
          Change password
        </h3>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className={quietButton}
          aria-label={show ? "Hide passwords" : "Show passwords"}
        >
          {show ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {input("currentPassword", "Current password", "current-password")}
        <div>{input("newPassword", "New password", "new-password", "cp-rules")}</div>
        {input("confirmPassword", "Confirm new password", "new-password")}
      </div>
      <PasswordRequirements
        password={values.newPassword}
        id="cp-rules"
        rules={rules}
        note={historyNote}
      />
      <button type="submit" disabled={!canSubmit} className={primaryButton}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
