"use client";

import { Shield } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import { CardListSkeleton } from "@/components/finance/FinanceSkeletons";
import { describeFinanceError } from "@/components/finance/financeErrors";
import { usePaymentProviders } from "@/hooks/finance/usePaymentsQueries";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PROVIDER_LABELS } from "./tabs";

/**
 * The payment providers configured for checkout.
 *
 * Read-only by design: provider credentials are platform-level configuration,
 * and the school-admin API exposes no way to change them.
 *
 * @returns The providers tab.
 */
export function ProvidersTab() {
  const query = usePaymentProviders();

  if (query.isPending) return <CardListSkeleton />;

  if (query.isError) {
    const copy = describeFinanceError(query.error, "payment providers");
    return (
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={copy.retryable ? () => void query.refetch() : undefined}
      />
    );
  }

  const providers = query.data ?? [];

  if (providers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 py-16 text-center">
        <Shield size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-600 dark:text-slate-300">No payment providers enabled</p>
        <p className="text-sm text-gray-400 mt-1">
          Contact your platform administrator to configure payment providers
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-slate-400">Payment providers configured for this platform</p>
      {providers.map((provider) => (
        <div key={provider.providerName} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold text-gray-800 dark:text-slate-100">
                  {PROVIDER_LABELS[provider.providerName] ?? provider.providerName}
                </p>
                {provider.isDefault && (
                  <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 capitalize">
                Environment: {provider.environment}
              </p>
              {provider.supportedChannels?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {provider.supportedChannels.map((channel) => (
                    <span
                      key={channel}
                      className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full capitalize"
                    >
                      {channel.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <PaymentStatusBadge status={provider.isEnabled ? "active" : "inactive"} />
          </div>
        </div>
      ))}
    </div>
  );
}
