"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { ManualPaymentModal } from "@/components/payments/ManualPaymentModal";
import { PaymentTransactionsTab } from "@/components/payments/PaymentTransactionsTab";
import { PaymentsOverviewTab } from "@/components/payments/PaymentsOverviewTab";
import { ProvidersTab } from "@/components/payments/ProvidersTab";
import { ReceiptsTab } from "@/components/payments/ReceiptsTab";
import { PAYMENT_TABS, type PaymentTab } from "@/components/payments/tabs";
import { usePaymentsSummary } from "@/hooks/finance/usePaymentsQueries";

/**
 * School payments: fee transactions, receipts and the providers parents pay
 * through.
 *
 * The route is gated on `manage:payments` by `RouteGuard` — a different
 * permission from the wallet's `manage:finance` — and recording a manual
 * payment is gated again here, because it credits the wallet and issues a
 * receipt just like an online payment does.
 *
 * @returns The payments page.
 */
export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("Overview");
  const [showManual, setShowManual] = useState(false);

  const summary = usePaymentsSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Payment transactions, receipts, and provider settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void summary.refetch()}
              aria-label="Refresh payment totals"
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw
                size={16}
                className={summary.isFetching ? "animate-spin text-[#003366]" : "text-gray-500"}
              />
            </button>
            <PermissionGate permission={Permission.MANAGE_PAYMENTS}>
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
              >
                <Plus size={16} /> Record Payment
              </button>
            </PermissionGate>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-white text-[#003366] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
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
      </div>
    </div>
  );
}
