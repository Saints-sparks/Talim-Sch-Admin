import type React from "react";
import {
  BarChart2,
  Bell,
  BookOpen,
  Calendar,
  Database,
  MessageSquare,
  Palette,
  Receipt,
  School,
  Shield,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

/** Every tab in the Settings sidebar. */
export type SectionId =
  | "school-profile"
  | "admin-account"
  | "academic-setup"
  | "classes-curriculum"
  | "assessment-settings"
  | "fees-receipts"
  | "payments-finance"
  | "communication"
  | "notifications"
  | "security"
  | "data-system"
  | "appearance"
  | "sub-admins";

/** One entry in the Settings sidebar. */
export interface SectionMeta {
  id: SectionId;
  label: string;
  desc: string;
  icon: React.ElementType;
  /**
   * Reserved for the primary school admin. Sub-admins never see it, whatever
   * their permissions — the API refuses them too.
   */
  fullAdminOnly?: boolean;
}

/** The props every settings section is rendered with. */
export interface SettingsSectionProps {
  /** True when the user holds `manage:settings`; false hides every edit affordance. */
  canManage: boolean;
  /** Switches the open tab (used by cross-references between sections). */
  onNavigate: (id: SectionId) => void;
}

/** The Settings sidebar, in display order. */
export const SECTIONS: SectionMeta[] = [
  { id: "school-profile", label: "School Profile", desc: "School information and branding", icon: School },
  { id: "admin-account", label: "Admin Profile", desc: "Personal information & preferences", icon: UserCog },
  { id: "academic-setup", label: "Academic Setup", desc: "Academic year, terms and grading periods", icon: Calendar },
  { id: "classes-curriculum", label: "Classes & Curriculum", desc: "Class levels, subjects and curriculum", icon: BookOpen },
  { id: "assessment-settings", label: "Assessment Settings", desc: "Grading rules and assessment preferences", icon: BarChart2 },
  { id: "fees-receipts", label: "Fees & Receipts", desc: "Fee categories, invoices and receipt design", icon: Receipt },
  { id: "payments-finance", label: "Payments & Finance", desc: "Wallet, withdrawals and payout settings", icon: Wallet },
  { id: "communication", label: "Communication", desc: "Email, SMS and messaging preferences", icon: MessageSquare },
  { id: "notifications", label: "Notifications", desc: "Notification preferences and alerts", icon: Bell },
  { id: "security", label: "Security", desc: "Password, OTP and access security", icon: Shield },
  { id: "data-system", label: "Data & System", desc: "Backups, exports and system info", icon: Database },
  { id: "appearance", label: "Appearance", desc: "Theme and display preferences", icon: Palette },
  { id: "sub-admins", label: "Sub-Admins", desc: "Delegate admin responsibilities", icon: Users, fullAdminOnly: true },
];

/**
 * The sections a user may open.
 *
 * @param canManageSubAdmins - True only for a primary school admin holding
 *   `manage:sub_admins`.
 * @returns The visible subset of {@link SECTIONS}.
 */
export function visibleSections(canManageSubAdmins: boolean): SectionMeta[] {
  return SECTIONS.filter((s) => !s.fullAdminOnly || canManageSubAdmins);
}
