"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  UserCog,
  Receipt,
  Sun,
  Moon,
  Monitor,
  Check,
  Download,
  ExternalLink,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import { useTheme, Theme } from "@/providers/theme-provider";
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";


import { authService } from "@/app/services/auth.service";


import {
  getFinanceSettings,
  fetchExportData,
  downloadAsCsv,
  FinanceSettings,
} from "@/app/services/school-settings.service";
import {
  Card,
  CardHeader,
  OutlineBtn,
  SectionHeader,
} from "@/components/settings/ui";
import { SchoolProfileSection } from "@/components/settings/SchoolProfileSection";
import { AdminAccountSection } from "@/components/settings/AdminAccountSection";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { AcademicSetupSection } from "@/components/settings/AcademicSetupSection";
import { ClassesCurriculumSection } from "@/components/settings/ClassesCurriculumSection";
import { AssessmentSettingsSection } from "@/components/settings/AssessmentSettingsSection";
import { FeesReceiptsSection } from "@/components/settings/FeesReceiptsSection";
import { PaymentsFinanceSection } from "@/components/settings/PaymentsFinanceSection";
import { CommunicationSection } from "@/components/settings/CommunicationSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import {
  visibleSections,
  type SectionId,
  type SettingsSectionProps,
} from "@/components/settings/sections";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";







// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const [profile, setProfile] = useState<any>(null);
  const [finSettings, setFinSettings] = useState<FinanceSettings | null>(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [loadingFin, setLoadingFin] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // Seed from localStorage immediately so UI isn't blank
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "{}");
      setProfile(cached);
    } catch {}

    // Fetch fresh profile from backend
    const fetchProfile = async () => {
      try {
        const cached = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = cached.userId || cached._id;
        if (!userId) return;
        const fresh = await authService.getUserProfile(userId);
        const merged = { ...cached, ...fresh };
        localStorage.setItem("user", JSON.stringify(merged));
        setProfile(merged);
      } catch {
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();

    getFinanceSettings()
      .then((r) => setFinSettings(r.settings))
      .catch(() => {})
      .finally(() => setLoadingFin(false));
  }, []);

  const masked = profile?.email
    ? (() => {
        const [l, d] = profile.email.split("@");
        return `${l.slice(0, 3)}${"*".repeat(Math.max(0, l.length - 3))}@${d}`;
      })()
    : "—";

  const otpEnabled = finSettings?.requireEmailOtpForWithdrawals ?? true;

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" desc="Password, OTP and access security" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Password */}
        <Card>
          <CardHeader title="Password" />
          <div className="p-5">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  Account Password
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your password regularly for security
                </p>
              </div>
              <OutlineBtn onClick={() => setShowPwModal(true)}>
                <Lock className="w-3.5 h-3.5" /> Change
              </OutlineBtn>
            </div>
          </div>
        </Card>

        {/* Email OTP */}
        <Card>
          <CardHeader title="Email OTP" />
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  Email OTP (Withdrawals)
                </p>
                <p className="text-xs text-gray-500">OTP sent to: {masked}</p>
              </div>
              {loadingFin ? (
                <div className="w-16 h-5 bg-gray-100 rounded-full animate-pulse" />
              ) : (
                <span
                  className={`text-xs font-medium border px-2 py-0.5 rounded-full ${
                    otpEnabled
                      ? "text-green-600 border-green-200 bg-green-50"
                      : "text-gray-500 border-gray-200 bg-gray-50"
                  }`}
                >
                  {otpEnabled ? "Enabled" : "Disabled"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Manage OTP settings in{" "}
              <button onClick={() => {}} className="text-[#003366] underline font-medium">
                Payments & Finance
              </button>
            </p>
          </div>
        </Card>

        {/* Session Security */}
        <Card>
          <CardHeader
            title="Session Security"
            action={
              loadingProfile ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#003366] rounded-full animate-spin" />
              ) : (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              )
            }
          />
          <div className="p-5 space-y-2">
            {[
              {
                label: "Last Login",
                value: profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : "—",
              },
              {
                label: "Email Verified",
                value:
                  profile?.isEmailVerified === undefined
                    ? "—"
                    : profile.isEmailVerified
                      ? "Yes"
                      : "No",
                highlight:
                  profile?.isEmailVerified === undefined
                    ? ""
                    : profile.isEmailVerified
                      ? "text-green-600"
                      : "text-red-500",
                icon: profile?.isEmailVerified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : profile?.isEmailVerified === false ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                ) : null,
              },
              {
                label: "Account Status",
                value:
                  profile?.isActive === undefined ? "—" : profile.isActive ? "Active" : "Inactive",
                highlight:
                  profile?.isActive === undefined
                    ? ""
                    : profile.isActive
                      ? "text-green-600"
                      : "text-red-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-slate-700 last:border-0"
              >
                <span className="text-gray-500">{s.label}</span>
                <span
                  className={`font-medium flex items-center gap-1.5 ${s.highlight || "text-gray-800 dark:text-slate-200"}`}
                >
                  {"icon" in s && s.icon}
                  {loadingProfile && s.value === "—" ? (
                    <span className="inline-block w-24 h-3.5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    s.value
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader title="Access Control" />
          <div className="p-5 space-y-2">
            {[
              { label: "Role", value: profile?.role?.replace(/_/g, " ") || "School Admin" },
              { label: "School", value: profile?.schoolName || profile?.schoolId?.name || "—" },
              { label: "User ID", value: profile?.userId || profile?._id || "—" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-slate-700 last:border-0"
              >
                <span className="text-gray-500">{s.label}</span>
                {loadingProfile && s.value === "—" ? (
                  <span className="inline-block w-28 h-3.5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  <span className="text-gray-800 dark:text-slate-200 font-medium capitalize truncate max-w-[180px]">
                    {s.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Data & System Section ────────────────────────────────────────────────────

function DataSystemSection() {
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: "students" | "staff" | "fees", label: string) => {
    setExporting(type);
    try {
      const result = await fetchExportData(type);
      if (!result.data.length) {
        toast.error(result.message || `No ${label} data to export`);
        return;
      }
      downloadAsCsv(result.data, `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${label} exported (${result.count} records)`);
    } catch {
      toast.error(`Failed to export ${label}`);
    } finally {
      setExporting(null);
    }
  };

  const exportCards = [
    {
      title: "Export Students",
      desc: "Download all student records in CSV format",
      icon: Users,
      action: () => handleExport("students", "Students"),
      type: "students",
    },
    {
      title: "Export Staff",
      desc: "Download all staff and teacher records in CSV format",
      icon: UserCog,
      action: () => handleExport("staff", "Staff"),
      type: "staff",
    },
    {
      title: "Academic Reports",
      desc: "Download term-based academic performance reports",
      icon: FileText,
      action: () => router.push("/assessments"),
      type: null,
    },
    {
      title: "Finance Statement",
      desc: "Download detailed income and withdrawal statements",
      icon: Receipt,
      action: () => router.push("/finance"),
      type: null,
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Data & System" desc="Backups, exports and system information" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exportCards.map((c) => (
          <Card
            key={c.title}
            className="p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={c.action}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                c.action();
              }}
              disabled={exporting === c.type}
              className="inline-flex items-center gap-1.5 text-xs text-[#003366] font-medium hover:underline disabled:opacity-50"
            >
              {exporting === c.type ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Exporting…
                </>
              ) : c.type ? (
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
        ))}
      </div>

      {/* Backup Status */}
      <Card>
        <CardHeader title="Backup Status" />
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Backup completed successfully</p>
              <p className="text-xs text-green-600">
                Your school data is securely backed up by Talim
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              {
                label: "Last Backup",
                value: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
              },
              {
                label: "Next Backup",
                value: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleString(),
              },
              { label: "Backup Frequency", value: "Weekly (Every Sunday)" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600"
              >
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader title="System Information" />
        <div className="p-5 space-y-2 text-sm">
          {[
            { label: "Platform", value: "Talim School Administration" },
            { label: "Version", value: "2.0.0" },
            { label: "Environment", value: "Production" },
            { label: "Support", value: "support@mytalim.com" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0"
            >
              <span className="text-gray-500">{s.label}</span>
              <span className="text-gray-800 dark:text-slate-200 font-medium">
                {s.label === "Support" ? (
                  <a href={`mailto:${s.value}`} className="text-[#003366] hover:underline">
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

// ─── Appearance Section ───────────────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", desc: "Clean white interface", icon: Sun },
  { value: "dark", label: "Dark", desc: "Easy on the eyes at night", icon: Moon },
  { value: "system", label: "System", desc: "Follows your device preference", icon: Monitor },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Appearance"
        desc="Choose how Talim School Admin looks on this device."
      />
      <Card>
        <CardHeader title="Theme" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEME_OPTIONS.map(({ value, label, desc, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-[#003366] dark:border-blue-500 bg-[#EBF0F7] dark:bg-slate-700"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selected
                      ? "bg-[#003366] dark:bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${selected ? "text-[#003366] dark:text-blue-400" : "text-gray-700 dark:text-slate-200"}`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-[#003366] dark:bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
      <Card>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Theme preference is stored locally on this device and does not sync across browsers or
            devices.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

const SECTION_MAP: Record<SectionId, React.ComponentType<SettingsSectionProps>> = {
  "school-profile": SchoolProfileSection,
  "admin-account": AdminAccountSection,
  "academic-setup": AcademicSetupSection,
  "classes-curriculum": ClassesCurriculumSection,
  "assessment-settings": AssessmentSettingsSection,
  "fees-receipts": FeesReceiptsSection,
  "payments-finance": PaymentsFinanceSection,
  communication: CommunicationSection,
  notifications: NotificationsSection,
  security: SecuritySection,
  "data-system": DataSystemSection,
  appearance: AppearanceSection,
  "sub-admins": SubAdminsSection,
};

/**
 * Settings — a sidebar of sections, one rendered at a time.
 *
 * The route itself already requires `manage:settings` (RouteGuard reads
 * `routePermissions`); `canManage` passes the same fact down so a role without
 * it never sees an edit control it cannot use. Sub-Admins is reserved for the
 * primary school admin.
 */
export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("school-profile");
  const { hasPermission, isFullAdmin } = usePermissions();

  const canManage = hasPermission(Permission.MANAGE_SETTINGS);
  const canManageSubAdmins = isFullAdmin && hasPermission(Permission.MANAGE_SUB_ADMINS);
  const sections = visibleSections(canManageSubAdmins);

  // A tab that stops being visible (role change, session refresh) falls back.
  const current = sections.some((s) => s.id === active) ? active : "school-profile";
  const ActiveSection = SECTION_MAP[current];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">Settings</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Manage your school&apos;s preferences
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Settings sections">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = current === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-colors ${
                  isActive
                    ? "bg-[#EBF0F7] dark:bg-slate-700 text-[#003366] dark:text-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-[#003366] dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${isActive ? "text-[#003366] dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[10px] text-gray-400 dark:text-slate-600">Talim School Admin v2.0</p>
        </div>
      </aside>

      {/* Right Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <ActiveSection canManage={canManage} onNavigate={setActive} />
        </div>
      </main>
    </div>
  );
}
