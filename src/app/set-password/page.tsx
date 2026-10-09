"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "@/components/CustomToast";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { useAuth } from "@/context/AuthContext";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { isPasswordValid } from "@/lib/passwordPolicy";
import { resolvePostLoginRoute } from "@/lib/postLoginRoute";
import {
  SignInErrorBanner,
  SignInLogoHeader,
  SignInPasswordField,
  SignInPrimaryButton,
  signInLinkClass,
} from "@/components/auth/signin-ui";

type FieldErrors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

/**
 * First-sign-in password change, in the shared Talim sign-in look. School
 * admin and sub-admin accounts are created with a temporary password; the API
 * refuses every other request until the admin chooses their own, so this is
 * the only screen they can use. The checks, the request and the routing are
 * unchanged.
 *
 * @returns The page, or nothing while the session loads or redirects.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const { user, isLoading, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/");
    else if (!user.mustChangePassword) router.replace(resolvePostLoginRoute(user));
  }, [isLoading, user, router]);

  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmit = useMemo(
    () =>
      currentPassword.length > 0 &&
      isPasswordValid(newPassword) &&
      newPassword === confirmPassword &&
      !saving,
    [currentPassword, newPassword, confirmPassword, saving]
  );

  /**
   * Sets the password and routes on, or shows the API's field errors.
   *
   * @param e - The form's submit event.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (!canSubmit || !user) return;

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      toast.success("Your password is set.");
      router.replace(resolvePostLoginRoute({ ...user, mustChangePassword: false }));
    } catch (err) {
      const fields = err instanceof ApiError ? (err.fieldErrors() as FieldErrors) : {};
      if (Object.keys(fields).length > 0) setFieldErrors(fields);
      else
        setFormError(getErrorMessage(err, "We couldn't update your password. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user?.mustChangePassword) return null;

  const confirmError =
    confirmMismatch || fieldErrors.confirmPassword
      ? (fieldErrors.confirmPassword ?? "Passwords do not match")
      : null;

  /**
   * Shows or hides all three passwords together.
   */
  const toggle = () => setShowPasswords((v) => !v);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <SignInLogoHeader
          appName="Admin"
          className="mb-6"
          logo={
            <Image
              src="/img/treelogo.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
          }
        />

        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF2FB] dark:bg-blue-900/40">
          <KeyRound className="h-5 w-5 text-[#003366] dark:text-blue-200" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-[#030E18] dark:text-slate-100">Set your password</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          {user.firstName ? `Hi ${user.firstName}, your` : "Your"} account was created with a
          temporary password. Choose your own to continue.
        </p>

        {formError ? (
          <SignInErrorBanner tone="danger" className="mt-5">
            {formError}
          </SignInErrorBanner>
        ) : null}

        <form
          className="mt-6 space-y-5"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Set your password"
        >
          <SignInPasswordField
            id="currentPassword"
            name="currentPassword"
            label="Temporary password"
            error={fieldErrors.currentPassword}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            visible={showPasswords}
            onToggleVisible={toggle}
            toggleLabels={["Show passwords", "Hide passwords"]}
            disabled={saving}
            required
          />

          <SignInPasswordField
            id="newPassword"
            name="newPassword"
            label="New password"
            error={fieldErrors.newPassword}
            describedBy={["newPassword-rules"]}
            after={<PasswordRequirements password={newPassword} id="newPassword-rules" />}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            visible={showPasswords}
            hideToggle
            disabled={saving}
            required
          />

          <SignInPasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            error={confirmError}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            visible={showPasswords}
            hideToggle
            disabled={saving}
            required
          />

          <SignInPrimaryButton disabled={!canSubmit} loading={saving} loadingText="Saving…">
            Set password and continue
          </SignInPrimaryButton>
        </form>

        <div className="-mb-3 mt-3 flex flex-col items-center text-sm">
          <Link href="/forgot-password" className={signInLinkClass}>
            Use a reset code from your email instead
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-[44px] items-center text-gray-500 hover:underline dark:text-slate-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
