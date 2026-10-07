"use client";

/**
 * The last few payments and announcements.
 *
 * Each panel is its own component so a viewer who governs fees but not
 * announcements sees one panel at full width instead of an empty half.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RecentAnnouncement, RecentPayment } from "@/app/services/dashboard.service";
import { Avatar, CardHeader, Pill, card, textLink, type Tone } from "@/components/tl";
import { formatNairaFull } from "./format";
import { IconTitle, PanelEmptyState, PanelLoading, PanelSkeleton, panelGrid } from "./primitives";

/** Props for {@link RecentActivity}. */
interface RecentActivityProps {
  /** The last few payments. */
  payments: RecentPayment[];
  /** The last few announcements. */
  announcements: RecentAnnouncement[];
  /** True while both load. */
  isLoading: boolean;
  /** Whether the viewer may see payments. */
  showPayments: boolean;
  /** Whether the viewer may see announcements. */
  showAnnouncements: boolean;
}

/**
 * The pill tone for a payment's status.
 *
 * @param status - The payment's status.
 * @returns Success, warning or danger.
 */
function statusTone(status: RecentPayment["status"]): Tone {
  if (status === "success") return "success";
  if (status === "pending") return "warning";
  return "danger";
}

/**
 * Renders a timestamp the API may have left empty.
 *
 * @param value - An ISO date, possibly empty.
 * @returns "3 hours ago", or "recently".
 */
function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * "Recent Payments" and "Recent Announcements", each a card of rows shown
 * only to a viewer who governs it; nothing at all when neither is.
 *
 * @param props - See {@link RecentActivityProps}.
 * @param props.payments - The payments.
 * @param props.announcements - The announcements.
 * @param props.isLoading - Whether they are loading.
 * @param props.showPayments - Whether to show payments.
 * @param props.showAnnouncements - Whether to show announcements.
 * @returns The cards, their skeletons, or null.
 */
export function RecentActivity({
  payments,
  announcements,
  isLoading,
  showPayments,
  showAnnouncements,
}: RecentActivityProps) {
  if (!showPayments && !showAnnouncements) return null;

  if (isLoading) {
    return (
      <PanelLoading label="Loading recent activity" className={panelGrid}>
        {showPayments && <PanelSkeleton minH={260} />}
        {showAnnouncements && <PanelSkeleton minH={260} />}
      </PanelLoading>
    );
  }

  return (
    <div className={panelGrid}>
      {showPayments && (
        <section className={card}>
          <CardHeader
            title={<IconTitle icon={<CreditCard />}>Recent Payments</IconTitle>}
            actions={
              <Link href="/fees-management" className={textLink}>
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          {payments.length > 0 ? (
            <ul className="mt-2">
              {payments.map((p, i) => (
                <li
                  key={`${p.studentName}-${p.createdAt}-${i}`}
                  className="flex items-center gap-3 border-t border-tl-line-soft py-3"
                >
                  <Avatar id={p.studentName} name={p.studentName} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-tl-ink">{p.studentName}</div>
                    <div className="mt-0.5 text-[13px] text-tl-muted">
                      {p.method} · {relativeTime(p.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="text-sm font-extrabold text-tl-ink tabular-nums">
                      {formatNairaFull(p.amount)}
                    </div>
                    <Pill tone={statusTone(p.status)}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Pill>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmptyState message="No recent payments to display" />
          )}
        </section>
      )}

      {showAnnouncements && (
        <section className={card}>
          <CardHeader
            title={<IconTitle icon={<Megaphone />}>Recent Announcements</IconTitle>}
            actions={
              <Link href="/announcements" className={textLink}>
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          {announcements.length > 0 ? (
            <ul className="mt-2">
              {announcements.map((a, i) => (
                <li
                  key={`${a.title}-${a.publishedAt}-${i}`}
                  className="flex items-start gap-3 border-t border-tl-line-soft py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-tl-ink">{a.title}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Pill tone="info">{a.audience}</Pill>
                      <span className="text-[13px] text-tl-muted">
                        {relativeTime(a.publishedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-extrabold text-tl-ink tabular-nums">
                      {a.readRate}%
                    </div>
                    <div className="text-xs text-tl-muted">read rate</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmptyState message="No recent announcements" />
          )}
        </section>
      )}
    </div>
  );
}
