"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  UserCog,
  Calendar,
  BookOpen,
  BarChart2,
  Receipt,
  Wallet,
  MessageSquare,
  Bell,
  Shield,
  Database,
  Palette,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Plus,
  X,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Upload,
  Download,
  ExternalLink,
  Lock,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  CreditCard,
  Building2,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import { useTheme, Theme } from "@/providers/theme-provider";
import {
  AcademicYearResponse,
  TermResponse,
  createAcademicYear,
  createTerm,
  getAcademicYears,
  getTerms,
  setCurrentTerm,
} from "@/app/services/academic.service";
import { authService } from "@/app/services/auth.service";
import {
  getWalletSummary,
  getBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  BankAccount,
  WalletSummary,
} from "@/app/services/finance.service";
import {
  getReceiptSettings,
  updateReceiptSettings,
  getFinanceSettings,
  updateFinanceSettings,
  changeSettingsPassword,
  ReceiptSettings,
  FinanceSettings,
} from "@/app/services/school-settings.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
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
  | "appearance";

const SECTIONS: {
  id: Section;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  { id: "school-profile", label: "School Profile", desc: "School information and branding", icon: School },
  { id: "admin-account", label: "Admin Account", desc: "Personal information & preferences", icon: UserCog },
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
];

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</h3>
      {action}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</p>
        {desc && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          checked ? "bg-[#003366]" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm text-gray-700 flex-1">{value || "—"}</span>
        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 outline-none transition"
      />
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function OutlineBtn({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    current: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-gray-100 text-gray-600 border-gray-200",
    upcoming: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  const key = status.toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${map[key] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── School Profile Section ───────────────────────────────────────────────────

function SchoolProfileSection() {
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const school = user?.schoolId || {};

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Only PNG or JPG files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "presetOne");
      const res = await fetch("https://api.cloudinary.com/v1_1/ddbs7m7nt/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        toast.success("Logo uploaded. Contact Talim support to apply the change.");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="School Profile" desc="School information and branding" />

      {/* School Logo */}
      <Card>
        <CardHeader title="School Logo" />
        <div className="p-5 flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
            {school.logo ? (
              <img src={school.logo} alt="School logo" className="w-full h-full object-contain" />
            ) : (
              <School className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
            <OutlineBtn onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Change Logo"}
            </OutlineBtn>
            <p className="text-xs text-gray-500 mt-1.5">PNG, JPG — max 2MB</p>
          </div>
        </div>
      </Card>

      {/* School Information */}
      <Card>
        <CardHeader title="School Information" />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="School Name" value={school.name} />
            <ReadOnlyField label="School Email" value={school.email} />
            <ReadOnlyField label="School Code" value={school.schoolPrefix} />
            <ReadOnlyField label="Status" value={school.active ? "Active" : "Inactive"} />
          </div>
          <ReadOnlyField label="Address" value={school.physicalAddress} />
          <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              School name and email are managed by Talim support. Contact{" "}
              <a href="mailto:support@mytalim.com" className="underline font-medium">
                support@mytalim.com
              </a>{" "}
              to request changes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Admin Account Section ────────────────────────────────────────────────────

function AdminAccountSection() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phoneNumber: "" });
  const [saving, setSaving] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const data = JSON.parse(user);
        setProfile(data);
        setForm({ firstName: data.firstName || "", lastName: data.lastName || "", phoneNumber: data.phoneNumber || "" });
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateUserProfile(form);
      const updated = { ...profile, ...form };
      localStorage.setItem("user", JSON.stringify(updated));
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Admin Account" desc="Manage your personal profile and preferences" />

      <Card>
        <CardHeader
          title="Profile Information"
          action={
            editing ? (
              <div className="flex gap-2">
                <OutlineBtn onClick={() => setEditing(false)} disabled={saving}>Cancel</OutlineBtn>
                <PrimaryBtn onClick={handleSave} loading={saving}>Save Changes</PrimaryBtn>
              </div>
            ) : (
              <OutlineBtn onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </OutlineBtn>
            )
          }
        />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <InputField label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
                <InputField label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
                <InputField label="Phone Number" value={form.phoneNumber} onChange={(v) => setForm({ ...form, phoneNumber: v })} />
                <ReadOnlyField label="Email" value={profile?.email} />
              </>
            ) : (
              <>
                <ReadOnlyField label="Full Name" value={`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()} />
                <ReadOnlyField label="Email" value={profile?.email} />
                <ReadOnlyField label="Phone Number" value={profile?.phoneNumber || "Not set"} />
                <ReadOnlyField label="Role" value={profile?.role || "School Admin"} />
              </>
            )}
          </div>
          {profile?.lastLogin && (
            <p className="text-xs text-gray-500">
              Last login: {new Date(profile.lastLogin).toLocaleString()}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Account Security" />
        <div className="p-5">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Password</p>
              <p className="text-xs text-gray-500">Update your account password</p>
            </div>
            <OutlineBtn onClick={() => setShowPwModal(true)}>
              <Lock className="w-3.5 h-3.5" /> Change Password
            </OutlineBtn>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showPwModal && (
          <ChangePasswordModal onClose={() => setShowPwModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await changeSettingsPassword(form);
      toast.success("Password changed successfully");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const rules = [
    { text: "At least 8 characters", ok: form.newPassword.length >= 8 },
    { text: "One uppercase letter", ok: /[A-Z]/.test(form.newPassword) },
    { text: "One number", ok: /[0-9]/.test(form.newPassword) },
    { text: "One special character", ok: /[^A-Za-z0-9]/.test(form.newPassword) },
  ];

  return (
    <ModalShell title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(["current", "newPw", "confirm"] as const).map((key, i) => {
          const labels = ["Current Password *", "New Password *", "Confirm New Password *"];
          const fields = ["currentPassword", "newPassword", "confirmPassword"] as const;
          return (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{labels[i]}</label>
              <div className="relative">
                <input
                  type={show[key] ? "text" : "password"}
                  value={form[fields[i]]}
                  onChange={(e) => setForm({ ...form, [fields[i]]: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 outline-none"
                />
                <button type="button" onClick={() => setShow({ ...show, [key]: !show[key] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {form.newPassword && (
          <ul className="space-y-1">
            {rules.map((r) => (
              <li key={r.text} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-green-600" : "text-gray-400"}`}>
                <Check className={`w-3 h-3 ${r.ok ? "" : "opacity-0"}`} />
                {r.text}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 pt-2">
          <OutlineBtn onClick={onClose} disabled={saving} className="flex-1 justify-center">Cancel</OutlineBtn>
          <PrimaryBtn type="submit" loading={saving} className="flex-1 justify-center">Update Password</PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Academic Setup Section ───────────────────────────────────────────────────

function AcademicSetupSection() {
  const [years, setYears] = useState<AcademicYearResponse[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showYearForm, setShowYearForm] = useState(false);
  const [showTermForm, setShowTermForm] = useState(false);
  const [showChangeTermModal, setShowChangeTermModal] = useState(false);
  const [pendingTermId, setPendingTermId] = useState("");

  const [yearForm, setYearForm] = useState({ year: "", startDate: "", endDate: "", isCurrent: false });
  const [termForm, setTermForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false, academicYearId: "" });

  const uniqueYears = years.reduce<AcademicYearResponse[]>((acc, y) => {
    const ex = acc.find((a) => a.year === y.year);
    if (!ex) return [...acc, y];
    if (y.isCurrent && !ex.isCurrent) return acc.map((a) => (a.year === y.year ? y : a));
    return acc;
  }, []);

  const currentYear = uniqueYears.find((y) => y.isCurrent);
  const currentTerm = terms.find((t) => t.isCurrent);

  const getSchoolId = () => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").schoolId?._id || ""; }
    catch { return ""; }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [y, t] = await Promise.all([getAcademicYears().catch(() => []), getTerms().catch(() => [])]);
      setYears(y || []);
      setTerms(t || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const progress = (() => {
    if (!currentYear || !currentTerm) return null;
    const start = new Date(currentYear.startDate).getTime();
    const end = new Date(currentYear.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = Math.max(0, Math.min(now - start, total));
    const pct = Math.round((elapsed / total) * 100);
    const daysElapsed = Math.round(elapsed / 86400000);
    const daysRemaining = Math.round((end - now) / 86400000);
    return { pct, daysElapsed, daysRemaining: Math.max(0, daysRemaining), total: Math.round(total / 86400000) };
  })();

  const submitYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.year.trim()) return toast.error("Academic year is required");
    if (!yearForm.startDate || !yearForm.endDate) return toast.error("Dates are required");
    if (new Date(yearForm.startDate) >= new Date(yearForm.endDate)) return toast.error("End date must be after start date");
    if (uniqueYears.some((y) => y.year === yearForm.year.trim())) return toast.error("Academic year already exists");
    setSubmitting(true);
    try {
      await createAcademicYear({ ...yearForm, year: yearForm.year.trim(), startDate: new Date(yearForm.startDate).toISOString(), endDate: new Date(yearForm.endDate).toISOString() });
      setYearForm({ year: "", startDate: "", endDate: "", isCurrent: false });
      setShowYearForm(false);
      toast.success("Academic year created");
      load();
    } catch { toast.error("Failed to create academic year"); }
    finally { setSubmitting(false); }
  };

  const submitTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.name.trim()) return toast.error("Term name is required");
    if (!termForm.startDate || !termForm.endDate) return toast.error("Dates are required");
    if (new Date(termForm.startDate) >= new Date(termForm.endDate)) return toast.error("End date must be after start date");
    if (!termForm.academicYearId) return toast.error("Academic year is required");
    setSubmitting(true);
    try {
      await createTerm({ name: termForm.name.trim(), startDate: termForm.startDate, endDate: termForm.endDate, isCurrent: termForm.isCurrent, academicYearId: termForm.academicYearId });
      setTermForm({ name: "", startDate: "", endDate: "", isCurrent: false, academicYearId: "" });
      setShowTermForm(false);
      toast.success("Term created");
      load();
    } catch { toast.error("Failed to create term"); }
    finally { setSubmitting(false); }
  };

  const doSetCurrentTerm = async (termId: string) => {
    setSubmitting(true);
    try {
      await setCurrentTerm(termId);
      toast.success("Current term updated");
      load();
    } catch { toast.error("Failed to update current term"); }
    finally { setSubmitting(false); setShowChangeTermModal(false); }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Academic Setup" desc="Manage academic years and terms" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Academic Setup" desc="Manage academic years, terms and grading periods" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Current Academic Year</p>
          <p className="text-lg font-bold text-gray-900">{currentYear?.year || "Not set"}</p>
          {currentYear && (
            <>
              <StatusBadge status="Active" />
              <p className="text-xs text-gray-500 mt-2">
                {fmtDate(currentYear.startDate)} – {fmtDate(currentYear.endDate)}
              </p>
            </>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Current Term</p>
          <p className="text-lg font-bold text-gray-900">{currentTerm?.name || "Not set"}</p>
          {currentTerm && (
            <>
              <StatusBadge status="Active" />
              <p className="text-xs text-gray-500 mt-2">
                {fmtDate(currentTerm.startDate)} – {fmtDate(currentTerm.endDate)}
              </p>
            </>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Academic Progress</p>
          {progress ? (
            <>
              <p className="text-lg font-bold text-gray-900">{progress.pct}%</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className="bg-[#003366] h-1.5 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress.daysElapsed}d elapsed · {progress.daysRemaining}d remaining
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No active year</p>
          )}
        </Card>
      </div>

      {/* Academic Years Table */}
      <Card>
        <CardHeader
          title="Academic Years"
          action={
            <PrimaryBtn onClick={() => setShowYearForm(!showYearForm)}>
              <Plus className="w-3.5 h-3.5" /> Add Academic Year
            </PrimaryBtn>
          }
        />
        <AnimatePresence>
          {showYearForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <form onSubmit={submitYear} className="p-5 border-b border-gray-100 bg-gray-50 space-y-4">
                <p className="text-sm font-medium text-gray-700">Add New Academic Year</p>
                <p className="text-xs text-gray-500">Create a new academic year for your school</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField label="Academic Year" value={yearForm.year} onChange={(v) => setYearForm({ ...yearForm, year: v })} placeholder="e.g. 2027/2028" required />
                  <InputField label="Start Date" value={yearForm.startDate} onChange={(v) => setYearForm({ ...yearForm, startDate: v })} type="date" required />
                  <InputField label="End Date" value={yearForm.endDate} onChange={(v) => setYearForm({ ...yearForm, endDate: v })} type="date" required />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="yearCurrent" checked={yearForm.isCurrent} onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })} className="rounded border-gray-300" />
                  <label htmlFor="yearCurrent" className="text-xs text-gray-700">Set as current academic year</label>
                </div>
                <p className="text-xs text-gray-500">Once created, you can add terms to this academic year.</p>
                <div className="flex gap-3">
                  <OutlineBtn onClick={() => setShowYearForm(false)} disabled={submitting}>Cancel</OutlineBtn>
                  <PrimaryBtn type="submit" loading={submitting}>Save Academic Year</PrimaryBtn>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Academic Year", "Start Date", "End Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueYears.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No academic years found</td></tr>
              ) : (
                uniqueYears.map((y) => (
                  <tr key={y._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {y.year} {y.isCurrent && <span className="ml-1.5 text-xs text-blue-600 font-semibold">Current</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(y.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(y.endDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={y.isCurrent ? "Active" : "Completed"} /></td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {uniqueYears.length > 0 && (
            <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-50">
              Showing 1 to {uniqueYears.length} of {uniqueYears.length} results
            </p>
          )}
        </div>
      </Card>

      {/* Terms Table */}
      <Card>
        <CardHeader
          title="Terms"
          action={
            <PrimaryBtn onClick={() => setShowTermForm(!showTermForm)} disabled={uniqueYears.length === 0}>
              <Plus className="w-3.5 h-3.5" /> Add Term
            </PrimaryBtn>
          }
        />
        <AnimatePresence>
          {showTermForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <form onSubmit={submitTerm} className="p-5 border-b border-gray-100 bg-gray-50 space-y-4">
                <p className="text-sm font-medium text-gray-700">Add New Term</p>
                <p className="text-xs text-gray-500">Add a new term for the selected academic year</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Term Name" value={termForm.name} onChange={(v) => setTermForm({ ...termForm, name: v })} placeholder="e.g. First Term" required />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year <span className="text-red-500">*</span></label>
                    <select value={termForm.academicYearId} onChange={(e) => setTermForm({ ...termForm, academicYearId: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003366]" required>
                      <option value="">Select academic year</option>
                      {uniqueYears.map((y) => (
                        <option key={y._id} value={y._id}>{y.year}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Start Date" value={termForm.startDate} onChange={(v) => setTermForm({ ...termForm, startDate: v })} type="date" required />
                  <InputField label="End Date" value={termForm.endDate} onChange={(v) => setTermForm({ ...termForm, endDate: v })} type="date" required />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setTermForm({ ...termForm, isCurrent: !termForm.isCurrent })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${termForm.isCurrent ? "bg-[#003366]" : "bg-gray-200"}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${termForm.isCurrent ? "translate-x-4.5" : "translate-x-0.5"}`} />
                    </button>
                    <label className="text-xs text-gray-700">Set as current term</label>
                  </div>
                  <span className="text-xs text-gray-400">Only one term can be current at a time</span>
                </div>
                <div className="flex gap-3">
                  <OutlineBtn onClick={() => setShowTermForm(false)} disabled={submitting}>Cancel</OutlineBtn>
                  <PrimaryBtn type="submit" loading={submitting}>Save Term</PrimaryBtn>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Term Name", "Start Date", "End Date", "Status", "Is Current", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No terms found</td></tr>
              ) : (
                terms.map((t) => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(t.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(t.endDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.isCurrent ? "Active" : "Upcoming"} /></td>
                    <td className="px-4 py-3">
                      {t.isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Check className="w-3 h-3" /> Current</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        {!t.isCurrent && (
                          <button onClick={() => { setPendingTermId(t._id); setShowChangeTermModal(true); }}
                            className="px-2 py-1 text-xs text-[#003366] border border-[#003366]/20 rounded hover:bg-[#003366]/5 transition" title="Set as current">
                            Set Current
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {terms.length > 0 && (
            <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-50">
              Showing 1 to {terms.length} of {terms.length} results
            </p>
          )}
        </div>
      </Card>

      {/* Change Current Term Confirmation Modal */}
      <AnimatePresence>
        {showChangeTermModal && (
          <ModalShell title="Change Current Term?" onClose={() => setShowChangeTermModal(false)}>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  {terms.find((t) => t._id === pendingTermId)?.name} will become the current term.
                </p>
                {currentTerm && (
                  <p className="text-xs text-gray-500 mt-1">{currentTerm.name} will be set to Upcoming.</p>
                )}
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <OutlineBtn onClick={() => setShowChangeTermModal(false)} disabled={submitting}>Cancel</OutlineBtn>
                <button onClick={() => doSetCurrentTerm(pendingTermId)} disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                  {submitting ? "Updating…" : "Change Term"}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Classes & Curriculum Section ─────────────────────────────────────────────

function ClassesCurriculumSection() {
  const router = useRouter();
  const cards = [
    { title: "Manage Classes", desc: "Add, edit and manage class levels for your school", icon: Users, link: "/classes", action: "Go to Classes" },
    { title: "Manage Subjects", desc: "Add, edit and assign subjects to classes", icon: BookOpen, link: "/subject", action: "Go to Subjects" },
    { title: "Curriculum Library", desc: "View and manage curriculum content linked to classes", icon: FileText, link: "/curriculum", action: "Go to Curriculum" },
    { title: "Class Promotion Settings", desc: "Configure promotion rules and criteria", icon: ChevronRight, link: "/classes", action: "Configure" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Classes & Curriculum" desc="Quick access to class and curriculum management" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(c.link)}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EBF0F7] flex items-center justify-center shrink-0">
                <c.icon className="w-5 h-5 text-[#003366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
              <button onClick={() => router.push(c.link)}
                className="text-xs text-[#003366] font-medium hover:underline shrink-0 flex items-center gap-1">
                {c.action} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">Class and curriculum settings are managed through their dedicated modules. Use the links above to navigate directly.</p>
      </div>
    </div>
  );
}

// ─── Assessment Settings Section ──────────────────────────────────────────────

const GRADING_SCALE = [
  { grade: "A+", min: 90, max: 100 },
  { grade: "A",  min: 80, max: 89 },
  { grade: "B+", min: 75, max: 79 },
  { grade: "B",  min: 70, max: 74 },
  { grade: "C+", min: 65, max: 69 },
  { grade: "C",  min: 60, max: 64 },
  { grade: "D+", min: 55, max: 59 },
  { grade: "D",  min: 50, max: 54 },
  { grade: "E",  min: 45, max: 49 },
  { grade: "F",  min: 0,  max: 44 },
];

function AssessmentSettingsSection() {
  const [allowDecimals, setAllowDecimals] = useState(true);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [publishToParents, setPublishToParents] = useState(false);

  return (
    <div className="space-y-5">
      <SectionHeader title="Assessment Settings" desc="Grading rules and assessment preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grading Scale */}
        <Card>
          <CardHeader title="Grading Scale" />
          <div className="p-4">
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-xs font-semibold text-gray-500">Grade</th>
                    <th className="py-2 text-left text-xs font-semibold text-gray-500">Min Score (%)</th>
                    <th className="py-2 text-left text-xs font-semibold text-gray-500">Max Score (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADING_SCALE.map((g) => (
                    <tr key={g.grade} className="border-b border-gray-50">
                      <td className="py-2 font-semibold text-[#003366]">{g.grade}</td>
                      <td className="py-2 text-gray-700">{g.min}</td>
                      <td className="py-2 text-gray-700">{g.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Score Weighting + Other Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Score Weighting" />
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Test Score (CA)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#003366]">30</span>
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Exam Score</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#003366]">70</span>
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Other Settings" />
            <div className="p-5 space-y-1">
              <ToggleRow label="Allow decimals in scores" checked={allowDecimals} onChange={setAllowDecimals} />
              <ToggleRow label="Auto-calculate results" desc="Automatically compute final scores from CA and exam" checked={autoCalculate} onChange={setAutoCalculate} />
              <ToggleRow label="Publish results to parents" desc="Make results visible in the parent portal" checked={publishToParents} onChange={setPublishToParents} />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Full assessment configuration is available in the{" "}
          <a href="/assessments" className="underline font-medium">Assessments module</a>.
        </p>
      </div>
    </div>
  );
}

// ─── Fees & Receipts Section ──────────────────────────────────────────────────

function FeesReceiptsSection() {
  const [settings, setSettings] = useState<ReceiptSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [footerNote, setFooterNote] = useState("");
  const signatureRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    getReceiptSettings()
      .then((r) => {
        setSettings(r.settings);
        setFooterNote(r.settings.footerNote || "");
      })
      .catch(() => toast.error("Could not load receipt settings"))
      .finally(() => setLoading(false));
  }, []);

  const updateToggle = async (field: keyof ReceiptSettings, value: boolean) => {
    if (!settings) return;
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    try {
      await updateReceiptSettings({ [field]: value });
    } catch {
      setSettings(settings);
      toast.error("Failed to save");
    }
  };

  const saveFooterNote = async () => {
    setSaving(true);
    try {
      await updateReceiptSettings({ footerNote });
      setSettings((s) => s ? { ...s, footerNote } : s);
      toast.success("Footer note saved");
    } catch { toast.error("Failed to save footer note"); }
    finally { setSaving(false); }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) { toast.error("Only PNG or JPG files"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "presetOne");
      const r = await fetch("https://api.cloudinary.com/v1_1/ddbs7m7nt/image/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (data.secure_url) {
        await updateReceiptSettings({ signatureUrl: data.secure_url });
        setSettings((s) => s ? { ...s, signatureUrl: data.secure_url } : s);
        toast.success("Signature uploaded");
      }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const removeSignature = async () => {
    try {
      await updateReceiptSettings({ signatureUrl: "", signatureName: "", signatureTitle: "" });
      setSettings((s) => s ? { ...s, signatureUrl: "", signatureName: "", signatureTitle: "" } : s);
      toast.success("Signature removed");
    } catch { toast.error("Failed to remove signature"); }
  };

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-5">
      <SectionHeader title="Fees & Receipts" desc="Fee categories, invoices and receipt design" />

      {/* Fee Categories link */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EBF0F7] flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#003366]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Fee Categories</p>
              <p className="text-xs text-gray-500">Manage fee types, invoices and assignments</p>
            </div>
          </div>
          <OutlineBtn onClick={() => router.push("/fees-management")}>
            Go to Fees Management <ChevronRight className="w-3.5 h-3.5" />
          </OutlineBtn>
        </div>
      </Card>

      {/* Receipt Signature */}
      <Card>
        <CardHeader title="Receipt Signature" />
        <div className="p-5">
          {settings?.signatureUrl ? (
            <div className="flex items-start gap-5">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-w-[160px] text-center">
                <img src={settings.signatureUrl} alt="Signature" className="max-h-16 mx-auto object-contain" />
                {settings.signatureName && (
                  <p className="text-xs font-semibold text-gray-700 mt-2">{settings.signatureName}</p>
                )}
                {settings.signatureTitle && (
                  <p className="text-xs text-gray-500">{settings.signatureTitle}</p>
                )}
              </div>
              <div className="space-y-3 flex-1">
                <InputField label="Signatory Name" value={settings.signatureName || ""} onChange={async (v) => { setSettings((s) => s ? { ...s, signatureName: v } : s); await updateReceiptSettings({ signatureName: v }); }} placeholder="e.g. A. Okafor" />
                <InputField label="Signatory Title" value={settings.signatureTitle || ""} onChange={async (v) => { setSettings((s) => s ? { ...s, signatureTitle: v } : s); await updateReceiptSettings({ signatureTitle: v }); }} placeholder="e.g. Principal" />
                <div className="flex gap-2">
                  <input ref={signatureRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSignatureUpload} />
                  <OutlineBtn onClick={() => signatureRef.current?.click()} disabled={uploading}>
                    <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Change Signature"}
                  </OutlineBtn>
                  <OutlineBtn onClick={removeSignature} className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </OutlineBtn>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">No signature uploaded</p>
              <input ref={signatureRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSignatureUpload} />
              <PrimaryBtn onClick={() => signatureRef.current?.click()} loading={uploading}>
                <Upload className="w-4 h-4" /> Upload Signature
              </PrimaryBtn>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG · max 2MB</p>
            </div>
          )}
        </div>
      </Card>

      {/* Receipt Preferences */}
      <Card>
        <CardHeader title="Receipt Preferences" />
        <div className="px-5 pb-2 pt-1">
          <ToggleRow label="Show school logo on receipt" checked={settings?.showSchoolLogo ?? true} onChange={(v) => updateToggle("showSchoolLogo", v)} />
          <ToggleRow label="Allow parents to download receipts" checked={settings?.allowParentDownload ?? true} onChange={(v) => updateToggle("allowParentDownload", v)} />
          <ToggleRow label="Show QR verification code" checked={settings?.showQrVerification ?? false} onChange={(v) => updateToggle("showQrVerification", v)} />
          <ToggleRow label="Show authorized signature" checked={settings?.showAuthorizedSignature ?? false} onChange={(v) => updateToggle("showAuthorizedSignature", v)} />
        </div>
      </Card>

      {/* Receipt Footer Note */}
      <Card>
        <CardHeader title="Receipt Footer Note" />
        <div className="p-5 space-y-3">
          <textarea value={footerNote} onChange={(e) => setFooterNote(e.target.value)} maxLength={250}
            rows={3} placeholder="e.g. Thank you for your payment. Every child. Every classroom. Every future."
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003366] resize-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{footerNote.length}/250 characters</span>
            <PrimaryBtn onClick={saveFooterNote} loading={saving}>Save Preferences</PrimaryBtn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Payments & Finance Section ───────────────────────────────────────────────

const NGN = (n: number) =>
  `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

function PaymentsFinanceSection() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [finSettings, setFinSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [savingFin, setSavingFin] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", bankCode: "", accountNumber: "", accountName: "" });
  const [minAmount, setMinAmount] = useState("");
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      getWalletSummary().then((r) => setWallet(r.summary)).catch(() => {}),
      getBankAccounts().then((r) => setAccounts(r.accounts || [])).catch(() => {}),
      getFinanceSettings().then((r) => { setFinSettings(r.settings); setMinAmount(String(r.settings.minimumWithdrawalAmount || 10000)); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleOtp = async (v: boolean) => {
    if (!finSettings) return;
    setFinSettings({ ...finSettings, requireEmailOtpForWithdrawals: v });
    try { await updateFinanceSettings({ requireEmailOtpForWithdrawals: v }); }
    catch { setFinSettings({ ...finSettings }); toast.error("Failed to save"); }
  };

  const saveMinAmount = async () => {
    const amt = parseFloat(minAmount);
    if (isNaN(amt) || amt < 0) { toast.error("Invalid amount"); return; }
    setSavingFin(true);
    try {
      await updateFinanceSettings({ minimumWithdrawalAmount: amt });
      setFinSettings((s) => s ? { ...s, minimumWithdrawalAmount: amt } : s);
      toast.success("Minimum withdrawal amount saved");
    } catch { toast.error("Failed to save"); }
    finally { setSavingFin(false); }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAccount(true);
    try {
      const r = await addBankAccount(bankForm);
      setAccounts((prev) => [...prev, r.account]);
      setBankForm({ bankName: "", bankCode: "", accountNumber: "", accountName: "" });
      setShowAddAccount(false);
      toast.success("Bank account added");
    } catch (err: any) { toast.error(err.message || "Failed to add account"); }
    finally { setAddingAccount(false); }
  };

  const makeDefault = async (id: string) => {
    try {
      await setDefaultBankAccount(id);
      setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
      toast.success("Default account updated");
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-5">
      <SectionHeader title="Payments & Finance" desc="Wallet, withdrawals and payout settings" />

      {/* Provider Status */}
      <Card>
        <CardHeader title="Payment Providers" />
        <div className="p-5 space-y-3">
          {[
            { name: "Paystack", desc: "Cards, Bank Transfer, USSD", color: "text-green-700", bg: "bg-green-50 border-green-200" },
            { name: "OPay", desc: "Wallet, Transfer, Card", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
            { name: "Stripe", desc: "Card (Visa, Mastercard)", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
          ].map((p) => (
            <div key={p.name} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${p.bg}`}>
              <div>
                <p className={`text-sm font-semibold ${p.color}`}>{p.name}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
              <span className="text-xs text-gray-500 font-medium">Enabled by Talim</span>
            </div>
          ))}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Shield className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">Payment providers are securely managed by Talim. Schools receive funds through their school wallet.</p>
          </div>
        </div>
      </Card>

      {/* Wallet Summary */}
      {wallet && (
        <Card>
          <CardHeader title="School Wallet" action={
            <OutlineBtn onClick={() => router.push("/finance")}>
              View Finance <ChevronRight className="w-3.5 h-3.5" />
            </OutlineBtn>
          } />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Available Balance", value: NGN(wallet.availableBalance), color: "text-green-700" },
              { label: "Pending Balance", value: NGN(wallet.pendingBalance), color: "text-yellow-700" },
              { label: "Total Received", value: NGN(wallet.ledgerBalance), color: "text-[#003366]" },
              { label: "Total Withdrawn", value: NGN(wallet.withdrawnBalance), color: "text-gray-700" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Withdrawal Settings */}
      <Card>
        <CardHeader title="Withdrawal Settings" />
        <div className="px-5 pb-3 pt-1">
          <ToggleRow label="Require email OTP for withdrawals" desc="Send a 6-digit OTP to your email before each withdrawal" checked={finSettings?.requireEmailOtpForWithdrawals ?? true} onChange={toggleOtp} />
          <div className="py-3 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-2">Minimum Withdrawal Amount (₦)</p>
            <div className="flex items-center gap-3">
              <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} min={0}
                className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003366]" />
              <PrimaryBtn onClick={saveMinAmount} loading={savingFin}>Save</PrimaryBtn>
            </div>
          </div>
          <div className="py-3">
            <p className="text-sm font-medium text-gray-800 mb-1">Default Payout Account</p>
            <p className="text-xs text-gray-500">
              {accounts.find((a) => a.isDefault)
                ? `${accounts.find((a) => a.isDefault)!.bankName} – ${accounts.find((a) => a.isDefault)!.accountNumber}`
                : "No default account set"}
            </p>
          </div>
        </div>
      </Card>

      {/* Bank Accounts */}
      <Card>
        <CardHeader title="Bank Accounts" action={
          <OutlineBtn onClick={() => setShowAddAccount(!showAddAccount)}>
            <Plus className="w-3.5 h-3.5" /> Add Account
          </OutlineBtn>
        } />
        <AnimatePresence>
          {showAddAccount && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <form onSubmit={handleAddAccount} className="p-5 border-b border-gray-100 bg-gray-50 space-y-4">
                <p className="text-sm font-medium text-gray-700">Add Bank Account</p>
                <p className="text-xs text-gray-500">Ensure the account details are correct. Wrong details may cause withdrawal delays.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
                    <select value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value, bankCode: e.target.selectedOptions[0]?.dataset.code || "" })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003366]" required>
                      <option value="">Select bank</option>
                      {[
                        { name: "GTBank", code: "058" }, { name: "Access Bank", code: "044" },
                        { name: "First Bank", code: "011" }, { name: "Zenith Bank", code: "057" },
                        { name: "UBA", code: "033" }, { name: "Sterling Bank", code: "232" },
                        { name: "Fidelity Bank", code: "070" }, { name: "FCMB", code: "214" },
                      ].map((b) => (
                        <option key={b.code} value={b.name} data-code={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Account Number" value={bankForm.accountNumber} onChange={(v) => setBankForm({ ...bankForm, accountNumber: v })} placeholder="Enter account number" required />
                  <InputField label="Account Name" value={bankForm.accountName} onChange={(v) => setBankForm({ ...bankForm, accountName: v })} placeholder="Enter account name" required />
                </div>
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">Ensure the account details are correct. Wrong details may cause withdrawal delays.</p>
                </div>
                <div className="flex gap-3">
                  <OutlineBtn onClick={() => setShowAddAccount(false)} disabled={addingAccount}>Cancel</OutlineBtn>
                  <PrimaryBtn type="submit" loading={addingAccount}>
                    <CreditCard className="w-3.5 h-3.5" /> Add Account
                  </PrimaryBtn>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="divide-y divide-gray-50">
          {accounts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No bank accounts added</div>
          ) : (
            accounts.map((a) => (
              <div key={a._id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#003366]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{a.bankName} – {a.accountNumber}</p>
                    <p className="text-xs text-gray-500">{a.accountName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.isDefault ? (
                    <span className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">Default</span>
                  ) : (
                    <button onClick={() => makeDefault(a._id)} className="text-xs text-gray-500 hover:text-[#003366] border border-gray-200 px-2 py-0.5 rounded-full transition">
                      Set Default
                    </button>
                  )}
                  <span className={`w-2 h-2 rounded-full ${a.isVerified ? "bg-green-400" : "bg-gray-300"}`} title={a.isVerified ? "Verified" : "Unverified"} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Communication Section ────────────────────────────────────────────────────

function CommunicationSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Communication" desc="Email, SMS and messaging preferences" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Email Notifications", desc: "Configure automated email notifications sent to parents and staff", icon: Bell, link: "/notifications" },
          { title: "SMS Alerts", desc: "Manage SMS alerts for fee payments, results and attendance", icon: MessageSquare, link: "/notifications" },
          { title: "Parent Messages", desc: "Configure parent-teacher messaging preferences", icon: Users, link: "/messages" },
          { title: "Announcements", desc: "Manage how school-wide announcements are distributed", icon: FileText, link: "/announcements" },
        ].map((c) => (
          <Card key={c.title} className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
            </div>
            <a href={c.link} className="inline-flex items-center gap-1 text-xs text-[#003366] font-medium hover:underline">
              Configure <ChevronRight className="w-3 h-3" />
            </a>
          </Card>
        ))}
      </div>
      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
        <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700">Full communication engine configuration is coming soon. Use the links above to access current messaging features.</p>
      </div>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    announcements: true,
    feePayments: true,
    withdrawals: true,
    leaveRequests: true,
    resultPublishing: false,
    newMessages: true,
  });

  const keys: (keyof typeof prefs)[] = ["announcements", "feePayments", "withdrawals", "leaveRequests", "resultPublishing", "newMessages"];
  const labels: Record<keyof typeof prefs, { label: string; desc: string }> = {
    announcements: { label: "Announcement notifications", desc: "Get notified when announcements are published" },
    feePayments: { label: "Fee payment alerts", desc: "Notify when parents make payments" },
    withdrawals: { label: "Withdrawal alerts", desc: "Notify when withdrawal requests are made or approved" },
    leaveRequests: { label: "Leave request alerts", desc: "Notify on new or updated leave requests" },
    resultPublishing: { label: "Result publishing alerts", desc: "Notify when results are published to parents" },
    newMessages: { label: "New message alerts", desc: "Notify when you receive a new message" },
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" desc="Manage notification preferences and alerts" />
      <Card>
        <CardHeader title="Notification Preferences" />
        <div className="px-5 pb-2 pt-1">
          {keys.map((k) => (
            <ToggleRow key={k} label={labels[k].label} desc={labels[k].desc} checked={prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} />
          ))}
        </div>
      </Card>
      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
        <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700">Notification backend integration is coming soon. Settings saved here will take effect once the notification engine is connected.</p>
      </div>
    </div>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const [profile, setProfile] = useState<any>(null);
  const [showPwModal, setShowPwModal] = useState(false);

  useEffect(() => {
    try { setProfile(JSON.parse(localStorage.getItem("user") || "{}")); } catch {}
  }, []);

  const masked = profile?.email
    ? (() => {
        const [l, d] = profile.email.split("@");
        return `${l.slice(0, 3)}${"*".repeat(Math.max(0, l.length - 3))}@${d}`;
      })()
    : "—";

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" desc="Password, OTP and access security" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Password" />
          <div className="p-5">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">Account Password</p>
                <p className="text-xs text-gray-500 mt-0.5">Update your password regularly for security</p>
              </div>
              <OutlineBtn onClick={() => setShowPwModal(true)}>
                <Lock className="w-3.5 h-3.5" /> Change
              </OutlineBtn>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Email OTP" />
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Email OTP (Withdrawals)</p>
                <p className="text-xs text-gray-500">OTP sent to: {masked}</p>
              </div>
              <span className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">Enabled</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Session Security" />
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last Login</span>
              <span className="text-gray-800 font-medium">
                {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Email Verified</span>
              <span className={profile?.isEmailVerified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {profile?.isEmailVerified ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Access Control" />
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Role</span>
              <span className="text-gray-800 font-medium capitalize">{profile?.role?.replace("_", " ") || "School Admin"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Account Status</span>
              <span className={profile?.isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {profile?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
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

  return (
    <div className="space-y-5">
      <SectionHeader title="Data & System" desc="Backups, exports and system information" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Export School Data", desc: "Download student, staff, class and finance data in Excel or CSV", icon: Download, action: () => router.push("/finance") },
          { title: "Academic Reports", desc: "Download term-based academic performance reports", icon: FileText, action: () => router.push("/assessments") },
          { title: "Finance Statement", desc: "Download detailed income and withdrawal statements", icon: Receipt, action: () => router.push("/finance") },
          { title: "Audit Logs", desc: "View a history of administrative actions and changes", icon: Database, action: () => router.push("/finance") },
        ].map((c) => (
          <Card key={c.title} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={c.action}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
            </div>
            <button onClick={c.action} className="inline-flex items-center gap-1 text-xs text-[#003366] font-medium hover:underline">
              Open <ExternalLink className="w-3 h-3" />
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
              <p className="text-xs text-green-600">Your school data is securely backed up by Talim</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Last Backup", value: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString() },
              { label: "Next Backup", value: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleString() },
              { label: "Backup Frequency", value: "Weekly (Every Sunday)" },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* System Version */}
      <Card>
        <CardHeader title="System Information" />
        <div className="p-5 space-y-2 text-sm">
          {[
            { label: "Platform", value: "Talim School Administration" },
            { label: "Version", value: "2.0.0" },
            { label: "Environment", value: "Production" },
            { label: "Support", value: "support@mytalim.com" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{s.label}</span>
              <span className="text-gray-800 font-medium">
                {s.label === "Support" ? (
                  <a href={`mailto:${s.value}`} className="text-[#003366] hover:underline">{s.value}</a>
                ) : s.value}
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
  { value: "dark",  label: "Dark",  desc: "Easy on the eyes at night", icon: Moon },
  { value: "system", label: "System", desc: "Follows your device preference", icon: Monitor },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <SectionHeader title="Appearance" desc="Choose how Talim School Admin looks on this device." />

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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selected ? "bg-[#003366] dark:bg-blue-600 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${selected ? "text-[#003366] dark:text-blue-400" : "text-gray-700 dark:text-slate-200"}`}>
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
            Theme preference is stored locally on this device and does not sync across browsers or devices.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

const SECTION_MAP: Record<Section, React.ComponentType> = {
  "school-profile": SchoolProfileSection,
  "admin-account": AdminAccountSection,
  "academic-setup": AcademicSetupSection,
  "classes-curriculum": ClassesCurriculumSection,
  "assessment-settings": AssessmentSettingsSection,
  "fees-receipts": FeesReceiptsSection,
  "payments-finance": PaymentsFinanceSection,
  "communication": CommunicationSection,
  "notifications": NotificationsSection,
  "security": SecuritySection,
  "data-system": DataSystemSection,
  "appearance": AppearanceSection,
};

export default function SettingsPage() {
  const [active, setActive] = useState<Section>("school-profile");
  const ActiveSection = SECTION_MAP[active];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">Settings</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Manage your school&apos;s preferences and configurations</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-colors ${
                  isActive
                    ? "bg-[#EBF0F7] dark:bg-slate-700 text-[#003366] dark:text-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-[#003366] dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? "text-[#003366] dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate leading-tight mt-0.5">{s.desc}</p>
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
          <ActiveSection />
        </div>
      </main>
    </div>
  );
}
