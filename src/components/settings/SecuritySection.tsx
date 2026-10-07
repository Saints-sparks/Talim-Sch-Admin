"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useAdminProfile } from "@/hooks/settings/useAdminProfile";
import { useFinanceSettings } from "@/hooks/settings/usePaymentsFinance";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { SessionsCard } from "@/components/settings/security/SessionsCard";
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
    <div className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-tl-line-soft last:border-0">
      <span className="text-tl-muted">{label}</span>
      {loading ? (
        <span className="inline-block w-24 h-3.5 bg-tl-track rounded animate-pulse" />
      ) : (
        <span
          className={`font-medium flex items-center gap-1.5 truncate max-w-[180px] ${tone || "text-tl-ink"}`}
        >
          {icon}
          {value}
        </span>
      )}
    </div>
  );
}

/**
 * Settings → Security: password, the withdrawal OTP state, what the session
 * knows about this account, and the signed-in devices.
 *
 * Everything here is read-only except the password and the devices, which are
 * the administrator's own (every admin role may change them); the OTP switch
 * itself lives in Payments & Finance, behind `manage:settings`.
 *
 * @param props.onNavigate - Switches the open settings tab.
 * @returns The section.
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
    v === undefined ? "" : v ? "text-tl-success" : "text-tl-danger";

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" desc="Password, signed-in devices, OTP and access security" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Password" />
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium text-tl-ink">Account Password</p>
                <p className="text-xs text-tl-muted mt-0.5">
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
                <p className="text-sm font-medium text-tl-ink">Email OTP (Withdrawals)</p>
                <p className="text-xs text-tl-muted">OTP sent to: {maskEmail(email)}</p>
              </div>
              {finance.isLoading ? (
                <div className="w-16 h-5 bg-tl-track rounded-full animate-pulse" />
              ) : finance.isError ? (
                <span className="text-xs text-tl-muted">Unavailable</span>
              ) : (
                <span
                  className={`text-xs font-medium border px-2 py-0.5 rounded-full shrink-0 ${
                    otpEnabled
                      ? "text-tl-success border-tl-success/30 bg-tl-success-bg"
                      : "text-tl-muted border-tl-line bg-tl-subtle"
                  }`}
                >
                  {otpEnabled ? "Enabled" : "Disabled"}
                </span>
              )}
            </div>
            <p className="text-xs text-tl-muted">
              Manage OTP settings in{" "}
              <button
                type="button"
                onClick={() => onNavigate("payments-finance")}
                className="text-tl-brand underline font-medium"
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
                <div className="w-3.5 h-3.5 border-2 border-tl-control border-t-tl-brand rounded-full animate-spin" />
              ) : (
                <span className="text-xs text-tl-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              )
            }
          />
          <div className="p-5 space-y-2">
            <DetailRow
              label="Last Login"
              value={
                profile.data?.lastLogin ? new Date(profile.data.lastLogin).toLocaleString() : "—"
              }
              loading={loadingProfile}
            />
            <DetailRow
              label="Email Verified"
              value={boolLabel(profile.data?.isEmailVerified)}
              tone={boolTone(profile.data?.isEmailVerified)}
              icon={
                profile.data?.isEmailVerified === true ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-tl-success" />
                ) : profile.data?.isEmailVerified === false ? (
                  <AlertCircle className="w-3.5 h-3.5 text-tl-danger" />
                ) : null
              }
              loading={loadingProfile}
            />
            <DetailRow
              label="Account Status"
              value={
                profile.data?.isActive === undefined
                  ? "—"
                  : profile.data.isActive
                    ? "Active"
                    : "Inactive"
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
              tone="capitalize text-tl-ink"
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

      <SessionsCard />

      <AnimatePresence>
        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
