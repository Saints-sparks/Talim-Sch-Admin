import React from "react";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  CalendarX2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Receipt,
  School,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NavIconKey } from "./navConfig";

/** The glyph per navigation entry. */
const ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  classes: School,
  curriculum: BookOpen,
  assessments: ClipboardList,
  termResults: ClipboardCheck,
  timetable: CalendarDays,
  fees: CreditCard,
  payments: Receipt,
  finance: Wallet,
  users: Users,
  announcements: Megaphone,
  leaveRequests: CalendarX2,
  transit: ArrowLeftRight,
  messages: MessageSquare,
  settings: Settings,
  support: LifeBuoy,
};

/**
 * The glyph for a navigation entry, navy when its section is current and
 * muted otherwise. Decorative: the entry's label (or the rail's tooltip and
 * accessible name) carries the meaning.
 *
 * @param props - The icon and its state.
 * @param props.icon - Which icon the entry wears.
 * @param props.active - Whether the entry's section is the current one.
 * @returns The icon.
 */
export function NavIcon({ icon, active }: { icon: NavIconKey; active: boolean }) {
  const Icon = ICONS[icon];
  return (
    <Icon
      aria-hidden
      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-tl-brand" : "text-tl-muted"}`}
    />
  );
}
