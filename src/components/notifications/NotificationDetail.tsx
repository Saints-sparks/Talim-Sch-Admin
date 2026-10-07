"use client";

/**
 * The reading panel beside the inbox: the whole message, its attachments, and
 * a receipt shortcut when the notification is about money.
 */
import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import { CheckCircle, Clock, CreditCard, ExternalLink, LifeBuoy, Paperclip } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { primaryButton } from "@/components/tl/styles";
import { ticketHref } from "@/components/support/ticket.presentation";
import { cn } from "@/lib/utils";
import type { AdminNotification } from "@/app/services/notification.service";
import {
  CATEGORY_BADGES,
  CATEGORY_LABELS,
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
 * Renders the notification reading panel; a support notification (v1.5 §1)
 * gets "Open ticket".
 *
 * @param props - The selected notification and its actions.
 * @param props.notification - The notification.
 * @param props.onMarkRead - Marks it read.
 * @param props.onOpenReceipt - Opens the payment receipt, when there is one.
 * @param props.isMarkingRead - Whether marking it read is in flight.
 * @returns The panel.
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
  const { hasPermission } = usePermissions();
  // A support notification opens on the desk for desk staff; the screens send
  // an admin's own ticket on to Help & support (and the reverse) themselves.
  const canStaffDesk = hasPermission(Permission.MANAGE_SUPPORT);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-tl-line bg-tl-surface">
      <div className="flex items-start justify-between gap-4 border-b border-tl-line-soft px-6 py-4">
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
            <p className="text-base font-semibold leading-snug text-tl-ink">{notification.title}</p>
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
              <span className="text-xs text-tl-muted">
                {format(new Date(notification.createdAt), "dd MMM yyyy, h:mm a")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  notification.isRead ? "bg-tl-track text-tl-muted" : "bg-tl-select text-tl-link"
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
            className="shrink-0 text-xs font-medium text-tl-brand hover:underline disabled:opacity-60"
          >
            {isMarkingRead ? "Marking..." : "Mark as read"}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-tl-body">
          {notification.message}
        </p>

        {notification.supportTicketId ? (
          <Link
            href={ticketHref(notification.supportTicketId, canStaffDesk ? "desk" : "requester")}
            className={primaryButton}
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Open ticket
          </Link>
        ) : null}

        {showReceipt && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-tl-success/30 bg-tl-success-bg p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tl-success-bg">
                <CreditCard className="h-5 w-5 text-tl-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-tl-success">Payment Receipt</p>
                <p className="text-xs text-tl-success">
                  {parseAmount(notification.message) ?? "View amount in receipt"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenReceipt}
              className="flex items-center gap-2 rounded-lg bg-tl-success px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <CreditCard className="h-3.5 w-3.5" />
              View Receipt
            </button>
          </div>
        )}

        {notification.attachments.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tl-muted">
              Attachments
            </p>
            <div className="space-y-2">
              {notification.attachments.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-tl-line bg-tl-subtle px-4 py-3 text-sm text-tl-body transition hover:bg-white"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-tl-faint" />
                  <span className="flex-1 truncate">{url.split("/").pop() || "Attachment"}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-tl-faint" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-tl-line-soft pt-2">
          <MetaPill label="Source" value={notification.sourceLabel} />
          <MetaPill
            label="Category"
            value={CATEGORY_LABELS[notification.category] ?? notification.category}
          />
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
    <div className="rounded-xl border border-tl-line bg-tl-subtle px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-tl-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold capitalize text-tl-ink">{value}</p>
    </div>
  );
}
