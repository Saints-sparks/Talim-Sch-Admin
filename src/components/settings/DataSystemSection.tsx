"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ghostButton } from "@/components/tl/styles";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  LifeBuoy,
  MessageSquare,
  Loader2,
  Receipt,
  UserCog,
  Users,
} from "lucide-react";
import { useDataExport } from "@/hooks/settings/useDataExport";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import type { ExportType } from "@/app/services/school-settings.service";
import { Card, CardHeader, OutlineBtn, SectionHeader } from "@/components/settings/ui";
import { ReportProblemModal } from "@/components/settings/support/ReportProblemModal";
import { APP_VERSION } from "@/components/settings/support/supportTicketForm";

/** A CSV export, or a link into the module that produces the report. */
interface DataCard {
  title: string;
  desc: string;
  icon: React.ElementType;
  /** Set for a CSV export. */
  exportType?: ExportType;
  /** Set for a link to another module. */
  href?: string;
  /** Permission required to see the card. */
  permission: string;
}

const CARDS: DataCard[] = [
  {
    title: "Export Students",
    desc: "Download all student records in CSV format",
    icon: Users,
    exportType: "students",
    permission: Permission.MANAGE_SETTINGS,
  },
  {
    title: "Export Staff",
    desc: "Download all staff and teacher records in CSV format",
    icon: UserCog,
    exportType: "staff",
    permission: Permission.MANAGE_SETTINGS,
  },
  {
    title: "Academic Reports",
    desc: "Download term-based academic performance reports",
    icon: FileText,
    href: "/assessments",
    permission: Permission.MANAGE_ASSESSMENTS,
  },
  {
    title: "Finance Statement",
    desc: "Download detailed income and withdrawal statements",
    icon: Receipt,
    href: "/finance",
    permission: Permission.MANAGE_FINANCE,
  },
];

const SYSTEM_INFO = [
  { label: "Platform", value: "Talim School Administration" },
  { label: "Version", value: APP_VERSION },
  { label: "Support", value: "support@mytalim.com" },
];

/**
 * Settings → Data & System: CSV exports, where the school's backups stand,
 * what this build is, "Report a problem" to Talim support (Round 4 §35), and
 * "Contact Talim support", the admin's own tickets in Help & support (v1.5 §1).
 *
 * Only the exports and reports the role may run are shown. The backup card
 * used to print a "last backup" 24 hours ago and a "next backup" six days out,
 * both computed in the browser from the current time — invented numbers — so
 * it now states the policy without pretending to know the schedule.
 *
 * @returns The section.
 */
export function DataSystemSection() {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);
  const { hasPermission } = usePermissions();
  const { exporting, run } = useDataExport();
  const cards = CARDS.filter((c) => hasPermission(c.permission));

  const activate = (card: DataCard) => {
    if (card.exportType) void run(card.exportType, card.title.replace("Export ", ""));
    else if (card.href) router.push(card.href);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Data & System" desc="Backups, exports and system information" />

      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c) => {
            const busy = Boolean(c.exportType && exporting === c.exportType);
            return (
              <Card key={c.title} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-tl-select flex items-center justify-center shrink-0">
                    <c.icon className="w-4 h-4 text-tl-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-tl-ink">{c.title}</p>
                    <p className="text-xs text-tl-muted mt-0.5">{c.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => activate(c)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs text-tl-brand font-medium hover:underline disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Exporting…
                    </>
                  ) : c.exportType ? (
                    <>
                      <Download className="w-3 h-3" /> Download CSV
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3 h-3" /> Open
                    </>
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader title="Backups" />
        <div className="p-5">
          <div className="flex items-center gap-3 p-3 bg-tl-success-bg rounded-lg border border-tl-success/30">
            <CheckCircle2 className="w-5 h-5 text-tl-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-tl-success">Backups are managed by Talim</p>
              <p className="text-xs text-tl-success">
                Your school&apos;s data is backed up weekly. To request a restore, contact{" "}
                <a href="mailto:support@mytalim.com" className="underline font-medium">
                  support@mytalim.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="System Information" />
        <div className="p-5 space-y-2 text-sm">
          {SYSTEM_INFO.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between gap-3 py-2 border-b border-tl-line-soft last:border-0"
            >
              <span className="text-tl-muted">{s.label}</span>
              <span className="text-tl-ink font-medium truncate">
                {s.label === "Support" ? (
                  <a href={`mailto:${s.value}`} className="text-tl-brand hover:underline">
                    {s.value}
                  </a>
                ) : (
                  s.value
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Help" />
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-tl-ink">Something not working?</p>
            <p className="text-xs text-tl-muted mt-0.5">
              Tell the Talim support team. You&apos;ll get a reference to quote, and can follow your
              tickets in Help &amp; support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/help" className={ghostButton}>
              <MessageSquare className="h-4 w-4" aria-hidden /> Contact Talim support
            </Link>
            <OutlineBtn onClick={() => setReporting(true)}>
              <LifeBuoy className="w-3.5 h-3.5" aria-hidden /> Report a problem
            </OutlineBtn>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {reporting && <ReportProblemModal onClose={() => setReporting(false)} />}
      </AnimatePresence>
    </div>
  );
}
