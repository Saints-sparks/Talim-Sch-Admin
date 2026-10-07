"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { ManualPaymentModal } from "@/components/payments/ManualPaymentModal";
import { BankTransfersLink } from "@/components/payments/bankTransfers/BankTransfersLink";
import { PaymentTransactionsTab } from "@/components/payments/PaymentTransactionsTab";
import { PaymentsOverviewTab } from "@/components/payments/PaymentsOverviewTab";
import { ProvidersTab } from "@/components/payments/ProvidersTab";
import { ReceiptsTab } from "@/components/payments/ReceiptsTab";
import { PAYMENT_TABS, type PaymentTab } from "@/components/payments/tabs";
import { Page, PageHeader, Tabs, iconButton, primaryButton } from "@/components/tl";
import { usePaymentsSummary } from "@/hooks/finance/usePaymentsQueries";

/** The tab list's options: each tab with an id-safe value. */
const TAB_OPTIONS = PAYMENT_TABS.map((tab) => ({
  value: tab.toLowerCase().replace(/\s+/g, "-"),
  label: tab,
}));

/**
 * The tab a tab-list value stands for.
 *
 * @param value - The option's value ("payment-providers").
 * @returns The tab ("Payment Providers").
 */
function tabFor(value: string): PaymentTab {
  return TAB_OPTIONS.find((option) => option.value === value)?.label ?? "Overview";
}

/**
 * School payments: fee transactions, receipts and the providers parents pay
 * through.
 *
 * The route is gated on `manage:payments` by `RouteGuard` — a different
 * permission from the wallet's `manage:finance` — and recording a manual
 * payment is gated again here, because it writes the fee ledger and issues a
 * receipt just like an online payment does (it does not credit the platform
 * wallet: only online provider payments do).
 *
 * @returns The payments page.
 */
export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("Overview");
  const [showManual, setShowManual] = useState(false);

  const summary = usePaymentsSummary();

  const activeValue = TAB_OPTIONS.find((option) => option.label === activeTab)?.value ?? "overview";

  return (
    <Page>
      <PageHeader
        title="Payments"
        subtitle="Payment transactions, receipts, and provider settings"
        actions={
          <>
            {/* Reconciling transfers is fee work: shown only with manage:fees. */}
            <BankTransfersLink />
            <button
              type="button"
              onClick={() => void summary.refetch()}
              aria-label="Refresh payment totals"
              className={`${iconButton} border border-tl-control bg-tl-surface`}
            >
              <RefreshCw
                size={17}
                aria-hidden
                className={summary.isFetching ? "animate-spin text-tl-brand" : undefined}
              />
            </button>
            <PermissionGate permission={Permission.MANAGE_PAYMENTS}>
              <button type="button" onClick={() => setShowManual(true)} className={primaryButton}>
                <Plus size={16} aria-hidden /> Record Payment
              </button>
            </PermissionGate>
          </>
        }
      />

      <Tabs
        options={TAB_OPTIONS}
        value={activeValue}
        onChange={(value) => setActiveTab(tabFor(value))}
        label="Payments sections"
        idPrefix="payments"
      />

      <div role="tabpanel" id="payments-panel" aria-labelledby={`payments-tab-${activeValue}`}>
        {activeTab === "Overview" && <PaymentsOverviewTab />}
        {activeTab === "Transactions" && <PaymentTransactionsTab />}
        {activeTab === "Receipts" && <ReceiptsTab />}
        {activeTab === "Payment Providers" && <ProvidersTab />}
      </div>

      {showManual && (
        <PermissionGate permission={Permission.MANAGE_PAYMENTS}>
          <ManualPaymentModal onClose={() => setShowManual(false)} />
        </PermissionGate>
      )}
    </Page>
  );
}
