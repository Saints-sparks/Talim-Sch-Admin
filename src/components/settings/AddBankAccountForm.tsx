"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Info, Loader2, Lock, X } from "lucide-react";
import { useBankAccountActions, useBanks, useResolvedAccountName } from "@/hooks/settings/usePaymentsFinance";
import type { PaystackBank } from "@/app/services/finance.service";
import {
  InputField,
  Notice,
  OutlineBtn,
  PrimaryBtn,
  settingsErrorMessage,
} from "@/components/settings/ui";

/** Countries a payout account can be held in. */
const COUNTRIES = [
  { code: "nigeria", label: "Nigeria", flag: "🇳🇬" },
  { code: "ghana", label: "Ghana", flag: "🇬🇭" },
  { code: "kenya", label: "Kenya", flag: "🇰🇪" },
  { code: "south africa", label: "South Africa", flag: "🇿🇦" },
  { code: "other", label: "Other", flag: "🌍" },
];

/** Countries whose banks Paystack can list and whose accounts it can resolve. */
const PAYSTACK_COUNTRIES = ["nigeria", "ghana"];

const ACCOUNT_NUMBER_LENGTH = 10;

/**
 * Adds a payout bank account.
 *
 * For a Paystack country the bank is picked from the live list and the account
 * name comes from the bank itself — typed names are never trusted, because the
 * server re-checks the name at verification. Elsewhere the details are entered
 * by hand and verified by the Talim team.
 *
 * @param props.onDone - Called after a successful add, to close the form.
 * @param props.onCancel - Closes the form without saving.
 */
export function AddBankAccountForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [country, setCountry] = useState("nigeria");
  const [bankSearch, setBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<PaystackBank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [manualAccountName, setManualAccountName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const usePaystack = PAYSTACK_COUNTRIES.includes(country);
  const banks = useBanks(country, usePaystack);
  const resolved = useResolvedAccountName(accountNumber, usePaystack ? (selectedBank?.code ?? null) : null);
  const { add, adding } = useBankAccountActions();

  /** Clears everything that depended on the previous country or bank. */
  const resetAccount = () => {
    setAccountNumber("");
    setManualAccountName("");
  };

  // Close the bank dropdown on an outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowBankDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredBanks = (banks.data ?? []).filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const accountName = usePaystack ? (resolved.data ?? "") : manualAccountName;
  const canSubmit = usePaystack
    ? Boolean(selectedBank && accountNumber.length === ACCOUNT_NUMBER_LENGTH && resolved.isSuccess && accountName)
    : Boolean(bankSearch.trim() && accountNumber.trim() && manualAccountName.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || adding) return;
    const payload = usePaystack
      ? {
          bankName: selectedBank!.name,
          bankCode: selectedBank!.code,
          accountNumber,
          accountName,
          country,
        }
      : {
          bankName: bankSearch.trim(),
          bankCode: "INTL",
          accountNumber: accountNumber.trim(),
          accountName: manualAccountName.trim(),
          country,
        };
    try {
      await add(payload);
      onDone();
    } catch {
      // Reported by the mutation; the form keeps what was typed.
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 space-y-4"
    >
      <div>
        <label
          htmlFor="bank-country"
          className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
        >
          Country <span className="text-red-500">*</span>
        </label>
        <select
          id="bank-country"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setSelectedBank(null);
            setBankSearch("");
            resetAccount();
          }}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366]"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.label}
            </option>
          ))}
        </select>
      </div>

      {usePaystack ? (
        <>
          <div ref={dropdownRef} className="relative">
            <label
              htmlFor="bank-search"
              className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              Bank <span className="text-red-500">*</span>
            </label>
            <input
              id="bank-search"
              type="text"
              value={selectedBank ? selectedBank.name : bankSearch}
              onChange={(e) => {
                setBankSearch(e.target.value);
                setSelectedBank(null);
                setShowBankDropdown(true);
              }}
              onFocus={() => setShowBankDropdown(true)}
              placeholder={banks.isLoading ? "Loading banks…" : "Search for your bank"}
              disabled={banks.isLoading}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] disabled:opacity-60"
            />
            {banks.isError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {settingsErrorMessage(banks.error, "Could not load the bank list.")}{" "}
                <button type="button" onClick={() => banks.refetch()} className="underline font-medium">
                  Retry
                </button>
              </p>
            )}
            {showBankDropdown && !selectedBank && filteredBanks.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredBanks.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setSelectedBank(b);
                      setBankSearch(b.name);
                      setShowBankDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
            {selectedBank && (
              <button
                type="button"
                aria-label="Clear selected bank"
                onClick={() => {
                  setSelectedBank(null);
                  setBankSearch("");
                }}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <label
              htmlFor="bank-account-number"
              className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="bank-account-number"
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, ACCOUNT_NUMBER_LENGTH))}
                placeholder="10-digit account number"
                maxLength={ACCOUNT_NUMBER_LENGTH}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {resolved.isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {resolved.isSuccess && !resolved.isFetching && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {resolved.isError && !resolved.isFetching && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            {resolved.isError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {settingsErrorMessage(resolved.error, "Could not verify this account.")}
              </p>
            )}
          </div>

          <div>
            <p className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Account Name</p>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg min-h-[42px]">
              {resolved.isFetching ? (
                <span className="text-xs text-gray-400 dark:text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying account…
                </span>
              ) : accountName ? (
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200 flex-1">
                  {accountName}
                </span>
              ) : (
                <span className="text-sm text-gray-400 dark:text-slate-500">
                  Auto-populated after account number entry
                </span>
              )}
              {accountName && <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />}
            </div>
          </div>
        </>
      ) : (
        <>
          <InputField
            label="Bank Name"
            value={bankSearch}
            onChange={setBankSearch}
            placeholder="e.g. Barclays, HSBC"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Account / IBAN Number"
              value={accountNumber}
              onChange={setAccountNumber}
              placeholder="Account number or IBAN"
              required
            />
            <InputField
              label="Account Name"
              value={manualAccountName}
              onChange={setManualAccountName}
              placeholder="Name on account"
              required
            />
          </div>
          <Notice icon={<Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}>
            International bank payouts are processed manually. Our team will verify the account
            details.
          </Notice>
        </>
      )}

      <Notice tone="warning" icon={<AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />}>
        Ensure the account details are correct. Wrong details may cause withdrawal delays.
      </Notice>

      <div className="flex gap-3">
        <OutlineBtn onClick={onCancel} disabled={adding}>
          Cancel
        </OutlineBtn>
        <PrimaryBtn type="submit" loading={adding} disabled={!canSubmit}>
          <CreditCard className="w-3.5 h-3.5" /> Add Account
        </PrimaryBtn>
      </div>
    </form>
  );
}
