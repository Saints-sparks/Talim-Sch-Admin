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
 * @param props.allowPartialPayment - The form's switch.
 * @param props.defaultAmount - The fee's amount as typed.
 * @param props.id - Id for `aria-describedby`.
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
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
        hint.tone === "warning" ? "bg-tl-warning-bg text-tl-warning" : "bg-tl-subtle text-tl-muted"
      }`}
    >
      <Icon size={15} className="mt-0.5 shrink-0" aria-hidden />
      <span>{hint.text}</span>
    </p>
  );
}
