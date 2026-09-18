"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { logger } from "@/lib/logger";
import { ApiError } from "@/lib/apiError";
import { useAddBankAccount } from "@/hooks/finance/useFinanceMutations";
import { NUBAN_LENGTH, useBanks, useResolvedAccountName } from "@/hooks/finance/useBankLookup";
import { ModalShell } from "./ModalShell";
import { financeActionMessage } from "./financeErrors";

/**
 * Adds a payout account.
 *
 * The bank list comes from the Paystack proxy and the account name is resolved
 * from the bank, because verification later insists the stored name matches
 * what the bank reports. If either lookup is unavailable the form degrades to
 * manual entry rather than blocking the admin.
 *
 * @param props - Close handler; fires after a successful add too.
 * @returns The add-account modal.
 */
export function AddBankAccountModal({ onClose }: { onClose: () => void }) {
  const banks = useBanks();
  const addAccount = useAddBankAccount();

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  const resolved = useResolvedAccountName(accountNumber, bankCode);
  const bankList = banks.data ?? [];
  const selectedBank = bankList.find((bank) => bank.code === bankCode);
  // Without the bank list there is no code to send, so the admin types both.
  const manualBankEntry = banks.isError;

  // Resolution wins over anything typed, until the admin edits the name itself.
  useEffect(() => {
    if (resolved.data && !nameTouched) setAccountName(resolved.data);
  }, [resolved.data, nameTouched]);

  // A new number invalidates a previously resolved name.
  useEffect(() => {
    setNameTouched(false);
  }, [accountNumber, bankCode]);

  const [manualBankName, setManualBankName] = useState("");
  const bankName = manualBankEntry ? manualBankName : (selectedBank?.name ?? "");
  const canSubmit =
    Boolean(bankName) &&
    Boolean(bankCode) &&
    accountNumber.length === NUBAN_LENGTH &&
    accountName.trim().length > 0 &&
    !addAccount.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await addAccount.mutateAsync({
        bankName,
        bankCode,
        accountNumber,
        accountName: accountName.trim(),
      });
      toast.success("Bank account added — verify it before withdrawing to it");
      onClose();
    } catch (error) {
      logger.error("finance", "add bank account failed", error);
      toast.error(financeActionMessage(error, "Failed to add the account"));
    }
  };

  const resolveFailure =
    resolved.isError && resolved.error instanceof ApiError ? resolved.error.message : null;

  return (
    <ModalShell title="Add Payout Account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="bank-select" className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1 block">
            Bank
          </label>
          {manualBankEntry ? (
            <div className="space-y-2">
              <input
                id="bank-select"
                type="text"
                value={manualBankName}
                onChange={(event) => setManualBankName(event.target.value)}
                placeholder="Bank name"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                required
              />
              <input
                type="text"
                value={bankCode}
                onChange={(event) => setBankCode(event.target.value.replace(/\D/g, ""))}
                placeholder="Bank code"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                required
              />
              <p className="text-xs text-amber-600 flex items-start gap-1">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                We couldn&apos;t load the bank list. Enter the bank name and code exactly as your
                bank publishes them.
              </p>
            </div>
          ) : (
            <select
              id="bank-select"
              value={bankCode}
              onChange={(event) => setBankCode(event.target.value)}
              disabled={banks.isPending}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 disabled:opacity-60"
              required
            >
              <option value="">{banks.isPending ? "Loading banks…" : "Select bank"}</option>
              {bankList.map((bank) => (
                <option key={`${bank.code}-${bank.id}`} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="account-number" className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1 block">
            Account Number
          </label>
          <input
            id="account-number"
            type="text"
            inputMode="numeric"
            maxLength={NUBAN_LENGTH}
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
            placeholder="0000000000"
            className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            required
          />
        </div>

        <div>
          <label htmlFor="account-name" className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1 block">
            Account Name
          </label>
          <input
            id="account-name"
            type="text"
            value={accountName}
            onChange={(event) => {
              setNameTouched(true);
              setAccountName(event.target.value);
            }}
            placeholder="As registered with the bank"
            className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            required
          />
          {resolved.isFetching && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Checking with the bank…
            </p>
          )}
          {!resolved.isFetching && resolved.data && !nameTouched && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle size={12} /> Confirmed by the bank
            </p>
          )}
          {!resolved.isFetching && resolveFailure && (
            <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              {resolveFailure} Type the name exactly as the bank holds it — verification compares
              the two.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {addAccount.isPending ? "Adding…" : "Add Account"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
