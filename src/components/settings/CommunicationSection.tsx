"use client";

import React from "react";
import { Bell, ChevronRight, Info, MessageSquare, Users } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import type { SectionId } from "@/components/settings/sections";
import { Card, Notice, SectionHeader } from "@/components/settings/ui";

/**
 * Where each card goes: a settings tab (`section`) or another module (`href`).
 */
const CARDS: Array<{
  title: string;
  desc: string;
  icon: React.ElementType;
  section?: SectionId;
  href?: string;
  permission?: string;
}> = [
  {
    title: "Email Notifications",
    desc: "Configure automated email notifications sent to parents and staff",
    icon: Bell,
    section: "notifications",
  },
  {
    title: "SMS Alerts",
    desc: "Manage SMS alerts for fee payments, results and attendance",
    icon: MessageSquare,
    section: "notifications",
  },
  {
    title: "Parent Messages",
    desc: "Configure parent-teacher messaging preferences",
    icon: Users,
    href: "/messages",
    permission: Permission.MANAGE_MESSAGES,
  },
];

/**
 * Settings → Communication: where each messaging channel is configured.
 *
 * The two notification cards used to link to `/notifications`, the inbox,
 * which is not where these are configured — they now open the Notifications
 * tab of Settings, which is.
 *
 * @param props.onNavigate - Switches the open settings tab.
 */
export function CommunicationSection({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const { hasPermission } = usePermissions();
  const cards = CARDS.filter((c) => !c.permission || hasPermission(c.permission));

  return (
    <div className="space-y-5">
      <SectionHeader title="Communication" desc="Email, SMS and messaging preferences" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] dark:bg-slate-700 flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4 text-[#003366] dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.desc}</p>
              </div>
            </div>
            {c.section ? (
              <button
                type="button"
                onClick={() => onNavigate(c.section as SectionId)}
                className="inline-flex items-center gap-1 text-xs text-[#003366] dark:text-blue-400 font-medium hover:underline"
              >
                Configure <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <a
                href={c.href}
                className="inline-flex items-center gap-1 text-xs text-[#003366] dark:text-blue-400 font-medium hover:underline"
              >
                Configure <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </Card>
        ))}
      </div>
      <Notice tone="warning" icon={<Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />}>
        Full communication engine configuration is coming soon. Use the links above to access
        current messaging features.
      </Notice>
    </div>
  );
}
