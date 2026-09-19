import React from "react";
import { ArrowLeftRight, CreditCard, Receipt, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar2,
  Chart2,
  ClipboardClose,
  Dashboard,
  Message,
  Note,
  Settings,
  UserGroup,
  VolumeHigh,
} from "@/components/Icons";
import type { NavIconKey } from "./navConfig";

/** The icons drawn with lucide take a class, not an `isActive` flag. */
function lucideClass(active: boolean): string {
  return cn("h-5 w-5", active ? "text-[#003366] dark:text-blue-300" : "text-[#929292]");
}

/**
 * The glyph for a navigation entry, tinted when its section is current.
 *
 * @param props.icon - Which icon the entry wears.
 * @param props.active - Whether the entry's section is the current one.
 * @returns The icon.
 */
export function NavIcon({ icon, active }: { icon: NavIconKey; active: boolean }) {
  switch (icon) {
    case "dashboard":
      return <Dashboard isActive={active} />;
    case "classes":
      return <BookOpen isActive={active} />;
    case "curriculum":
      return <Note isActive={active} />;
    case "assessments":
      return <Chart2 isActive={active} />;
    case "timetable":
      return <Calendar2 isActive={active} />;
    case "fees":
      return <CreditCard className={lucideClass(active)} />;
    case "payments":
      return <Receipt className={lucideClass(active)} />;
    case "finance":
      return <Wallet className={lucideClass(active)} />;
    case "users":
      return <UserGroup isActive={active} />;
    case "announcements":
      return <VolumeHigh isActive={active} />;
    case "leaveRequests":
      return <ClipboardClose isActive={active} />;
    case "transit":
      return <ArrowLeftRight className={lucideClass(active)} />;
    case "messages":
      return <Message isActive={active} />;
    case "settings":
      return <Settings isActive={active} />;
  }
}
