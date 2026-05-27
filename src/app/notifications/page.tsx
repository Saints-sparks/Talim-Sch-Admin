"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  BookOpen,
  CheckCheck,
  CreditCard,
  Download,
  ExternalLink,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Settings,
  Shield,
  User,
  Volume2,
  Zap,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/CustomToast";
import {
  AdminNotification,
  getIncomingNotifications,
  markNotificationAsRead,
} from "../services/notification.service";
import {
  getReceiptSettings,
  type ReceiptSettings,
} from "../services/fees.service";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "all" | "unread" | "system" | "talim";

// ─── Category config ─────────────────────────────────────────────────────────

const catConfig: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  fees:        { icon: <CreditCard className="h-4 w-4" />, bg: "bg-emerald-100", text: "text-emerald-700" },
  payments:    { icon: <CreditCard className="h-4 w-4" />, bg: "bg-emerald-100", text: "text-emerald-700" },
  academic:    { icon: <BookOpen className="h-4 w-4" />,   bg: "bg-blue-100",    text: "text-blue-700"    },
  academics:   { icon: <BookOpen className="h-4 w-4" />,   bg: "bg-blue-100",    text: "text-blue-700"    },
  grading:     { icon: <BookOpen className="h-4 w-4" />,   bg: "bg-indigo-100",  text: "text-indigo-700"  },
  resources:   { icon: <BookOpen className="h-4 w-4" />,   bg: "bg-cyan-100",    text: "text-cyan-700"    },
  messages:    { icon: <MessageCircle className="h-4 w-4" />, bg: "bg-purple-100", text: "text-purple-700" },
  account:     { icon: <User className="h-4 w-4" />,       bg: "bg-gray-100",    text: "text-gray-600"    },
  announcement:{ icon: <Volume2 className="h-4 w-4" />,    bg: "bg-amber-100",   text: "text-amber-700"   },
  other:       { icon: <Bell className="h-4 w-4" />,       bg: "bg-slate-100",   text: "text-slate-600"   },
};

const srcConfig: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
  talim:  { label: "Talim",  icon: <Shield className="h-3 w-3" />, pill: "bg-blue-100 text-blue-700"  },
  system: { label: "System", icon: <Zap    className="h-3 w-3" />, pill: "bg-gray-100 text-gray-600"  },
  school: { label: "School", icon: <Settings className="h-3 w-3"/>, pill: "bg-green-100 text-green-700"},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isPaymentNotification = (n: AdminNotification) => {
  const lower = `${n.title} ${n.message}`.toLowerCase();
  const cat = n.category as string;
  return (
    cat === "fees" ||
    cat === "payments" ||
    /payment|₦|\$|credited|wallet|fee paid|receipt/.test(lower)
  );
};

