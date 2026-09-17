/**
 * Bank lookups behind the "add payout account" form.
 *
 * Verification compares the name the bank holds for an account number with the
 * name stored on the account, and refuses the account if they differ. So the
 * form resolves the name from the bank rather than trusting what was typed —
 * an account added with a typed name usually fails verification later, and the
 * admin has to remove it and start again.
 */
"use client";

import { useEffect, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import {
  getBanks,
  resolveBankAccount,
  type PaystackBank,
} from "@/app/services/finance.service";

/** Account numbers are 10 digits in Nigeria; resolution is pointless before that. */
export const NUBAN_LENGTH = 10;

/** How long to wait after the last keystroke before resolving. */
const RESOLVE_DEBOUNCE_MS = 400;

/**
 * The bank list for a country.
 *
 * Not school-scoped — the list is the same for every school — so it hangs off
 * the finance root key rather than a per-school one, and is cached as
 * reference data.
 *
 * @param country - Paystack country slug.
 * @returns Query result; `data` is `[]` until it loads.
 */
export function useBanks(country = "nigeria"): UseQueryResult<PaystackBank[]> {
  return useQuery({
    queryKey: [...queryKeys.finance.all, "banks", country],
    queryFn: async () => (await getBanks(country)).banks ?? [],
    staleTime: staleTimes.reference,
    // A provider outage must not block adding an account; the form falls back
    // to letting the admin type the name, so one attempt is enough.
    retry: false,
  });
}

/**
 * The name the bank holds for an account number, resolved as it is typed.
 *
 * Idle until both a bank and a full account number are present, and debounced
 * so a 10-digit number costs one lookup rather than ten.
 *
 * @param accountNumber - Account number as typed.
 * @param bankCode - Selected bank's code.
 * @returns Query result; `data` is the resolved account name.
 */
export function useResolvedAccountName(
  accountNumber: string,
  bankCode: string
): UseQueryResult<string> {
  const [debouncedNumber, setDebouncedNumber] = useState(accountNumber);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNumber(accountNumber), RESOLVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [accountNumber]);

  const ready = debouncedNumber.length === NUBAN_LENGTH && Boolean(bankCode);

  return useQuery({
    queryKey: [...queryKeys.finance.all, "resolveAccount", bankCode, debouncedNumber],
    queryFn: async () => (await resolveBankAccount(debouncedNumber, bankCode)).accountName,
    enabled: ready,
    staleTime: staleTimes.reference,
    retry: false,
  });
}
