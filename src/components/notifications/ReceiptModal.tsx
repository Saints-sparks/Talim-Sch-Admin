"use client";

/**
 * A printable receipt for a payment notification, branded with the school's
 * own logo and signature from the receipt settings.
 *
 * The print view is built as a standalone document rather than printing the
 * page, so the receipt comes out on its own sheet. Everything interpolated
 * into it is escaped — a notification's text comes from the API, and a stray
 * angle bracket must not become markup.
 */
import React, { useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle, Download, ExternalLink, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { ReceiptSettings } from "@/app/services/fees.service";
import type { AdminNotification } from "@/app/services/notification.service";
import { parseAmount } from "./notification.presentation";

/** Escapes text for interpolation into the print document. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ReceiptModalProps {
  notification: AdminNotification;
  schoolName: string;
  schoolLogo: string;
  receiptSettings: ReceiptSettings | null;
  onClose: () => void;
}

/**
 * Renders the receipt dialog.
 *
 * @param props - The notification, the school's branding and the close handler.
 */
export function ReceiptModal({
  notification,
  schoolName,
  schoolLogo,
  receiptSettings,
  onClose,
}: ReceiptModalProps) {
  const amount = parseAmount(notification.message);
  const reference = notification.id.slice(-10).toUpperCase();
  const issuedAt = format(new Date(notification.createdAt), "dd MMM yyyy, h:mm a");
  const showSchoolLogo = receiptSettings?.showSchoolLogo ?? true;
  const signatureUrl = receiptSettings?.signatureUrl || "";
  const signatureName = receiptSettings?.signatureName || "";
  const signatureTitle = receiptSettings?.signatureTitle || "";

  useBodyScrollLock(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
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
        ${showSchoolLogo && schoolLogo ? `<img class="logo-img" src="${escapeHtml(schoolLogo)}" alt="School logo" />` : ""}
        <div class="logo">Talim School Manager</div>
        <div class="school">${escapeHtml(schoolName)}</div>
      </div>
      <h2 style="text-align:center;font-size:16px;color:#333">${escapeHtml(notification.title)}</h2>
      ${amount ? `<div class="amount">${escapeHtml(amount)}</div>` : ""}
      <div class="row"><span class="label">Reference No.</span><span class="value">${escapeHtml(reference)}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(issuedAt)}</span></div>
      <div class="row"><span class="label">Source</span><span class="value">${escapeHtml(notification.sourceLabel)}</span></div>
      <div class="row"><span class="label">Description</span><span class="value">${escapeHtml(notification.message)}</span></div>
      <div class="row"><span class="label">Status</span><span class="value"><span class="status">Completed</span></span></div>
      ${
        signatureUrl
          ? `<div class="signature">
              <img src="${escapeHtml(signatureUrl)}" alt="Authorized signature" />
              ${signatureName ? `<div class="signature-name">${escapeHtml(signatureName)}</div>` : ""}
              ${signatureTitle ? `<div class="signature-title">${escapeHtml(signatureTitle)}</div>` : ""}
             </div>`
          : ""
      }
      <div class="footer">This is an auto-generated receipt from Talim School Manager.</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Payment receipt"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[#154473] px-6 py-5 text-center text-white">
          {showSchoolLogo && schoolLogo && (
            /* Plain <img>: school logos come from arbitrary upload hosts and next/image has no remotePatterns configured. */
            <img
              src={schoolLogo}
              alt={`${schoolName} logo`}
              className="mx-auto mb-2 h-10 max-w-[120px] object-contain"
            />
          )}
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-70">{schoolName}</p>
          <p className="text-lg font-semibold">{notification.title}</p>
          {amount && <p className="mt-2 text-3xl font-bold tracking-tight">{amount}</p>}
        </div>

        <div
          className="h-4 bg-[#F8F8F8] dark:bg-slate-900"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, currentColor 70%, transparent 70%)",
            backgroundSize: "24px 16px",
            backgroundRepeat: "repeat-x",
          }}
        />

        <div className="space-y-0 px-6 pb-4">
          <ReceiptRow label="Reference No." value={reference} />
          <ReceiptRow label="Date & Time" value={issuedAt} />
          <ReceiptRow label="Source" value={notification.sourceLabel} />
          <ReceiptRow label="Category" value={notification.category.replace(/_/g, " ")} />
          <ReceiptRow label="Description" value={notification.message} wrap />
          <ReceiptRow
            label="Status"
            value={
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle className="h-3 w-3" /> Completed
              </span>
            }
          />

          {notification.attachments.length > 0 && (
            <div className="space-y-2 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Attachments</p>
              {notification.attachments.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">{url.split("/").pop() || "Receipt"}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" />
                </a>
              ))}
            </div>
          )}

          {signatureUrl && (
            <div className="pt-4 text-right">
              {/* Plain <img>: signatures come from arbitrary upload hosts and next/image has no remotePatterns configured. */}
              <img
                src={signatureUrl}
                alt="Authorized signature"
                className="ml-auto h-10 object-contain"
              />
              {signatureName && (
                <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-slate-100">
                  {signatureName}
                </p>
              )}
              {signatureTitle && (
                <p className="text-[11px] text-gray-500 dark:text-slate-300">{signatureTitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#154473] py-2.5 text-sm font-medium text-white transition hover:bg-[#123a5e]"
          >
            <Download className="h-4 w-4" />
            Print / Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** One line of the receipt. */
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
    <div
      className={cn(
        "flex gap-4 border-b border-dashed border-gray-100 py-2.5 last:border-0 dark:border-slate-700",
        wrap ? "flex-col" : "items-start justify-between"
      )}
    >
      <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-slate-300">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold text-[#030E18] dark:text-slate-100",
          wrap ? "break-words" : "max-w-[55%] text-right"
        )}
      >
        {value}
      </span>
    </div>
  );
}
