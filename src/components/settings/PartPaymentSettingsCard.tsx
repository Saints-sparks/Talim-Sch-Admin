"use client";

import { useEffect, useId, useState } from "react";
import { Card, CardHeader, PrimaryBtn } from "@/components/settings/ui";
import { parseMinimumPartPayment } from "@/components/fees/partPayments";
import type {
  FinanceSettings,
  UpdateFinanceSettingsDto,
} from "@/app/services/school-settings.service";

/** Props of {@link PartPaymentSettingsCard}. */
export interface PartPaymentSettingsCardProps {
  /** The saved finance settings. */
  settings: FinanceSettings | undefined;
  /** True when the admin holds `manage:settings`. */
  canManage: boolean;
  /** True while a finance-settings save is in flight. */
  saving: boolean;
  /** Saves finance settings (`PATCH /settings/finance`). */
  save: (dto: UpdateFinanceSettingsDto, successMessage?: string) => Promise<unknown>;
}

/**
 * Settings → Payments & Finance → Part payments: the smallest part payment a
 * parent may make (`FinanceSettings.minimumPartPayment`, naira, 0 = none).
 * It applies only to fees that allow part payment; paying the whole balance
 * is always allowed, even when it is smaller.
 *
 * @param props - See {@link PartPaymentSettingsCardProps}.
 * @returns The card.
 */
export function PartPaymentSettingsCard({
  settings,
  canManage,
  saving,
  save,
}: PartPaymentSettingsCardProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (settings) setValue(String(settings.minimumPartPayment ?? 0));
  }, [settings]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseMinimumPartPayment(value);
    if (parsed.error !== undefined) {
      setError(parsed.error);
      return;
    }
    setError(null);
    try {
      await save({ minimumPartPayment: parsed.value }, "Minimum part payment saved");
    } catch {
      // The save hook has already rolled back and reported the failure.
    }
  };

  return (
    <Card>
      <CardHeader title="Part Payments" />
      <form onSubmit={submit} noValidate className="px-5 py-4 space-y-2">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-800 dark:text-slate-200"
        >
          Minimum part payment (₦)
        </label>
        <p id={hintId} className="text-xs text-gray-600 dark:text-slate-400">
          Applies to fees that allow part payment. 0 means parents may pay any amount. A parent
          paying the whole remaining balance is never blocked.
        </p>
        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            disabled={!canManage}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/30 disabled:opacity-60"
          />
          {canManage && (
            <PrimaryBtn type="submit" loading={saving}>
              Save
            </PrimaryBtn>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
