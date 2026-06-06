"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Copy,
  ChevronRight,
  Mail,
  ArrowLeft,
  Banknote,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import {
  getWalletSummary,
  getWalletTransactions,
  getBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  verifyBankAccount,
  removeBankAccount,
  initiateWithdrawal,
  resendWithdrawalOtp,
  verifyWithdrawalOtp,
  confirmWithdrawal,
  getWithdrawals,
  cancelWithdrawal,
  getSecurityStatus,
  setup2fa,
  verify2fa,
  disable2fa,
  setRequire2faForWithdrawals,
  type WalletSummary,
  type LedgerEntry,
  type BankAccount,
  type WithdrawalRequest,
  type WithdrawalSummary,
  type SecurityStatus,
} from "@/app/services/finance.service";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const MIN_WITHDRAWAL = 10_000;
const DAILY_LIMIT = 2_000_000;
const PLATFORM_CHARGE_PCT = 0;

const NGN = (n: number) =>
  `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function amountInWords(n: number): string {
  if (!n || n <= 0) return "";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const conv = (x: number): string => {
    if (x === 0) return "";
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
    if (x < 1_000)
      return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + conv(x % 100) : "");
    if (x < 1_000_000)
      return conv(Math.floor(x / 1_000)) + " Thousand" + (x % 1_000 ? " " + conv(x % 1_000) : "");
    return (
      conv(Math.floor(x / 1_000_000)) +
      " Million" +
      (x % 1_000_000 ? " " + conv(x % 1_000_000) : "")
    );
  };
  return conv(Math.round(n)) + " Naira Only";
}

const TABS = ["Overview", "Transactions", "Withdrawals", "Payout Accounts", "Settings"] as const;
type Tab = (typeof TABS)[number];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function WithdrawalStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending Review" },
    approved: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Approved" },
    processing: { bg: "bg-blue-50", text: "text-blue-700", label: "Processing" },
    completed: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
    rejected: { bg: "bg-red-50", text: "text-red-600", label: "Rejected" },
    failed: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelled" },
  };
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-500", label: status };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

function LedgerStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    posted: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    approved: "bg-indigo-100 text-indigo-700",
    completed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
    failed: "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
    reversed: "bg-orange-100 text-orange-600",
    credit: "bg-green-100 text-green-700",
    debit: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (idx: number, ch: string) => {
    if (!/^\d?$/.test(ch)) return;
    const next = [...digits];
    next[idx] = ch;
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    if (ch && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-[#003366] transition-colors disabled:opacity-40"
          style={{ borderColor: d ? "#003366" : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-[#003366]",
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-start shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
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

function OverviewTab({
  summary,
  onWithdraw,
  onGoToTab,
}: {
  summary: WalletSummary | null;
  onWithdraw: () => void;
  onGoToTab: (tab: Tab) => void;
}) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getWalletTransactions({ limit: 5 }).catch(() => ({ data: [] as LedgerEntry[] })),
      getWithdrawals({ limit: 5 }).catch(() => ({ data: [] as WithdrawalRequest[] })),
    ])
      .then(([tx, wd]) => {
        if (!mounted) return;
        setEntries(tx.data || []);
        setWithdrawals(wd.data || []);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (!summary)
    return <div className="text-gray-400 text-sm py-8 text-center">Loading wallet…</div>;

  const trend = [...entries]
    .reverse()
    .map((entry) => ({ label: fmtDate(entry.createdAt), value: entry.balanceAfter || 0 }))
    .slice(-7);
  const maxTrend = Math.max(...trend.map((point) => point.value), summary.availableBalance, 1);
  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const successfulWithdrawals = withdrawals.filter((w) =>
    ["completed", "successful"].includes(w.status)
  );
  const failedWithdrawals = withdrawals.filter((w) =>
    ["failed", "cancelled", "rejected"].includes(w.status)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-[#003366]" />
            <p className="text-sm text-gray-500">Wallet Balance</p>
          </div>
          <p className="text-3xl font-bold text-[#003366]">{NGN(summary.availableBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Available for withdrawal</p>
          <button
            onClick={onWithdraw}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90 transition"
          >
            <ArrowUpCircle size={15} /> Withdraw Funds
          </button>
        </div>
        <StatCard
          label="Total Received"
          value={NGN(summary.ledgerBalance)}
          sub="This academic year"
          icon={ArrowDownCircle}
        />
        <StatCard
          label="Total Withdrawn"
          value={NGN(summary.withdrawnBalance)}
          sub="This academic year"
          icon={ArrowUpCircle}
          color="text-orange-600"
        />
        <StatCard
          label="Pending Withdrawals"
          value={NGN(summary.pendingBalance)}
          sub={`${pendingCount} pending requests`}
          icon={Clock}
          color="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Recent Transactions</h3>
            <button
              onClick={() => onGoToTab("Transactions")}
              className="text-sm font-semibold text-[#003366]"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Loading transactions…</p>
            ) : entries.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet</p>
            ) : (
              entries.map((entry) => (
                <div key={entry._id} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${entry.direction === "credit" ? "bg-green-50" : "bg-red-50"}`}
                  >
                    {entry.direction === "credit" ? (
                      <ArrowDownCircle size={17} className="text-green-600" />
                    ) : (
                      <ArrowUpCircle size={17} className="text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {entry.description || entry.reference}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(entry.createdAt)}</p>
                  </div>
                  <p
                    className={`text-sm font-bold ${entry.direction === "credit" ? "text-green-600" : "text-red-500"}`}
                  >
                    {entry.direction === "credit" ? "+" : "-"}
                    {NGN(entry.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">Wallet Balance Trend</h3>
            <span className="text-xs text-gray-400">Latest activity</span>
          </div>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              No trend data yet
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2 border-b border-l border-gray-100 px-2 pt-4">
              {trend.map((point, index) => (
                <div
                  key={`${point.label}-${index}`}
                  className="flex-1 flex flex-col items-center gap-2 min-w-0"
                >
                  <div className="w-full bg-blue-50 rounded-t-lg overflow-hidden flex items-end h-36">
                    <div
                      className="w-full bg-[#0066FF] rounded-t-lg"
                      style={{ height: `${Math.max(12, (point.value / maxTrend) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Recent Withdrawals</h3>
            <button
              onClick={() => onGoToTab("Withdrawals")}
              className="text-sm font-semibold text-[#003366]"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Loading withdrawals…</p>
            ) : withdrawals.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No withdrawals yet</p>
            ) : (
              withdrawals.map((w) => {
                const acct = typeof w.bankAccountId === "object" ? w.bankAccountId : null;
                return (
                  <div key={w._id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E8EDF3] flex items-center justify-center">
                      <Building2 size={17} className="text-[#003366]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {NGN(w.amountToReceive || w.amount)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {acct
                          ? `${acct.bankName} · ****${acct.accountNumber.slice(-4)}`
                          : w.reference}
                      </p>
                    </div>
                    <WithdrawalStatusBadge status={w.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Withdrawals Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Total Withdrawn", NGN(summary.withdrawnBalance), "text-[#003366]"],
              [
                "Successful",
                NGN(
                  successfulWithdrawals.reduce((sum, w) => sum + (w.amountToReceive || w.amount), 0)
                ),
                "text-green-600",
              ],
              ["Pending", NGN(summary.pendingBalance), "text-orange-600"],
              [
                "Failed/Cancelled",
                NGN(failedWithdrawals.reduce((sum, w) => sum + (w.amountToReceive || w.amount), 0)),
                "text-red-500",
              ],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`mt-2 text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Wallet Status</p>
              <p className="font-bold text-gray-800 capitalize mt-1">{summary.status}</p>
            </div>
            <LedgerStatusBadge status={summary.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWalletTransactions({ page, limit: 20, type: typeFilter || undefined });
      setEntries(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
          >
            <option value="">All Types</option>
            <option value="credit_payment">Credit Payment</option>
            <option value="debit_withdrawal">Debit Withdrawal</option>
            <option value="withdrawal_reversal">Withdrawal Reversal</option>
            <option value="platform_fee">Platform Fee</option>
            <option value="refund">Refund</option>
          </select>
          <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw
              size={15}
              className={loading ? "animate-spin text-[#003366]" : "text-gray-500"}
            />
          </button>
        </div>
        <p className="text-xs text-gray-400">{total} transactions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {[
                "Date",
                "Type",
                "Description",
                "Reference",
                "Amount",
                "Balance After",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No transactions found
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {fmtDate(e.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <LedgerStatusBadge status={e.direction} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                    {e.description}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.reference}</td>
                  <td
                    className={`px-4 py-3 font-semibold ${e.direction === "credit" ? "text-green-600" : "text-red-500"}`}
                  >
                    {e.direction === "credit" ? "+" : "-"}
                    {NGN(e.amount)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#003366]">{NGN(e.balanceAfter)}</td>
                  <td className="px-4 py-3">
                    <LedgerStatusBadge status={e.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────────

function WithdrawalsTab({ onNewWithdrawal }: { onNewWithdrawal: () => void }) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const STATUSES = ["All", "Pending", "Processing", "Completed", "Failed", "Cancelled"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWithdrawals({ status: statusFilter || undefined, page, limit: 20 });
      setWithdrawals(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await cancelWithdrawal(id);
      toast.success("Withdrawal cancelled");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Withdrawals</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Track all withdrawal requests and their status.
        </p>
      </div>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 overflow-x-auto border-b border-gray-100">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s === "All" ? "" : s.toLowerCase());
                setPage(1);
              }}
              className={`py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                (statusFilter === "" && s === "All") || statusFilter === s.toLowerCase()
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <MoreHorizontal size={15} /> Filter
          </button>
          <button
            onClick={onNewWithdrawal}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
          >
            <ArrowUpCircle size={15} /> Withdraw Funds
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Reference", "Amount", "Bank Account", "Status", "Requested Date", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : withdrawals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Banknote size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No withdrawals found</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Your withdrawal history will appear here
                  </p>
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => {
                const acct = typeof w.bankAccountId === "object" ? w.bankAccountId : null;
                return (
                  <tr key={w._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#003366]">
                      {w.reference}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{NGN(w.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {acct ? (
                        <span>
                          {acct.bankName} · ****{acct.accountNumber.slice(-4)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <WithdrawalStatusBadge status={w.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {fmtDateTime(w.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {w.status === "pending" ? (
                        <button
                          onClick={() => handleCancel(w._id)}
                          disabled={cancelling === w._id}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-100 disabled:opacity-40"
                        >
                          {cancelling === w._id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <MoreHorizontal size={14} />
                          )}
                        </button>
                      ) : (
                        <button className="p-2 rounded-lg border border-gray-200 text-gray-400">
                          <MoreHorizontal size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Payout Accounts Tab ──────────────────────────────────────────────────────

function PayoutAccountsTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBankAccounts();
      setAccounts(data.accounts || []);
    } catch {
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addBankAccount(form);
      toast.success("Bank account added");
      setShowAdd(false);
      setForm({ bankName: "", bankCode: "", accountNumber: "", accountName: "" });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add account");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id: string) => {
    setActionId(id);
    try {
      await verifyBankAccount(id);
      toast.success("Account verified");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Verification failed");
    } finally {
      setActionId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionId(id);
    try {
      await setDefaultBankAccount(id);
      toast.success("Default account updated");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this bank account?")) return;
    setActionId(id);
    try {
      await removeBankAccount(id);
      toast.success("Account removed");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove");
    } finally {
      setActionId(null);
    }
  };

  const BANKS = [
    { name: "Access Bank", code: "044" },
    { name: "GTBank", code: "058" },
    { name: "First Bank", code: "011" },
    { name: "Zenith Bank", code: "057" },
    { name: "UBA", code: "033" },
    { name: "Fidelity Bank", code: "070" },
    { name: "Sterling Bank", code: "232" },
    { name: "Wema Bank", code: "035" },
    { name: "Opay", code: "100004" },
    { name: "Kuda", code: "090267" },
    { name: "Polaris Bank", code: "076" },
    { name: "FCMB", code: "214" },
    { name: "Ecobank", code: "050" },
    { name: "Stanbic IBTC", code: "221" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
        >
          <Plus size={15} /> Add Payout Account
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading…</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Building2 size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No payout accounts added</p>
          <p className="text-sm text-gray-400 mt-1">
            Add a verified business account to receive withdrawals
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acct) => (
            <div
              key={acct._id}
              className={`bg-white rounded-2xl border-2 p-5 ${acct.isDefault ? "border-[#003366]" : "border-gray-100"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8EDF3] flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-[#003366]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-800">{acct.bankName}</p>
                      {acct.isDefault && (
                        <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      {acct.isVerified ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={11} /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <AlertCircle size={11} /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{acct.accountName}</p>
                    <p className="font-mono text-sm text-gray-500">
                      ·· {acct.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!acct.isVerified && (
                    <button
                      onClick={() => handleVerify(acct._id)}
                      disabled={actionId === acct._id}
                      className="text-xs px-3 py-1.5 border border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366]/5 disabled:opacity-40"
                    >
                      Verify
                    </button>
                  )}
                  {acct.isVerified && !acct.isDefault && (
                    <button
                      onClick={() => handleSetDefault(acct._id)}
                      disabled={actionId === acct._id}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(acct._id)}
                    disabled={actionId === acct._id}
                    className="text-xs px-3 py-1.5 text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">Add Payout Account</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bank</label>
                <select
                  value={form.bankCode}
                  onChange={(e) => {
                    const bank = BANKS.find((b) => b.code === e.target.value);
                    setForm((f) => ({
                      ...f,
                      bankCode: e.target.value,
                      bankName: bank?.name || "",
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                  required
                >
                  <option value="">Select bank</option>
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))
                  }
                  placeholder="0000000000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Account Name</label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  placeholder="As registered with the bank"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Adding…" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [security, setSecurity] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ qrCode: string; otpauthUrl: string } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const loadSecurity = useCallback(async () => {
    try {
      const data = await getSecurityStatus();
      setSecurity(data);
    } catch {
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const handleSetup = async () => {
    setSubmitting(true);
    try {
      const data = await setup2fa();
      setSetupData(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Setup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verify2fa(tokenInput);
      toast.success("2FA enabled successfully");
      setSetupData(null);
      setTokenInput("");
      loadSecurity();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid token");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await disable2fa(disableToken);
      toast.success("2FA disabled");
      setShowDisable(false);
      setDisableToken("");
      loadSecurity();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid token");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRequire = async () => {
    if (!security) return;
    try {
      await setRequire2faForWithdrawals(!security.requireTwoFactorForWithdrawals);
      toast.success("Preference updated");
      loadSecurity();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield
                size={18}
                className={security?.twoFactorEnabled ? "text-green-500" : "text-gray-400"}
              />
              <h3 className="font-bold text-gray-800">Two-Factor Authentication</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {security?.twoFactorEnabled
                ? `Enabled since ${fmtDate(security.twoFactorEnabledAt)}`
                : "Not enabled. Add an extra layer of security to your account."}
            </p>
          </div>
          <LedgerStatusBadge status={security?.twoFactorEnabled ? "active" : "pending"} />
        </div>

        {!security?.twoFactorEnabled && !setupData && (
          <button
            onClick={handleSetup}
            disabled={submitting}
            className="px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90 disabled:opacity-50"
          >
            {submitting ? "Setting up…" : "Enable 2FA"}
          </button>
        )}

        {setupData && (
          <div className="space-y-4 mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700">
              1. Scan this QR code with your authenticator app
            </p>
            <div className="flex justify-center">
              <img
                src={setupData.qrCode}
                alt="2FA QR Code"
                className="w-48 h-48 border rounded-xl"
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              Can&apos;t scan?{" "}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(setupData.otpauthUrl);
                  toast.success("Copied!");
                }}
                className="text-[#003366] hover:underline inline-flex items-center gap-1"
              >
                Copy URL <Copy size={12} />
              </button>
            </p>
            <p className="text-sm font-medium text-gray-700">
              2. Enter the 6-digit code from your app
            </p>
            <form onSubmit={handleVerifyEnable} className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
              />
              <button
                type="submit"
                disabled={tokenInput.length !== 6 || submitting}
                className="px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                {submitting ? "Verifying…" : "Activate"}
              </button>
            </form>
          </div>
        )}

        {security?.twoFactorEnabled && !showDisable && (
          <button
            onClick={() => setShowDisable(true)}
            className="text-sm text-red-500 hover:underline mt-2"
          >
            Disable 2FA
          </button>
        )}

        {showDisable && (
          <form onSubmit={handleDisable} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Enter your current 2FA code to disable
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                type="submit"
                disabled={disableToken.length !== 6 || submitting}
                className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                Disable
              </button>
              <button
                type="button"
                onClick={() => setShowDisable(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {security?.twoFactorEnabled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800">Require 2FA for Withdrawals</h3>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, every withdrawal will require a valid 2FA code.
              </p>
            </div>
            <button
              onClick={handleToggleRequire}
              className={`relative w-11 h-6 rounded-full transition-colors ${security.requireTwoFactorForWithdrawals ? "bg-[#003366]" : "bg-gray-200"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${security.requireTwoFactorForWithdrawals ? "translate-x-5 left-0" : "left-0.5"}`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Withdraw Funds Modal — Step 1 ────────────────────────────────────────────

type WithdrawStep =
  | { type: "initiate" }
  | { type: "otp"; draftId: string; maskedEmail: string; resendCooldown?: number }
  | { type: "confirm"; summary: WithdrawalSummary }
  | { type: "success"; withdrawal: any };

function WithdrawalFlow({
  accounts,
  summary,
  onClose,
  onSuccess,
  onViewWithdrawals,
}: {
  accounts: BankAccount[];
  summary: WalletSummary | null;
  onClose: () => void;
  onSuccess: () => void;
  onViewWithdrawals: () => void;
}) {
  const [step, setStep] = useState<WithdrawStep>({ type: "initiate" });

  if (step.type === "initiate")
    return (
      <WithdrawFundsModal
        accounts={accounts}
        summary={summary}
        onClose={onClose}
        onNext={(draftId, maskedEmail, resendCooldown) =>
          setStep({ type: "otp", draftId, maskedEmail, resendCooldown })
        }
      />
    );

  if (step.type === "otp")
    return (
      <EmailOtpModal
        draftId={step.draftId}
        maskedEmail={step.maskedEmail}
        initialCooldown={step.resendCooldown || 60}
        onBack={() => setStep({ type: "initiate" })}
        onClose={onClose}
        onVerified={(s) => setStep({ type: "confirm", summary: s })}
      />
    );

  if (step.type === "confirm")
    return (
      <ConfirmWithdrawalModal
        summary={step.summary}
        onBack={() =>
          setStep({ type: "otp", draftId: step.summary.withdrawalDraftId, maskedEmail: "" })
        }
        onClose={onClose}
        onConfirmed={(w) => {
          setStep({ type: "success", withdrawal: w });
          onSuccess();
        }}
      />
    );

  if (step.type === "success")
    return (
      <WithdrawalSuccessModal
        withdrawal={step.withdrawal}
        onClose={onClose}
        onViewWithdrawals={onViewWithdrawals}
      />
    );

  return null;
}

// ─── Step 1: Withdraw Funds Modal ─────────────────────────────────────────────

function WithdrawFundsModal({
  accounts,
  summary,
  onClose,
  onNext,
}: {
  accounts: BankAccount[];
  summary: WalletSummary | null;
  onClose: () => void;
  onNext: (draftId: string, maskedEmail: string, resendCooldown?: number) => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const verifiedAccounts = accounts.filter((a) => a.isVerified && a.status === "active");
  const available = summary?.availableBalance || 0;
  const amountNum = parseFloat(amount) || 0;
  const platformCharge = 0;
  const youReceive = amountNum - platformCharge;

  useEffect(() => {
    const def = verifiedAccounts.find((a) => a.isDefault);
    if (def) setAccountId(def._id);
  }, []); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum < MIN_WITHDRAWAL)
      return toast.error(`Minimum withdrawal is ${NGN(MIN_WITHDRAWAL)}`);
    if (amountNum > available) return toast.error("Amount exceeds available balance");
    if (amountNum > DAILY_LIMIT) return toast.error(`Daily limit is ${NGN(DAILY_LIMIT)}`);
    setLoading(true);
    try {
      const res = await initiateWithdrawal({ bankAccountId: accountId, amount: amountNum, note });
      onNext(res.withdrawalDraftId, res.maskedEmail, Math.min(60, res.expiresIn || 60));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to initiate withdrawal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Withdraw Funds</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {verifiedAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={40} className="text-orange-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No verified payout accounts</p>
            <p className="text-sm text-gray-400 mt-1">Add and verify a bank account first</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Balance */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-[#003366]">{NGN(available)}</p>
            </div>

            {/* Bank Account selector */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Withdraw to
              </label>
              <div className="space-y-2">
                {verifiedAccounts.map((a) => (
                  <label
                    key={a._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      accountId === a._id
                        ? "border-[#003366] bg-[#003366]/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="account"
                      value={a._id}
                      checked={accountId === a._id}
                      onChange={() => setAccountId(a._id)}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {a.bankName} · {a.accountNumber}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{a.accountName}</p>
                    </div>
                    {a.isDefault && (
                      <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full shrink-0">
                        Default
                      </span>
                    )}
                    <CheckCircle
                      size={16}
                      className={
                        accountId === a._id ? "text-[#003366] shrink-0" : "text-gray-200 shrink-0"
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Amount to Withdraw
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                  ₦
                </span>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  max={available}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                  required
                />
              </div>
              {amountNum > 0 && (
                <p className="text-xs text-gray-400 mt-1 italic">{amountInWords(amountNum)}</p>
              )}
              {amountNum > available && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Exceeds available balance
                </p>
              )}
            </div>

            {/* Limits info */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-500">
                Minimum withdrawal:{" "}
                <span className="font-semibold text-gray-700">{NGN(MIN_WITHDRAWAL)}</span>
              </p>
              <p className="text-xs text-gray-500">
                Daily withdrawal limit:{" "}
                <span className="font-semibold text-gray-700">{NGN(DAILY_LIMIT)}</span>
              </p>
            </div>

            {/* Summary */}
            {amountNum > 0 && (
              <div className="bg-[#003366]/5 rounded-xl p-4 space-y-2 border border-[#003366]/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform charge</span>
                  <span className="font-medium">{NGN(platformCharge)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#003366] border-t border-[#003366]/10 pt-2 mt-1">
                  <span>You will receive</span>
                  <span>{NGN(youReceive)}</span>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Monthly operational expenses"
                maxLength={250}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 resize-none"
              />
            </div>

            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Shield size={11} /> A verification code will be sent to your email to confirm this
              withdrawal.
            </p>

            <button
              type="submit"
              disabled={loading || amountNum <= 0 || amountNum > available || !accountId}
              className="w-full py-3 bg-[#003366] text-white rounded-xl text-sm font-bold hover:bg-[#003366]/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Sending OTP…
                </>
              ) : (
                <>
                  Continue <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Email OTP Modal ──────────────────────────────────────────────────

function EmailOtpModal({
  draftId,
  maskedEmail,
  initialCooldown,
  onBack,
  onClose,
  onVerified,
}: {
  draftId: string;
  maskedEmail: string;
  initialCooldown?: number;
  onBack: () => void;
  onClose: () => void;
  onVerified: (summary: WithdrawalSummary) => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown || 0);

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await verifyWithdrawalOtp({ withdrawalDraftId: draftId, otp });
      onVerified(res.summary);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await resendWithdrawalOtp(draftId);
      toast.success("OTP resent to your email");
      setCooldown(60);
      setOtp("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Verify Withdrawal (Email OTP)</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail size={36} className="text-[#003366]" />
            </div>
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-gray-700 font-medium">We have sent a 6-digit OTP to</p>
            <p className="font-bold text-[#003366] text-lg mt-0.5">{maskedEmail}</p>
            <p className="text-sm text-gray-400 mt-1">
              Please enter the OTP below to confirm your withdrawal.
            </p>
          </div>

          {/* OTP inputs */}
          <div>
            <p className="text-sm text-gray-600 text-center mb-3">Enter 6-digit OTP</p>
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          </div>

          {/* Resend */}
          <div className="text-center text-sm text-gray-500">
            Didn&apos;t receive the email?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-[#003366] font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
            >
              {resending
                ? "Sending…"
                : cooldown > 0
                  ? `Resend OTP (${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(cooldown % 60).padStart(2, "0")})`
                  : "Resend OTP"}
            </button>
            <br />
            <span className="text-xs text-gray-400">Check your spam or junk folder.</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center justify-center gap-1"
            >
              <ArrowLeft size={15} /> Cancel
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="flex-1 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Verifying…
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Step 3: Confirm Withdrawal Modal ─────────────────────────────────────────

function ConfirmWithdrawalModal({
  summary,
  onBack,
  onClose,
  onConfirmed,
}: {
  summary: WithdrawalSummary;
  onBack: () => void;
  onClose: () => void;
  onConfirmed: (withdrawal: any) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      const res = await confirmWithdrawal({
        withdrawalDraftId: summary.withdrawalDraftId,
        confirmationAccepted: true,
      });
      onConfirmed(res.withdrawal);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  const row = (label: string, value: string, highlight?: boolean) => (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-[#003366]" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Confirm Withdrawal</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">Withdrawal Summary</p>
            <div className="bg-gray-50 rounded-xl p-4">
              {summary.bankAccount && (
                <>
                  {row(
                    "Withdraw to",
                    `${summary.bankAccount.bankName} · ${summary.bankAccount.accountNumber}`
                  )}
                  {row("Account Name", summary.bankAccount.accountName)}
                </>
              )}
              {row("Requested Amount", NGN(summary.amount))}
              {row("Platform Charge", NGN(summary.platformCharge))}
              {row("You Will Receive", NGN(summary.amountToReceive), true)}
              {row("Available Balance", NGN(summary.availableBalance))}
              {row("After Withdrawal Balance", NGN(summary.balanceAfterWithdrawal))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Please confirm that the details above are correct. This action requires email OTP
              verification and will be subject to review before processing.
            </p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]/30"
            />
            <span className="text-sm text-gray-600">
              I confirm that the information above is correct and I want to proceed with this
              withdrawal.
            </span>
          </label>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onBack}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center justify-center gap-1"
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!agreed || loading}
              className="flex-1 py-3 bg-[#003366] text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Submitting…
                </>
              ) : (
                "Confirm & Submit"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Success Modal ────────────────────────────────────────────────────

function WithdrawalSuccessModal({
  withdrawal,
  onClose,
  onViewWithdrawals,
}: {
  withdrawal: any;
  onClose: () => void;
  onViewWithdrawals: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">Withdrawal Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-5">
          Your withdrawal request of{" "}
          <span className="font-bold text-[#003366]">{NGN(withdrawal.amount)}</span> has been
          submitted successfully.
        </p>

        <WithdrawalStatusBadge status={withdrawal.status} />

        <p className="text-xs text-gray-400 mt-2 mb-6">
          We will send you an email once your withdrawal request has been reviewed.
        </p>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
          {[
            ["Withdrawal Reference", withdrawal.reference],
            ["Requested Date", fmtDateTime(withdrawal.requestedAt)],
            ["You Will Receive", NGN(withdrawal.amountToReceive)],
            ["Estimated Review Time", withdrawal.estimatedReviewTime],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-gray-500">{l}</span>
              <span className="font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onViewWithdrawals();
              onClose();
            }}
            className="flex-1 py-3 bg-[#003366] text-white rounded-xl text-sm font-bold hover:bg-[#003366]/90"
          >
            View Withdrawals
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Back to Finance
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Finance Page ────────────────────────────────────────────────────────

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [s, a] = await Promise.all([getWalletSummary(), getBankAccounts()]);
      setSummary(s.summary);
      setAccounts(a.accounts || []);
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Finance</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your school wallet, transactions and withdrawals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("Settings")}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <Shield size={16} /> Finance Settings
            </button>
            <button
              onClick={loadSummary}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw
                size={16}
                className={summaryLoading ? "animate-spin text-[#003366]" : "text-gray-500"}
              />
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
            >
              <ArrowUpCircle size={16} /> Withdraw Funds
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "Overview" && (
            <OverviewTab
              summary={summary}
              onWithdraw={() => setShowWithdraw(true)}
              onGoToTab={setActiveTab}
            />
          )}
          {activeTab === "Transactions" && <TransactionsTab />}
          {activeTab === "Withdrawals" && (
            <WithdrawalsTab onNewWithdrawal={() => setShowWithdraw(true)} />
          )}
          {activeTab === "Payout Accounts" && <PayoutAccountsTab />}
          {activeTab === "Settings" && <SecurityTab />}
        </div>

        {/* Withdrawal flow (multi-step) */}
        {showWithdraw && (
          <WithdrawalFlow
            accounts={accounts}
            summary={summary}
            onClose={() => setShowWithdraw(false)}
            onSuccess={loadSummary}
            onViewWithdrawals={() => setActiveTab("Withdrawals")}
          />
        )}
      </div>
    </div>
  );
}