const parseAmount = (text: string): string | null => {
  const match = text.match(/[₦$£€][\d,]+(?:\.\d{2})?/);
  return match ? match[0] : null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>("all");
  const [selected, setSelected] = useState<AdminNotification | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);

  const userId = user?.userId || (user as any)?._id || "";

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [items, settings] = await Promise.all([
        getIncomingNotifications(userId),
        getReceiptSettings().catch(() => null),
      ]);
      setNotifications(items);
      if (settings) setReceiptSettings(settings);
      if (items.length && !selected) setSelected(items[0]);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (userId) load(); }, [load, userId]);

  const handleMarkRead = useCallback(async (n: AdminNotification) => {
    setReadIds((prev) => new Set([...prev, n.id]));
    await markNotificationAsRead(n.rawId, userId);
  }, [userId]);

  const handleMarkAllRead = useCallback(async () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    notifications.forEach((n) => markNotificationAsRead(n.rawId, userId).catch(() => {}));
    toast.success("All notifications marked as read");
  }, [notifications, userId]);

  const handleSelect = (n: AdminNotification) => {
    setSelected(n);
    if (!readIds.has(n.id)) handleMarkRead(n);
  };

  const isRead = (n: AdminNotification) => readIds.has(n.id);

  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const filtered = notifications.filter((n) => {
    if (tab === "unread") return !isRead(n);
    if (tab === "system") return n.source === "system";
    if (tab === "talim")  return n.source === "talim";
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "all",    label: "All"    },
    { key: "unread", label: "Unread" },
    { key: "system", label: "System" },
    { key: "talim",  label: "Talim"  },
  ];

  useEffect(() => {
    if (!selected) return;
    if (!readIds.has(selected.id)) {
      handleMarkRead(selected);
    }
  }, [selected, readIds, handleMarkRead]);

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-slate-900 p-4 sm:p-6 flex flex-col gap-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[19px] font-semibold text-[#030E18] dark:text-slate-100">Notifications</h1>
          <span className="bg-white dark:bg-slate-800 border border-[#E4E4E4] dark:border-slate-700 text-[15px] text-[#030E18] dark:text-slate-100 font-medium px-3 py-1 rounded-full">
            {notifications.length}
          </span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#E0E0E0] dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-[#154473] text-white font-medium rounded-lg px-4 py-2 hover:bg-[#123a5e] transition text-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E4E4E4] dark:border-slate-700 px-4 py-3 flex items-center gap-2 flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition",
              tab === key
                ? "bg-[#154473] text-white"
                : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            )}
          >
            {label}
            {key === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main panel ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#154473]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
          <p className="font-semibold text-red-600">{error}</p>
          <button
            onClick={load}
            className="bg-[#154473] text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-[#123a5e] transition"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center min-h-[300px] bg-white dark:bg-slate-800 rounded-2xl border border-[#E4E4E4] dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="h-8 w-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-slate-100">
            {tab === "unread" ? "You're all caught up!" : "No notifications"}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-300 max-w-xs">
            {tab === "unread"
              ? "No unread notifications right now."
              : "Alerts from Talim and system events will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* List */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-[#E4E4E4] dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wide">
              {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map((n) => {
                const cat = catConfig[n.category] ?? catConfig.other;
                const isSelected = selected?.id === n.id;
                const unread = !isRead(n);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleSelect(n)}
                    className={cn(
                      "w-full text-left flex gap-3 px-4 py-3.5 border-b border-gray-50 transition hover:bg-[#F4F8FF]",
                      "dark:border-slate-700 dark:hover:bg-slate-700/60",
                      isSelected && "bg-[#EBF2FF] border-l-2 border-l-[#154473] dark:bg-slate-700/70",
                      unread && !isSelected && "bg-[#FAFCFF] dark:bg-slate-800/70"
                    )}
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5", cat.bg, cat.text)}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug truncate", unread ? "font-semibold text-[#030E18] dark:text-slate-100" : "font-medium text-gray-700 dark:text-slate-200")}>
                          {n.title}
                        </p>
                        {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#154473]" />}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5 line-clamp-1">{n.message}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="hidden lg:flex flex-1 min-w-0">
            {selected ? (
              <DetailPanel
                notification={selected}
                isRead={isRead(selected)}
                onMarkRead={() => handleMarkRead(selected)}
                onOpenReceipt={() => setReceiptOpen(true)}
                receiptSettings={receiptSettings}
                schoolLogo={user?.schoolLogo || (user as any)?.schoolId?.logo || ""}
              />
            ) : (
              <div className="flex-1 bg-white rounded-2xl border border-[#E4E4E4] flex items-center justify-center text-gray-400 text-sm">
                Select a notification to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receiptOpen && selected && (
        <ReceiptModal
          notification={selected}
          schoolName={user?.schoolName || "School"}
          schoolLogo={user?.schoolLogo || (user as any)?.schoolId?.logo || ""}
          receiptSettings={receiptSettings}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  notification: n,
  isRead,
  onMarkRead,
  onOpenReceipt,
  receiptSettings,
  schoolLogo,
}: {
  notification: AdminNotification;
  isRead: boolean;
  onMarkRead: () => void;
  onOpenReceipt: () => void;
  receiptSettings: ReceiptSettings | null;
  schoolLogo: string;
}) {
  const cat = catConfig[n.category] ?? catConfig.other;
  const src = srcConfig[n.source] ?? srcConfig.system;
  const isPayment = isPaymentNotification(n);
  const hasAttachments = n.attachments.length > 0;

  return (
    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-[#E4E4E4] dark:border-slate-700 flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", cat.bg, cat.text)}>
            {cat.icon}
          </div>
          <div>
            <p className="font-semibold text-[#030E18] dark:text-slate-100 text-base leading-snug">{n.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", src.pill)}>
                {src.icon}{src.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-300">
                {format(new Date(n.createdAt), "dd MMM yyyy, h:mm a")}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isRead ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700")}>
                {isRead ? <><CheckCircle className="h-3 w-3" /> Read</> : <><Clock className="h-3 w-3" /> Unread</>}
              </span>
            </div>
          </div>
        </div>
        {!isRead && (
          <button
            onClick={onMarkRead}
            className="shrink-0 text-xs font-medium text-[#154473] hover:underline"
          >
            Mark as read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Message */}
        <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">{n.message}</p>

        {/* Payment receipt card */}
        {isPayment && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Payment Receipt</p>
                <p className="text-xs text-emerald-700">
                  {parseAmount(n.message) ?? "View amount in receipt"}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenReceipt}
              className="flex items-center gap-2 bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-emerald-800 transition"
            >
              <CreditCard className="h-3.5 w-3.5" />
              View Receipt
            </button>
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachments</p>
            <div className="space-y-2">
              {n.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:bg-white transition"
                >
                  <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate flex-1">{url.split("/").pop() || "Attachment"}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
          <MetaPill label="Source" value={n.sourceLabel} />
          <MetaPill label="Category" value={n.category.replace(/_/g, " ")} />
          <MetaPill label="Priority" value={n.priority} />
          <MetaPill label="Status" value={n.status} />
          <MetaPill label="Sent by" value={n.sentBy} />
          <MetaPill label="Ref" value={n.rawId.slice(-8).toUpperCase()} />
        </div>
        {(receiptSettings?.signatureUrl || (receiptSettings?.showSchoolLogo && schoolLogo)) && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wide mb-2">
              Receipt Metadata
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-300">
              Receipt preview uses your configured school branding and signature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-[#FAFAFA] dark:bg-slate-700/60 px-3 py-2.5">
      <p className="text-[11px] text-gray-500 dark:text-slate-300 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-[#030E18] dark:text-slate-100 mt-0.5 capitalize truncate">{value}</p>
    </div>
  );
}

// ─── Receipt Modal ────────────────────────────────────────────────────────────

function ReceiptModal({
  notification: n,
  schoolName,
  schoolLogo,
  receiptSettings,
  onClose,
}: {
  notification: AdminNotification;
  schoolName: string;
  schoolLogo: string;
  receiptSettings: ReceiptSettings | null;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const amount = parseAmount(n.message);
  const refNo = n.rawId.slice(-10).toUpperCase();
  const dateStr = format(new Date(n.createdAt), "dd MMM yyyy, h:mm a");
  const hasAttachments = n.attachments.length > 0;
  const showSchoolLogo = receiptSettings?.showSchoolLogo ?? true;
  const signatureUrl = receiptSettings?.signatureUrl || "";
  const signatureName = receiptSettings?.signatureName || "";
  const signatureTitle = receiptSettings?.signatureTitle || "";

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Payment Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #154473; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 22px; font-weight: 700; color: #154473; }
        .logo-img { max-height: 44px; max-width: 140px; object-fit: contain; margin: 0 auto 8px auto; display:block; }
        .school { font-size: 14px; color: #555; }
        .amount { font-size: 36px; font-weight: 700; color: #154473; text-align: center; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
        .label { color: #666; }
        .value { font-weight: 600; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #888; }
        .status { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .signature { margin-top: 28px; text-align: right; }
        .signature img { max-height: 50px; object-fit: contain; margin-bottom: 6px; }
        .signature-name { font-size: 12px; font-weight: 700; color: #0f172a; }
        .signature-title { font-size: 11px; color: #64748b; }
      </style></head><body>
      <div class="header">
        ${showSchoolLogo && schoolLogo ? `<img class="logo-img" src="${schoolLogo}" alt="School logo" />` : ""}
        <div class="logo">Talim School Manager</div>
        <div class="school">${schoolName}</div>
      </div>
      <h2 style="text-align:center;font-size:16px;color:#333">${n.title}</h2>
      ${amount ? `<div class="amount">${amount}</div>` : ""}
      <div class="row"><span class="label">Reference No.</span><span class="value">${refNo}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
      <div class="row"><span class="label">Source</span><span class="value">${n.sourceLabel}</span></div>
      <div class="row"><span class="label">Description</span><span class="value">${n.message}</span></div>
      <div class="row"><span class="label">Status</span><span class="value"><span class="status">Completed</span></span></div>
      ${
        signatureUrl
          ? `<div class="signature">
              <img src="${signatureUrl}" alt="Authorized signature" />
              ${signatureName ? `<div class="signature-name">${signatureName}</div>` : ""}
              ${signatureTitle ? `<div class="signature-title">${signatureTitle}</div>` : ""}
             </div>`
          : ""
      }
      <div class="footer">This is an auto-generated receipt from Talim School Manager.</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt top stripe */}
        <div className="bg-[#154473] px-6 py-5 text-white text-center">
          {showSchoolLogo && schoolLogo && (
            <img
              src={schoolLogo}
              alt={`${schoolName} logo`}
              className="mx-auto mb-2 h-10 max-w-[120px] object-contain"
            />
          )}
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
            {schoolName}
          </p>
          <p className="font-semibold text-lg">{n.title}</p>
          {amount && (
            <p className="text-3xl font-bold mt-2 tracking-tight">{amount}</p>
          )}
        </div>

        {/* Serrated edge effect */}
        <div
          className="h-4 bg-[#F8F8F8]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, #fff 70%, transparent 70%), radial-gradient(circle at 50% 100%, #F8F8F8 70%, transparent 70%)",
            backgroundSize: "24px 16px",
            backgroundRepeat: "repeat-x",
          }}
        />

        {/* Receipt body */}
        <div ref={receiptRef} className="px-6 pb-4 space-y-0">
          <ReceiptRow label="Reference No." value={refNo} />
          <ReceiptRow label="Date & Time"   value={dateStr} />
          <ReceiptRow label="Source"        value={n.sourceLabel} />
          <ReceiptRow label="Category"      value={n.category.replace(/_/g, " ")} />
          <ReceiptRow label="Description"   value={n.message} wrap />
          <ReceiptRow
            label="Status"
            value={
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" /> Completed
              </span>
            }
          />

          {/* Attachment receipts from backend */}
          {hasAttachments && (
            <div className="pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Attachments</p>
              {n.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                >
                  <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="truncate flex-1">{url.split("/").pop() || "Receipt"}</span>
                  <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                </a>
              ))}
            </div>
          )}

          {signatureUrl && (
            <div className="pt-4 text-right">
              <img
                src={signatureUrl}
                alt="Authorized signature"
                className="h-10 ml-auto object-contain"
              />
              {signatureName && (
                <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 mt-1">
                  {signatureName}
                </p>
              )}
              {signatureTitle && (
                <p className="text-[11px] text-gray-500 dark:text-slate-300">
                  {signatureTitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer serration */}
        <div
          className="h-4 bg-[#F8F8F8]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 100%, #fff 70%, transparent 70%)",
            backgroundSize: "24px 16px",
            backgroundRepeat: "repeat-x",
          }}
        />

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-[#154473] text-white font-medium rounded-lg py-2.5 text-sm hover:bg-[#123a5e] transition"
          >
            <Download className="h-4 w-4" />
            Print / Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 font-medium rounded-lg py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  wrap,
}: {
  label: string;
  value: React.ReactNode;
  wrap?: boolean;
}) {
  return (
    <div className={cn("flex gap-4 py-2.5 border-b border-dashed border-gray-100 dark:border-slate-700 last:border-0", wrap ? "flex-col" : "justify-between items-start")}>
      <span className="text-xs text-gray-500 dark:text-slate-300 font-medium shrink-0">{label}</span>
      <span className={cn("text-sm font-semibold text-[#030E18] dark:text-slate-100", wrap ? "" : "text-right max-w-[55%]")}>
        {value}
      </span>
    </div>
  );
}
