"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { logger } from "@/lib/logger";
import { ApiError } from "@/lib/apiError";
import { useAddBankAccount } from "@/hooks/finance/useFinanceMutations";
import { NUBAN_LENGTH, useBanks, useResolvedAccountName } from "@/hooks/finance/useBankLookup";
import { fieldControl, fieldLabel, ghostButton, primaryButton } from "@/components/tl";
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
 * @param props.onClose - Closes the modal.
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

  /**
   * Adds the account, then closes.
   *
   * @param event - The form's submit event.
   */
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[18px] px-[clamp(20px,3vw,28px)] py-5"
      >
        <div>
          <label htmlFor="bank-select" className={`${fieldLabel} mb-1.5 block`}>
            Bank
          </label>
          {manualBankEntry ? (
            <div className="flex flex-col gap-2">
              <input
                id="bank-select"
                type="text"
                value={manualBankName}
                onChange={(event) => setManualBankName(event.target.value)}
                placeholder="Bank name"
                className={fieldControl}
                required
              />
              <input
                type="text"
                value={bankCode}
                onChange={(event) => setBankCode(event.target.value.replace(/\D/g, ""))}
                placeholder="Bank code"
                aria-label="Bank code"
                className={`${fieldControl} font-mono`}
                required
              />
              <p className="flex items-start gap-1.5 rounded-xl bg-tl-warning-bg px-3 py-2 text-[13px] text-tl-warning">
                <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
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
              className={fieldControl}
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
          <label htmlFor="account-number" className={`${fieldLabel} mb-1.5 block`}>
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
            className={`${fieldControl} font-mono tracking-wider`}
            required
          />
        </div>

        <div>
          <label htmlFor="account-name" className={`${fieldLabel} mb-1.5 block`}>
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
            className={fieldControl}
            required
          />
          {resolved.isFetching && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-tl-muted">
              <Loader2 size={14} className="animate-spin" aria-hidden /> Checking with the bank…
            </p>
          )}
          {!resolved.isFetching && resolved.data && !nameTouched && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-tl-success">
              <CheckCircle size={14} aria-hidden /> Confirmed by the bank
            </p>
          )}
          {!resolved.isFetching && resolveFailure && (
            <p className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-tl-warning-bg px-3 py-2 text-[13px] text-tl-warning">
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
              {resolveFailure} Type the name exactly as the bank holds it — verification compares
              the two.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button type="button" onClick={onClose} className={`${ghostButton} flex-1`}>
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit} className={`${primaryButton} flex-1`}>
            {addAccount.isPending ? "Adding…" : "Add Account"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
