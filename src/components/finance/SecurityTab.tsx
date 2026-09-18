"use client";

import { useState } from "react";
import { Copy, Shield } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { useSecurityStatus } from "@/hooks/finance/useFinanceQueries";
import {
  useDisable2fa,
  useSetRequire2fa,
  useSetup2fa,
  useVerify2fa,
} from "@/hooks/finance/useFinanceMutations";
import { LedgerStatusBadge } from "./FinanceBadges";
import { CardListSkeleton } from "./FinanceSkeletons";
import { describeFinanceError, financeActionMessage } from "./financeErrors";
import { formatDate } from "./formatters";

/** Authenticator codes are always six digits. */
const CODE_LENGTH = 6;

/**
 * Keeps a 6-digit code field to digits only.
 *
 * @param value - Raw input value.
 * @returns At most six digits.
 */
function onlyCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/**
 * Two-factor settings for the signed-in admin, including the switch that makes
 * every withdrawal require an authenticator code.
 *
 * Turning that switch OFF asks for a current code first, and sends it with the
 * request: the server refuses to relax the requirement without one, so a
 * stolen session cannot switch the protection off and then withdraw.
 *
 * @returns The finance settings tab.
 */
export function SecurityTab() {
  const status = useSecurityStatus();
  const setup = useSetup2fa();
  const enable = useVerify2fa();
  const disable = useDisable2fa();
  const setRequire = useSetRequire2fa();

  const [setupData, setSetupData] = useState<{ qrCode: string; otpauthUrl: string } | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [requireOffCode, setRequireOffCode] = useState("");
  const [askRequireOffCode, setAskRequireOffCode] = useState(false);

  const security = status.data;

  const handleSetup = async () => {
    try {
      setSetupData(await setup.mutateAsync());
    } catch (error) {
      logger.error("finance", "2fa setup failed", error);
      toast.error(financeActionMessage(error, "Couldn't start two-factor setup"));
    }
  };

  const handleEnable = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await enable.mutateAsync(enableCode);
      toast.success("Two-factor authentication enabled");
      setSetupData(null);
      setEnableCode("");
    } catch (error) {
      logger.error("finance", "2fa enable failed", error);
      toast.error(financeActionMessage(error, "That code wasn't accepted"));
    }
  };

  const handleDisable = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await disable.mutateAsync(disableCode);
      toast.success("Two-factor authentication disabled");
      setShowDisable(false);
      setDisableCode("");
    } catch (error) {
      logger.error("finance", "2fa disable failed", error);
      toast.error(financeActionMessage(error, "That code wasn't accepted"));
    }
  };

  const handleToggleRequire = async () => {
    if (!security) return;
    const turningOff = security.requireTwoFactorForWithdrawals;

    // Turning the protection off needs a current code, so ask for it before
    // sending anything. Turning it on needs nothing extra.
    if (turningOff && !askRequireOffCode) {
      setAskRequireOffCode(true);
      return;
    }

    try {
      await setRequire.mutateAsync({
        require: !turningOff,
        token: turningOff ? requireOffCode : undefined,
      });
      toast.success(
        turningOff
          ? "Withdrawals no longer require a two-factor code"
          : "Withdrawals now require a two-factor code"
      );
      setAskRequireOffCode(false);
      setRequireOffCode("");
    } catch (error) {
      logger.error("finance", "require-2fa toggle failed", error);
      toast.error(financeActionMessage(error, "Failed to update the preference"));
    }
  };

  if (status.isPending) return <CardListSkeleton count={2} />;

  if (status.isError || !security) {
    const copy = describeFinanceError(status.error, "your security settings");
    return (
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={copy.retryable ? () => void status.refetch() : undefined}
      />
    );
  }

  return (
    <PermissionGate
      permission={Permission.MANAGE_FINANCE}
      fallback={
        <ErrorState
          title="No access to finance settings"
          message="Managing withdrawal security needs the finance permission."
        />
      }
    >
      <div className="max-w-xl space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield
                  size={18}
                  className={security.twoFactorEnabled ? "text-green-500" : "text-gray-400"}
                />
                <h3 className="font-bold text-gray-800 dark:text-slate-100">Two-Factor Authentication</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {security.twoFactorEnabled
                  ? `Enabled since ${formatDate(security.twoFactorEnabledAt)}`
                  : "Not enabled. Add an extra layer of security to your account."}
              </p>
            </div>
            <LedgerStatusBadge status={security.twoFactorEnabled ? "active" : "pending"} />
          </div>

          {!security.twoFactorEnabled && !setupData && (
            <button
              type="button"
              onClick={() => void handleSetup()}
              disabled={setup.isPending}
              className="px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90 disabled:opacity-50"
            >
              {setup.isPending ? "Setting up…" : "Enable 2FA"}
            </button>
          )}

          {setupData && (
            <div className="space-y-4 mt-4 border-t border-gray-100 dark:border-slate-800 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                1. Scan this QR code with your authenticator app
              </p>
              <div className="flex justify-center">
                {/* A data-URL QR from the server: next/image would only add a
                    loader around bytes we already have. */}
                <img
                  src={setupData.qrCode}
                  alt="Two-factor QR code"
                  width={192}
                  height={192}
                  className="w-48 h-48 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
                Can&apos;t scan?{" "}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(setupData.otpauthUrl);
                    toast.success("Setup URL copied");
                  }}
                  className="text-[#003366] hover:underline inline-flex items-center gap-1"
                >
                  Copy URL <Copy size={12} />
                </button>
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                2. Enter the 6-digit code from your app
              </p>
              <form onSubmit={handleEnable} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Authenticator code"
                  value={enableCode}
                  onChange={(event) => setEnableCode(onlyCode(event.target.value))}
                  placeholder="000000"
                  className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                />
                <button
                  type="submit"
                  disabled={enableCode.length !== CODE_LENGTH || enable.isPending}
                  className="px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                >
                  {enable.isPending ? "Verifying…" : "Activate"}
                </button>
              </form>
            </div>
          )}

          {security.twoFactorEnabled && !showDisable && (
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="text-sm text-red-500 hover:underline mt-2"
            >
              Disable 2FA
            </button>
          )}

          {showDisable && (
            <form onSubmit={handleDisable} className="mt-4 border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Enter your current 2FA code to disable
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Current authenticator code"
                  value={disableCode}
                  onChange={(event) => setDisableCode(onlyCode(event.target.value))}
                  placeholder="000000"
                  className="flex-1 min-w-[140px] border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button
                  type="submit"
                  disabled={disableCode.length !== CODE_LENGTH || disable.isPending}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                >
                  {disable.isPending ? "Disabling…" : "Disable"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode("");
                  }}
                  className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {security.twoFactorEnabled && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-slate-100">Require 2FA for Withdrawals</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  When enabled, every withdrawal will require a valid 2FA code.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={security.requireTwoFactorForWithdrawals}
                aria-label="Require 2FA for withdrawals"
                onClick={() => void handleToggleRequire()}
                disabled={setRequire.isPending}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                  security.requireTwoFactorForWithdrawals ? "bg-[#003366]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow transition-transform ${
                    security.requireTwoFactorForWithdrawals ? "translate-x-5 left-0" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {askRequireOffCode && (
              <form
                className="mt-4 flex flex-wrap items-end gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleToggleRequire();
                }}
              >
                <label className="flex-1 min-w-[180px] text-sm text-gray-600 dark:text-slate-300">
                  Enter the code from your authenticator app to turn this off
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    value={requireOffCode}
                    onChange={(event) => setRequireOffCode(onlyCode(event.target.value))}
                    className="mt-1 w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm tracking-widest bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100"
                    aria-label="Authenticator code"
                  />
                </label>
                <button
                  type="submit"
                  disabled={requireOffCode.length !== CODE_LENGTH || setRequire.isPending}
                  className="px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  {setRequire.isPending ? "Turning off…" : "Turn off"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAskRequireOffCode(false);
                    setRequireOffCode("");
                  }}
                  className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
