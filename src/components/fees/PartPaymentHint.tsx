"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useFinanceSettings } from "@/hooks/settings/usePaymentsFinance";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { partPaymentHint } from "./partPayments";

/** Props of {@link PartPaymentHint}. */
export interface PartPaymentHintProps {
  /** The form's "Allow Partial Payment" switch. */
  allowPartialPayment: boolean;
  /** The fee's amount as typed. */
  defaultAmount: string;
  /** Id for `aria-describedby` on the switch. */
  id?: string;
}

/**
 * The part-payment rule under the fee form's "Allow Partial Payment" switch,
 * with the school's minimum part payment (`GET /settings/finance`, readable
 * with `manage:settings` or `manage:fees`; anyone else gets the rule without
 * the figure, and no request is made).
 *
 * @param props - See {@link PartPaymentHintProps}.
 * @returns The hint.
 */
export function PartPaymentHint({ allowPartialPayment, defaultAmount, id }: PartPaymentHintProps) {
  const { hasAnyPermission } = usePermissions();
  const canReadMinimum = hasAnyPermission(Permission.MANAGE_SETTINGS, Permission.MANAGE_FEES);
  const finance = useFinanceSettings({ enabled: canReadMinimum && allowPartialPayment });
  const minimum = canReadMinimum ? finance.data?.minimumPartPayment : undefined;
  const hint = partPaymentHint({ allowPartialPayment, defaultAmount }, minimum);
  const Icon = hint.tone === "warning" ? AlertTriangle : Info;

  return (
    <p
      id={id}
      aria-live="polite"
      className={`flex items-start gap-1.5 text-xs ${
        hint.tone === "warning"
          ? "text-amber-800 dark:text-amber-300"
          : "text-gray-600 dark:text-gray-400"
      }`}
    >
      <Icon size={13} className="mt-0.5 shrink-0" aria-hidden />
      <span>{hint.text}</span>
    </p>
  );
}
