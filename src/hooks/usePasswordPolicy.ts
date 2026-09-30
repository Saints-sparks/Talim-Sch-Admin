/**
 * The server's password rules (`GET /auth/password-policy`, Round 4 §34), for
 * the change-password forms' checklist and their client-side check.
 */
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/app/services/auth.service";
import { settingsKeys } from "@/hooks/settings/keys";
import { staleTimes } from "@/lib/queryKeys";
import {
  DEFAULT_PASSWORD_POLICY,
  normalizePasswordPolicy,
  passwordHistoryNote,
  rulesFromPolicy,
  type PasswordRule,
} from "@/lib/passwordPolicy";
import type { PasswordPolicy } from "@/types/round4Contract";

/** What {@link usePasswordPolicy} returns. */
export interface PasswordPolicyState {
  /** The server's policy, or the built-in copy until it answers. */
  policy: PasswordPolicy;
  /** The checklist, one rule per requirement. */
  rules: PasswordRule[];
  /** "It can't be one of your last 3 passwords.", or null. */
  historyNote: string | null;
  /** True while the policy is being fetched for the first time. */
  isLoading: boolean;
}

/**
 * The password rules to show and check. Falls back to the built-in copy of
 * the backend policy while loading or when the request fails, so a form is
 * never left without rules (the server checks again on submit).
 *
 * @returns The policy, its rules and the reuse note.
 */
export function usePasswordPolicy(): PasswordPolicyState {
  const query = useQuery({
    queryKey: settingsKeys.passwordPolicy(),
    queryFn: async () => normalizePasswordPolicy(await authService.getPasswordPolicy()),
    staleTime: staleTimes.reference,
    retry: 1,
  });
  const policy = query.data ?? DEFAULT_PASSWORD_POLICY;
  const rules = useMemo(() => rulesFromPolicy(policy), [policy]);
  return { policy, rules, historyNote: passwordHistoryNote(policy), isLoading: query.isLoading };
}
