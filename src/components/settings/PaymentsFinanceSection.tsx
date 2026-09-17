"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import {
  useBankAccountActions,
  useBankAccounts,
  useFinanceSettings,
  useUpdateFinanceSettings,
  useWalletSummary,
} from "@/hooks/settings/usePaymentsFinance";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { AddBankAccountForm } from "@/components/settings/AddBankAccountForm";
import {
  Card,
  CardHeader,
  OutlineBtn,
  PrimaryBtn,
  SectionError,
  SectionHeader,
  SectionSkeleton,
  ToggleRow,
} from "@/components/settings/ui";

const TITLE = "Payments & Finance";
const DESC = "Wallet, withdrawals and payout settings";

/** Naira, with the kobo the wallet reports. */
const NGN = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

/** Providers Talim enables centrally; a school cannot switch them on or off. */
const PROVIDERS = [
  { name: "Paystack", desc: "Cards, Bank Transfer, USSD", tone: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  { name: "OPay", desc: "Wallet, Transfer, Card", tone: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  { name: "Stripe", desc: "Card (Visa, Mastercard)", tone: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
];

/**
 * Settings → Payments & Finance: the wallet at a glance, the withdrawal
 * safeguards and the payout bank accounts.
 *
 * The wallet and account list belong to Finance (`manage:finance`); the
 * safeguards belong to Settings (`manage:settings`). Each part is shown only
 * to a role that holds the permission governing it.
 *
 * @param props.canManage - True when the user holds `manage:settings`.
 */
export function PaymentsFinanceSection({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canSeeFinance = hasPermission(Permission.MANAGE_FINANCE);

  const wallet = useWalletSummary();
  const accounts = useBankAccounts();
  const settings = useFinanceSettings();
  const { save, saving } = useUpdateFinanceSettings();
  const { makeDefault } = useBankAccountActions();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [minAmount, setMinAmount] = useState("");

  useEffect(() => {
    if (settings.data) setMinAmount(String(settings.data.minimumWithdrawalAmount ?? 10000));
  }, [settings.data]);

  const isLoading = settings.isLoading || (canSeeFinance && (wallet.isLoading || accounts.isLoading));
  if (isLoading) return <SectionSkeleton title={TITLE} desc={DESC} />;

  // The withdrawal settings are the part this section owns: if they fail, the
  // section has nothing to show.
  if (settings.isError) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={settings.error}
        fallback="Failed to load the withdrawal settings."
        onRetry={() => settings.refetch()}
      />
    );
  }

  const accountList = accounts.data ?? [];
  const defaultAccount = accountList.find((a) => a.isDefault);

  const saveMinAmount = () => {
    const amount = Number.parseFloat(minAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter an amount of 0 or more");
      return;
    }
    void save({ minimumWithdrawalAmount: amount }, "Minimum withdrawal amount saved");
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <Card>
        <CardHeader title="Payment Providers" />
        <div className="p-5 space-y-3">
          {PROVIDERS.map((p) => (
            <div key={p.name} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${p.bg}`}>
              <div>
                <p className={`text-sm font-semibold ${p.tone}`}>{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{p.desc}</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium shrink-0">
                Enabled by Talim
              </span>
            </div>
          ))}
        </div>
      </Card>

      {canSeeFinance && wallet.data && (
        <Card>
          <CardHeader
            title="School Wallet"
            action={
              <OutlineBtn onClick={() => router.push("/finance")}>
                View Finance <ChevronRight className="w-3.5 h-3.5" />
              </OutlineBtn>
            }
          />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Available Balance", value: NGN(wallet.data.availableBalance), tone: "text-green-700 dark:text-green-400" },
              { label: "Pending Balance", value: NGN(wallet.data.pendingBalance), tone: "text-yellow-700 dark:text-yellow-400" },
              { label: "Total Received", value: NGN(wallet.data.ledgerBalance), tone: "text-[#003366] dark:text-blue-400" },
              { label: "Total Withdrawn", value: NGN(wallet.data.withdrawnBalance), tone: "text-gray-700 dark:text-slate-300" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Withdrawal Settings" />
        <div className="px-5 pb-3 pt-1">
          <ToggleRow
            label="Require email OTP for withdrawals"
            desc="Send a 6-digit OTP to your email before each withdrawal"
            checked={settings.data?.requireEmailOtpForWithdrawals ?? true}
            disabled={!canManage || saving}
            onChange={(v) => void save({ requireEmailOtpForWithdrawals: v })}
          />
          <div className="py-3 border-b border-gray-50 dark:border-slate-700">
            <label
              htmlFor="min-withdrawal"
              className="block text-sm font-medium text-gray-800 dark:text-slate-200 mb-2"
            >
              Minimum Withdrawal Amount (₦)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="min-withdrawal"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min={0}
                disabled={!canManage}
                className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] disabled:opacity-60"
              />
              {canManage && (
                <PrimaryBtn onClick={saveMinAmount} loading={saving}>
                  Save
                </PrimaryBtn>
              )}
            </div>
          </div>
          <div className="py-3">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-1">
              Default Payout Account
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {defaultAccount
                ? `${defaultAccount.bankName} – ${defaultAccount.accountNumber}`
                : "No default account set"}
            </p>
          </div>
        </div>
      </Card>

      {canSeeFinance && (
        <Card>
          <CardHeader
            title="Bank Accounts"
            action={
              <OutlineBtn onClick={() => setShowAddAccount((v) => !v)}>
                <Plus className="w-3.5 h-3.5" /> {showAddAccount ? "Cancel" : "Add Account"}
              </OutlineBtn>
            }
          />
          <AnimatePresence>
            {showAddAccount && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <AddBankAccountForm
                  onDone={() => setShowAddAccount(false)}
                  onCancel={() => setShowAddAccount(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {accounts.isError ? (
              <div className="text-center py-10 text-sm text-gray-500 dark:text-slate-400">
                We couldn&apos;t load your bank accounts.{" "}
                <button
                  type="button"
                  onClick={() => accounts.refetch()}
                  className="text-[#003366] dark:text-blue-400 underline font-medium"
                >
                  Try again
                </button>
              </div>
            ) : accountList.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
                No bank accounts added
              </div>
            ) : (
              accountList.map((a) => (
                <div key={a._id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {a.bankName} – {a.accountNumber}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{a.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.isDefault ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void makeDefault(a._id)}
                        className="text-xs text-gray-500 dark:text-slate-400 hover:text-[#003366] dark:hover:text-blue-400 border border-gray-200 dark:border-slate-600 px-2 py-0.5 rounded-full transition"
                      >
                        Set Default
                      </button>
                    )}
                    <span
                      className={`w-2 h-2 rounded-full ${a.isVerified ? "bg-green-400" : "bg-gray-300 dark:bg-slate-600"}`}
                      title={a.isVerified ? "Verified" : "Unverified"}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
