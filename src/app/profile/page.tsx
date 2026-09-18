/**
 * `/profile` — the signed-in administrator's account and their school.
 *
 * The page is a shell over two cards, each with its own state and mutations:
 * `AdminDetailsCard` (open to every admin role) and `SchoolDetailsCard`
 * (editable only with `manage:settings`, matching the backend). Both read one
 * cached profile request, shared with Settings → Admin Account.
 */
"use client";

import { AlertCircle } from "lucide-react";
import { AdminDetailsCard } from "@/components/profile/AdminDetailsCard";
import { SchoolDetailsCard } from "@/components/profile/SchoolDetailsCard";
import { useProfileSnapshot } from "@/components/profile/useProfileData";

/**
 * @returns The profile screen.
 */
export default function Profile() {
  const { admin, school, isLoading, isError, retry } = useProfileSnapshot();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full dark:bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4 dark:border-blue-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-slate-100">
            Loading Profile
          </h2>
          <p className="text-gray-500 text-sm dark:text-slate-400">
            Please wait while we fetch your information…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 dark:text-slate-100">Profile</h1>

      <div className="max-w-4xl space-y-6">
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p>We couldn&apos;t load your profile. Some details may be out of date.</p>
              <button type="button" onClick={retry} className="mt-1 font-semibold underline">
                Try again
              </button>
            </div>
          </div>
        )}

        <AdminDetailsCard admin={admin} />
        <SchoolDetailsCard school={school} />
      </div>
    </div>
  );
}
