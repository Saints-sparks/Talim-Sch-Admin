"use client";

/**
 * The reading panel beside the inbox: the whole message, its attachments, and
 * a receipt shortcut when the notification is about money.
 */
import React from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, CreditCard, ExternalLink, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNotification } from "@/app/services/notification.service";
import {
  CATEGORY_BADGES,
  SOURCE_BADGES,
  isPaymentNotification,
  parseAmount,
} from "./notification.presentation";

interface NotificationDetailProps {
  notification: AdminNotification;
  onMarkRead: () => void;
  /** Opens the printable receipt. Omit on screens that have no receipt modal. */
  onOpenReceipt?: () => void;
  /** True while this notification's mark-as-read request is in flight. */
  isMarkingRead: boolean;
}

/**
 * Renders the notification reading panel.
 *
 * @param props - The selected notification and its actions.
 */
export function NotificationDetail({
  notification,
  onMarkRead,
  onOpenReceipt,
  isMarkingRead,
}: NotificationDetailProps) {
  const badge = CATEGORY_BADGES[notification.category];
  const source = SOURCE_BADGES[notification.source];
  const showReceipt = Boolean(onOpenReceipt) && isPaymentNotification(notification);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4E4E4] bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              badge.bg,
              badge.text
            )}
          >
            {badge.icon}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold leading-snug text-[#030E18] dark:text-slate-100">
              {notification.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  source.pill
                )}
              >
                {source.icon}
                {source.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-300">
                {format(new Date(notification.createdAt), "dd MMM yyyy, h:mm a")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  notification.isRead
                    ? "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                )}
              >
                {notification.isRead ? (
                  <>
                    <CheckCircle className="h-3 w-3" /> Read
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" /> Unread
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        {!notification.isRead && (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={isMarkingRead}
            className="shrink-0 text-xs font-medium text-[#154473] hover:underline disabled:opacity-60 dark:text-blue-400"
          >
            {isMarkingRead ? "Marking..." : "Mark as read"}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-slate-200">
          {notification.message}
        </p>

        {showReceipt && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <CreditCard className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Payment Receipt
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {parseAmount(notification.message) ?? "View amount in receipt"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenReceipt}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
            >
              <CreditCard className="h-3.5 w-3.5" />
              View Receipt
            </button>
          </div>
        )}

        {notification.attachments.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Attachments
            </p>
            <div className="space-y-2">
              {notification.attachments.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">{url.split("/").pop() || "Attachment"}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2 dark:border-slate-700">
          <MetaPill label="Source" value={notification.sourceLabel} />
          <MetaPill label="Category" value={notification.category.replace(/_/g, " ")} />
          <MetaPill label="Priority" value={notification.priority} />
          <MetaPill label="Status" value={notification.status} />
          <MetaPill label="Sent by" value={notification.sentBy} />
          <MetaPill label="Ref" value={notification.id.slice(-8).toUpperCase()} />
        </div>
      </div>
    </div>
  );
}

/** One label/value tile in the meta grid. */
function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-2.5 dark:border-slate-700 dark:bg-slate-700/60">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold capitalize text-[#030E18] dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
