"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, ExternalLink, FileText, Loader2, Receipt, UserCog, Users } from "lucide-react";
import { useDataExport } from "@/hooks/settings/useDataExport";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import type { ExportType } from "@/app/services/school-settings.service";
import { Card, CardHeader, SectionHeader } from "@/components/settings/ui";

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
  { label: "Version", value: "2.0.0" },
  { label: "Support", value: "support@mytalim.com" },
];

/**
 * Settings → Data & System: CSV exports, where the school's backups stand and
 * what this build is.
 *
 * Only the exports and reports the role may run are shown. The backup card
 * used to print a "last backup" 24 hours ago and a "next backup" six days out,
 * both computed in the browser from the current time — invented numbers — so
 * it now states the policy without pretending to know the schedule.
 */
export function DataSystemSection() {
  const router = useRouter();
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
                  <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <c.icon className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => activate(c)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs text-[#003366] dark:text-blue-400 font-medium hover:underline disabled:opacity-50"
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
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                Backups are managed by Talim
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
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
              className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0"
            >
              <span className="text-gray-500 dark:text-slate-400">{s.label}</span>
              <span className="text-gray-800 dark:text-slate-200 font-medium truncate">
                {s.label === "Support" ? (
                  <a href={`mailto:${s.value}`} className="text-[#003366] dark:text-blue-400 hover:underline">
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
    </div>
  );
}
