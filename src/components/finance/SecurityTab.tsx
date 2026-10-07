"use client";

import { useState } from "react";
import { Copy, Shield } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import {
  CardHeader,
  Toggle,
  card,
  dangerButton,
  fieldControl,
  fieldLabel,
  ghostButton,
  primaryButton,
  quietButton,
  textLink,
} from "@/components/tl";
import { cn } from "@/lib/utils";
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

  /** Starts two-factor setup and shows the QR code. */
  const handleSetup = async () => {
    try {
      setSetupData(await setup.mutateAsync());
    } catch (error) {
      logger.error("finance", "2fa setup failed", error);
      toast.error(financeActionMessage(error, "Couldn't start two-factor setup"));
    }
  };

  /**
   * Activates two-factor with the first code from the app.
   *
   * @param event - The form's submit event.
   */
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

  /**
   * Turns two-factor off with a current code.
   *
   * @param event - The form's submit event.
   */
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

  /**
   * Flips "require 2FA for withdrawals"; turning it off asks for a code first.
   */
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
      <div className="flex max-w-2xl flex-col gap-[18px]">
        <section className={card}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  security.twoFactorEnabled
                    ? "bg-tl-success-bg text-tl-success"
                    : "bg-tl-track text-tl-muted"
                }`}
              >
                <Shield size={19} />
              </span>
              <CardHeader
                title="Two-Factor Authentication"
                level={3}
                subtitle={
                  security.twoFactorEnabled
                    ? `Enabled since ${formatDate(security.twoFactorEnabledAt)}`
                    : "Not enabled. Add an extra layer of security to your account."
                }
              />
            </div>
            <LedgerStatusBadge status={security.twoFactorEnabled ? "active" : "pending"} />
          </div>

          {!security.twoFactorEnabled && !setupData && (
            <button
              type="button"
              onClick={() => void handleSetup()}
              disabled={setup.isPending}
              className={primaryButton}
            >
              {setup.isPending ? "Setting up…" : "Enable 2FA"}
            </button>
          )}

          {setupData && (
            <div className="mt-4 flex flex-col gap-4 border-t border-tl-line-soft pt-4">
              <p className="text-sm font-bold text-tl-body">
                1. Scan this QR code with your authenticator app
              </p>
              <div className="flex justify-center">
                {/* A data-URL QR from the server: next/image would only add a
                    loader around bytes we already have. White behind it so a
                    scanner reads it in the dark theme too. */}
                <img
                  src={setupData.qrCode}
                  alt="Two-factor QR code"
                  width={192}
                  height={192}
                  className="h-48 w-48 rounded-2xl border border-tl-line bg-white p-1"
                />
              </div>
              <p className="text-center text-sm text-tl-muted">
                Can&apos;t scan?{" "}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(setupData.otpauthUrl);
                    toast.success("Setup URL copied");
                  }}
                  className={textLink}
                >
                  Copy URL <Copy size={13} aria-hidden />
                </button>
              </p>
              <p className="text-sm font-bold text-tl-body">
                2. Enter the 6-digit code from your app
              </p>
              <form onSubmit={handleEnable} className="flex flex-wrap gap-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Authenticator code"
                  value={enableCode}
                  onChange={(event) => setEnableCode(onlyCode(event.target.value))}
                  placeholder="000000"
                  className={cn(fieldControl, "min-w-[140px] flex-1 text-center font-mono tracking-widest")}
                />
                <button
                  type="submit"
                  disabled={enableCode.length !== CODE_LENGTH || enable.isPending}
                  className={primaryButton}
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
              className={cn(quietButton, "-ml-3 text-tl-danger hover:bg-tl-danger-bg hover:text-tl-danger")}
            >
              Disable 2FA
            </button>
          )}

          {showDisable && (
            <form
              onSubmit={handleDisable}
              className="mt-4 flex flex-col gap-3 border-t border-tl-line-soft pt-4"
            >
              <p className="text-sm font-bold text-tl-body">Enter your current 2FA code to disable</p>
              <div className="flex flex-wrap gap-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Current authenticator code"
                  value={disableCode}
                  onChange={(event) => setDisableCode(onlyCode(event.target.value))}
                  placeholder="000000"
                  className={cn(fieldControl, "min-w-[140px] flex-1 text-center font-mono tracking-widest")}
                />
                <button
                  type="submit"
                  disabled={disableCode.length !== CODE_LENGTH || disable.isPending}
                  className={dangerButton}
                >
                  {disable.isPending ? "Disabling…" : "Disable"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode("");
                  }}
                  className={ghostButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {security.twoFactorEnabled && (
          <section className={card}>
            <div className="flex items-start justify-between gap-4">
              <CardHeader
                title="Require 2FA for Withdrawals"
                level={3}
                subtitle="When enabled, every withdrawal will require a valid 2FA code."
              />
              <Toggle
                checked={security.requireTwoFactorForWithdrawals}
                onChange={() => void handleToggleRequire()}
                label="Require 2FA for withdrawals"
                disabled={setRequire.isPending}
              />
            </div>

            {askRequireOffCode && (
              <form
                className="mt-4 flex flex-wrap items-end gap-2.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleToggleRequire();
                }}
              >
                <label className={`${fieldLabel} min-w-[180px] flex-1`}>
                  Enter the code from your authenticator app to turn this off
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    value={requireOffCode}
                    onChange={(event) => setRequireOffCode(onlyCode(event.target.value))}
                    className={cn(fieldControl, "mt-1.5 font-mono tracking-widest")}
                    aria-label="Authenticator code"
                  />
                </label>
                <button
                  type="submit"
                  disabled={requireOffCode.length !== CODE_LENGTH || setRequire.isPending}
                  className={primaryButton}
                >
                  {setRequire.isPending ? "Turning off…" : "Turn off"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAskRequireOffCode(false);
                    setRequireOffCode("");
                  }}
                  className={ghostButton}
                >
                  Cancel
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </PermissionGate>
  );
}
