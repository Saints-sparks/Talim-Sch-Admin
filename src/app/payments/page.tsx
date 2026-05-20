"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, TrendingUp, CheckCircle, Clock, XCircle,
  RefreshCw, Plus, Eye, X, Search, Filter, Download,
  Receipt as ReceiptIcon, AlertCircle, Loader2, Shield,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import {
  getAdminTransactions, getAdminSummary, createManualPayment, getAdminReceipts,
  getEnabledProviders,
  type PaymentTransaction, type Receipt, type AdminSummary, type PaymentProvider,
} from "@/app/services/payments.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NGN = (n: number) =>
  `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const TABS = ["Overview", "Transactions", "Receipts", "Payment Providers"] as const;
type Tab = typeof TABS[number];

// ─── Status Badges ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    successful: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
    refunded: "bg-orange-100 text-orange-600",
    partial: "bg-blue-100 text-blue-700",
    issued: "bg-green-100 text-green-700",
    voided: "bg-red-100 text-red-600",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = "text-[#003366]" }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-start shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-[#E8EDF3] flex items-center justify-center shrink-0">
        <Icon size={20} className="text-[#003366]" />
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ summary, loading }: { summary: AdminSummary | null; loading: boolean }) {
  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;
  if (!summary) return <div className="text-center py-12 text-gray-400">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Collected" value={NGN(summary.totalPaid)} icon={TrendingUp} color="text-green-600" />
        <StatCard label="Total Transactions" value={String(summary.totalTransactions)} icon={CreditCard} />
        <StatCard label="Successful" value={String(summary.totalTransactions - summary.totalPending - summary.totalFailed)} sub="payments completed" icon={CheckCircle} color="text-green-600" />
        <StatCard label="Pending" value={String(summary.totalPending)} icon={Clock} color="text-yellow-600" />
        <StatCard label="Failed" value={String(summary.totalFailed)} icon={XCircle} color="text-red-500" />
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#E8EDF3] flex items-center justify-center shrink-0">
            <Shield size={20} className="text-[#003366]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Currency</p>
            <p className="font-bold text-gray-800">{summary.currency || "NGN"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTransactions({
        page,
        limit: 20,
        status: statusFilter || undefined,
        providerName: providerFilter || undefined,
      });
      setTransactions(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, providerFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {["pending", "successful", "failed", "cancelled", "refunded"].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Providers</option>
            {["paystack", "opay", "stripe"].map((p) => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
          <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={15} className={loading ? "animate-spin text-[#003366]" : "text-gray-500"} />
          </button>
        </div>
        <p className="text-xs text-gray-400">{total} transactions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Reference", "Provider", "Amount", "School Earns", "Channel", "Status", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No transactions found</td></tr>
            ) : transactions.map((t) => (
              <tr key={t._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.internalReference}</td>
                <td className="px-4 py-3 capitalize text-gray-700">{t.providerName}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{NGN(t.totalAmount)}</td>
                <td className="px-4 py-3 text-green-600 font-medium">{NGN(t.schoolAmount)}</td>
                <td className="px-4 py-3 capitalize text-gray-500">{t.paymentChannel || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(t.paidAt || t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

// ─── Receipts Tab ─────────────────────────────────────────────────────────────

function ReceiptsTab() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReceipts({ page, limit: 20 });
      setReceipts(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} receipt{total !== 1 ? "s" : ""}</p>
        <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw size={15} className={loading ? "animate-spin text-[#003366]" : "text-gray-500"} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Receipt #", "Total Paid", "Payment Method", "Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No receipts found</td></tr>
            ) : receipts.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[#003366]">{r.receiptNumber}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{NGN(r.totalPaid)}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{r.paymentMethod}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.paymentDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(r)}
                    className="text-xs text-[#003366] hover:underline flex items-center gap-1"
                  >
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Receipt Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Receipt {selected.receiptNumber}</h3>
                <p className="text-sm text-gray-400">{fmtDate(selected.paymentDate)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {selected.feeItems.map((item: { feeName: string; category: string; description: string; amount: number }, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.feeName}</span>
                    <span className="font-medium">{NGN(item.amount)}</span>
                  </div>
                ))}
                {selected.lateFee > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Late Fee</span><span>{NGN(selected.lateFee)}</span>
                  </div>
                )}
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span><span>-{NGN(selected.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#003366] border-t border-gray-200 pt-2 mt-2">
                  <span>Total Paid</span><span>{NGN(selected.totalPaid)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Payment Method</p>
                  <p className="font-medium capitalize">{selected.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Provider</p>
                  <p className="font-medium capitalize">{selected.paymentProvider}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Reference</p>
                  <p className="font-mono text-xs">{selected.transactionReference}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Verification</p>
                  <p className="font-mono text-xs">{selected.verificationCode}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <StatusBadge status={selected.status} />
                <p className="text-xs text-gray-400">Issued {fmtDate(selected.issuedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Providers Tab ────────────────────────────────────────────────────

function ProvidersTab() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnabledProviders()
      .then((d) => setProviders(d.providers || []))
      .catch(() => toast.error("Failed to load providers"))
      .finally(() => setLoading(false));
  }, []);

  const PROVIDER_LABELS: Record<string, string> = {
    paystack: "Paystack",
    opay: "OPay",
    stripe: "Stripe",
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading…</div>;

  if (providers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <Shield size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-600">No payment providers enabled</p>
        <p className="text-sm text-gray-400 mt-1">Contact your platform administrator to configure payment providers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Payment providers configured for this platform</p>
      {providers.map((p) => (
        <div key={p.providerName} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-800">{PROVIDER_LABELS[p.providerName] || p.providerName}</p>
                {p.isDefault && <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full">Default</span>}
              </div>
              <p className="text-sm text-gray-500 capitalize">Environment: {p.environment}</p>
              {p.supportedChannels?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {p.supportedChannels.map((ch) => (
                    <span key={ch} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{ch.replace(/_/g, " ")}</span>
                  ))}
                </div>
              )}
            </div>
            <StatusBadge status={p.isEnabled ? "active" : "inactive"} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Manual Payment Modal ─────────────────────────────────────────────────────

function ManualPaymentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    studentId: "",
    feeAssignmentIds: "",
    amount: "",
    paymentMethod: "cash",
    reference: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = form.feeAssignmentIds.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return toast.error("Enter at least one fee assignment ID");
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");

    setLoading(true);
    try {
      await createManualPayment({
        studentId: form.studentId,
        feeAssignmentIds: ids,
        amount,
        paymentMethod: form.paymentMethod,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Manual payment recorded");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">Record Manual Payment</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Student ID</label>
            <input
              type="text"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              placeholder="MongoDB ObjectId of student"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Fee Assignment IDs</label>
            <textarea
              value={form.feeAssignmentIds}
              onChange={(e) => setForm((f) => ({ ...f, feeAssignmentIds: e.target.value }))}
              placeholder="Comma-separated fee assignment IDs"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 resize-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (₦)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="pos">POS</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Reference (optional)</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              placeholder="e.g. bank teller reference"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Internal note"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {loading ? "Recording…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Payments Page ───────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await getAdminSummary();
      setSummary(data);
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            <p className="text-sm text-gray-400 mt-0.5">Payment transactions, receipts, and provider settings</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadSummary} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
              <RefreshCw size={16} className={summaryLoading ? "animate-spin text-[#003366]" : "text-gray-500"} />
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
            >
              <Plus size={16} /> Record Payment
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-white text-[#003366] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "Overview" && <OverviewTab summary={summary} loading={summaryLoading} />}
          {activeTab === "Transactions" && <TransactionsTab />}
          {activeTab === "Receipts" && <ReceiptsTab />}
          {activeTab === "Payment Providers" && <ProvidersTab />}
        </div>

        {showManual && (
          <ManualPaymentModal
            onClose={() => setShowManual(false)}
            onSuccess={loadSummary}
          />
        )}
      </div>
    </div>
  );
}
