"use client";

import { Shield } from "lucide-react";
import { ErrorState } from "@/components/StateComponents";
import { EmptyNote, Pill, card, cardFrame } from "@/components/tl";
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
      <div className={cardFrame}>
        <EmptyNote icon={<Shield />} title="No payment providers enabled">
          Contact your platform administrator to configure payment providers
        </EmptyNote>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-tl-muted">Payment providers configured for this platform</p>
      <ul className="flex flex-col gap-3">
        {providers.map((provider) => (
          <li key={provider.providerName} className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-tl-ink">
                    {PROVIDER_LABELS[provider.providerName] ?? provider.providerName}
                  </p>
                  {provider.isDefault && <Pill tone="info">Default</Pill>}
                </div>
                <p className="text-sm capitalize text-tl-muted">
                  Environment: {provider.environment}
                </p>
                {provider.supportedChannels?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {provider.supportedChannels.map((channel) => (
                      <Pill key={channel} tone="muted" className="capitalize">
                        {channel.replace(/_/g, " ")}
                      </Pill>
                    ))}
                  </div>
                )}
              </div>
              <PaymentStatusBadge status={provider.isEnabled ? "active" : "inactive"} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
