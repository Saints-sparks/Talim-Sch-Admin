"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useAdminProfile } from "@/hooks/settings/useAdminProfile";
import { useFinanceSettings } from "@/hooks/settings/usePaymentsFinance";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import type { SectionId } from "@/components/settings/sections";
import { Card, CardHeader, OutlineBtn, SectionHeader } from "@/components/settings/ui";

/**
 * Hides most of an email's local part, e.g. `adm***@school.com`.
 *
 * @param email - The address to mask.
 * @returns The masked address, or an em dash when there is none.
 */
export function maskEmail(email?: string): string {
  if (!email?.includes("@")) return "—";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 3)}${"*".repeat(Math.max(0, local.length - 3))}@${domain}`;
}

/** A label/value row with an optional icon and colour. */
function DetailRow({
  label,
  value,
  tone,
  icon,
  loading,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-gray-50 dark:border-slate-700 last:border-0">
      <span className="text-gray-500 dark:text-slate-400">{label}</span>
      {loading ? (
        <span className="inline-block w-24 h-3.5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
      ) : (
        <span
          className={`font-medium flex items-center gap-1.5 truncate max-w-[180px] ${tone || "text-gray-800 dark:text-slate-200"}`}
        >
          {icon}
          {value}
        </span>
      )}
    </div>
  );
}

/**
 * Settings → Security: password, the withdrawal OTP state, and what the
 * session knows about this account.
 *
 * Everything here is read-only except the password, which every admin role may
 * change; the OTP switch itself lives in Payments & Finance, behind
 * `manage:settings`.
 *
 * @param props.onNavigate - Switches the open settings tab.
 */
export function SecuritySection({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const { user } = useAuth();
  const profile = useAdminProfile();
  const finance = useFinanceSettings();
  const [showPwModal, setShowPwModal] = useState(false);

  const loadingProfile = profile.isLoading;
  const email = profile.data?.email ?? user?.email;
  const otpEnabled = finance.data?.requireEmailOtpForWithdrawals ?? true;

  const boolLabel = (v?: boolean) => (v === undefined ? "—" : v ? "Yes" : "No");
  const boolTone = (v?: boolean) =>
    v === undefined ? "" : v ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400";

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" desc="Password, OTP and access security" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Password" />
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Account Password</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Update your password regularly for security
                </p>
              </div>
              <OutlineBtn onClick={() => setShowPwModal(true)}>
                <Lock className="w-3.5 h-3.5" /> Change
              </OutlineBtn>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Email OTP" />
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  Email OTP (Withdrawals)
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  OTP sent to: {maskEmail(email)}
                </p>
              </div>
              {finance.isLoading ? (
                <div className="w-16 h-5 bg-gray-100 dark:bg-slate-700 rounded-full animate-pulse" />
              ) : finance.isError ? (
                <span className="text-xs text-gray-500 dark:text-slate-400">Unavailable</span>
              ) : (
                <span
                  className={`text-xs font-medium border px-2 py-0.5 rounded-full shrink-0 ${
                    otpEnabled
                      ? "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                      : "text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700"
                  }`}
                >
                  {otpEnabled ? "Enabled" : "Disabled"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Manage OTP settings in{" "}
              <button
                type="button"
                onClick={() => onNavigate("payments-finance")}
                className="text-[#003366] dark:text-blue-400 underline font-medium"
              >
                Payments &amp; Finance
              </button>
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Session Security"
            action={
              loadingProfile ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#003366] rounded-full animate-spin" />
              ) : (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              )
            }
          />
          <div className="p-5 space-y-2">
            <DetailRow
              label="Last Login"
              value={profile.data?.lastLogin ? new Date(profile.data.lastLogin).toLocaleString() : "—"}
              loading={loadingProfile}
            />
            <DetailRow
              label="Email Verified"
              value={boolLabel(profile.data?.isEmailVerified)}
              tone={boolTone(profile.data?.isEmailVerified)}
              icon={
                profile.data?.isEmailVerified === true ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : profile.data?.isEmailVerified === false ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                ) : null
              }
              loading={loadingProfile}
            />
            <DetailRow
              label="Account Status"
              value={
                profile.data?.isActive === undefined ? "—" : profile.data.isActive ? "Active" : "Inactive"
              }
              tone={boolTone(profile.data?.isActive)}
              loading={loadingProfile}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Access Control" />
          <div className="p-5 space-y-2">
            <DetailRow
              label="Role"
              value={(profile.data?.role ?? user?.role ?? "school_admin").replace(/_/g, " ")}
              tone="capitalize text-gray-800 dark:text-slate-200"
            />
            <DetailRow
              label="School"
              value={user?.schoolName ?? profile.data?.schoolId?.name ?? "—"}
              loading={loadingProfile && !user?.schoolName}
            />
            <DetailRow label="User ID" value={user?.userId ?? profile.data?.userId ?? "—"} />
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
