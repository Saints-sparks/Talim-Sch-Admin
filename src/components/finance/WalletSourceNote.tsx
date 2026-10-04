"use client";

import { Info } from "lucide-react";

/** The full note, for the wallet screens. */
export const WALLET_SOURCE_NOTE =
  "Only online payments (Paystack, OPay, Stripe) add to the wallet. Cash, POS, cheques and confirmed bank transfers go straight to the school's bank: they update fee balances and issue receipts, but don't add to the wallet.";

/** The short note, for where a payment is recorded or confirmed. */
export const WALLET_SOURCE_NOTE_SHORT =
  "Recorded payments update fee balances and issue a receipt. The money is already in the school's bank, so it isn't added to the Talim wallet.";

/** Props of {@link WalletSourceNote}. */
export interface WalletSourceNoteProps {
  /** `short` where a payment is recorded; `full` on the wallet screens. */
  variant?: "full" | "short";
  /** Extra classes for spacing. */
  className?: string;
}

/**
 * Why a payment may not show in the wallet (product decision, 2026-10-03):
 * only online provider payments credit the platform wallet; manual payments
 * and confirmed bank transfers do not, because that money is already in the
 * school's own bank and could otherwise be withdrawn twice.
 *
 * @param props - See {@link WalletSourceNoteProps}.
 * @returns The note.
 */
export function WalletSourceNote({ variant = "full", className = "" }: WalletSourceNoteProps) {
  return (
    <p
      role="note"
      className={`flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 px-3 py-2 text-xs text-blue-900 dark:text-slate-200 ${className}`}
    >
      <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{variant === "short" ? WALLET_SOURCE_NOTE_SHORT : WALLET_SOURCE_NOTE}</span>
    </p>
  );
}
