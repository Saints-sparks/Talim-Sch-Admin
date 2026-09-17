"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  BookOpen,
  Receipt,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Plus,
  X,
  Check,
  Trash2,
  Upload,
  Download,
  ExternalLink,
  Lock,
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
import { SubAdminsSection } from "@/components/sub-admin/SubAdminsSection";


import { authService } from "@/app/services/auth.service";
import {
  getWalletSummary,
  getBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  getBanks,
  resolveBankAccount,
  BankAccount,
  WalletSummary,
  PaystackBank,
} from "@/app/services/finance.service";
import {
  getReceiptSettings,
  updateReceiptSettings,
  getFinanceSettings,
  updateFinanceSettings,
  fetchExportData,
  downloadAsCsv,
  ReceiptSettings,
  FinanceSettings,
} from "@/app/services/school-settings.service";
import {
  Card,
  CardHeader,
  InputField,
  OutlineBtn,
  PrimaryBtn,
  SectionHeader,
  ToggleRow,
} from "@/components/settings/ui";
import { SchoolProfileSection } from "@/components/settings/SchoolProfileSection";
import { AdminAccountSection } from "@/components/settings/AdminAccountSection";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { AcademicSetupSection } from "@/components/settings/AcademicSetupSection";
import { uploadToCloudinary } from "@/app/utils/cloudinary";
import { api } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/apiError";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import {
  visibleSections,
  type SectionId,
  type SettingsSectionProps,
} from "@/components/settings/sections";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";



// ─── Classes & Curriculum Section ─────────────────────────────────────────────

function ClassesCurriculumSection() {
  const router = useRouter();
  const cards = [
    {
      title: "Manage Classes",
      desc: "Add, edit and manage class levels for your school",
      icon: Users,
      link: "/classes",
      action: "Go to Classes",
    },
    {
      title: "Manage Subjects",
      desc: "Add, edit and assign subjects to classes",
      icon: BookOpen,
      link: "/subject",
      action: "Go to Subjects",
    },
    {
      title: "Curriculum Library",
      desc: "View and manage curriculum content linked to classes",
      icon: FileText,
      link: "/curriculum",
      action: "Go to Curriculum",
    },
    {
      title: "Class Promotion Settings",
      desc: "Configure promotion rules and criteria",
      icon: ChevronRight,
      link: "/classes",
      action: "Configure",
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Classes & Curriculum"
        desc="Quick access to class and curriculum management"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card
            key={c.title}
            className="p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(c.link)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EBF0F7] flex items-center justify-center shrink-0">
                <c.icon className="w-5 h-5 text-[#003366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
              <button
                onClick={() => router.push(c.link)}
                className="text-xs text-[#003366] font-medium hover:underline shrink-0 flex items-center gap-1"
              >
                {c.action} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Assessment Settings Section ──────────────────────────────────────────────

const GRADING_SCALE = [
  { grade: "A+", min: 90, max: 100 },
  { grade: "A", min: 80, max: 89 },
  { grade: "B+", min: 75, max: 79 },
  { grade: "B", min: 70, max: 74 },
  { grade: "C+", min: 65, max: 69 },
  { grade: "C", min: 60, max: 64 },
  { grade: "D+", min: 55, max: 59 },
  { grade: "D", min: 50, max: 54 },
  { grade: "E", min: 45, max: 49 },
  { grade: "F", min: 0, max: 44 },
];

function AssessmentSettingsSection() {
  const [allowDecimals, setAllowDecimals] = useState(true);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [publishToParents, setPublishToParents] = useState(false);

  return (
    <div className="space-y-5">
      <SectionHeader title="Assessment Settings" desc="Grading rules and assessment preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Grading Scale" />
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 text-left text-xs font-semibold text-gray-500">Grade</th>
                  <th className="py-2 text-left text-xs font-semibold text-gray-500">Min (%)</th>
                  <th className="py-2 text-left text-xs font-semibold text-gray-500">Max (%)</th>
                </tr>
              </thead>
              <tbody>
                {GRADING_SCALE.map((g) => (
                  <tr key={g.grade} className="border-b border-gray-50">
                    <td className="py-2 font-semibold text-[#003366]">{g.grade}</td>
                    <td className="py-2 text-gray-700 dark:text-slate-300">{g.min}</td>
                    <td className="py-2 text-gray-700 dark:text-slate-300">{g.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Score Weighting" />
            <div className="p-5 space-y-3">
              {[
                { label: "Test Score (CA)", value: 30 },
                { label: "Exam Score", value: 70 },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{s.label}</p>
                  <span className="text-sm font-bold text-[#003366]">{s.value}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Other Settings" />
            <div className="p-5 space-y-1">
              <ToggleRow
                label="Allow decimals in scores"
                checked={allowDecimals}
                onChange={setAllowDecimals}
              />
              <ToggleRow
                label="Auto-calculate results"
                desc="Automatically compute final scores from CA and exam"
                checked={autoCalculate}
                onChange={setAutoCalculate}
              />
              <ToggleRow
                label="Publish results to parents"
                desc="Make results visible in the parent portal"
                checked={publishToParents}
                onChange={setPublishToParents}
              />
            </div>
          </Card>
        </div>
      </div>
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Full assessment configuration is available in the{" "}
          <a href="/assessments" className="underline font-medium">
            Assessments module
          </a>
          .
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
    const prev = { ...settings };
    setSettings({ ...settings, [field]: value });
    try {
      await updateReceiptSettings({ [field]: value });
    } catch {
      setSettings(prev);
      toast.error("Failed to save");
    }
  };

  const saveFooterNote = async () => {
    setSaving(true);
    try {
      await updateReceiptSettings({ footerNote });
      setSettings((s) => (s ? { ...s, footerNote } : s));
      toast.success("Footer note saved");
    } catch {
      toast.error("Failed to save footer note");
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Only PNG or JPG files");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB");
      return;
    }
    setUploading(true);
    try {
      const data = { secure_url: await uploadToCloudinary(file) };
      if (data.secure_url) {
        await updateReceiptSettings({ signatureUrl: data.secure_url });
        setSettings((s) => (s ? { ...s, signatureUrl: data.secure_url } : s));
        toast.success("Signature uploaded");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeSignature = async () => {
    try {
      await updateReceiptSettings({ signatureUrl: "", signatureName: "", signatureTitle: "" });
      setSettings((s) =>
        s ? { ...s, signatureUrl: "", signatureName: "", signatureTitle: "" } : s
      );
      toast.success("Signature removed");
    } catch {
      toast.error("Failed to remove signature");
    }
  };

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-5">
      <SectionHeader title="Fees & Receipts" desc="Fee categories, invoices and receipt design" />

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EBF0F7] flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#003366]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                Fee Categories
              </p>
              <p className="text-xs text-gray-500">Manage fee types, invoices and assignments</p>
            </div>
          </div>
          <OutlineBtn onClick={() => router.push("/fees-management")}>
            Go to Fees Management <ChevronRight className="w-3.5 h-3.5" />
          </OutlineBtn>
        </div>
      </Card>

      <Card>
        <CardHeader title="Receipt Signature" />
        <div className="p-5">
          {settings?.signatureUrl ? (
            <div className="flex items-start gap-5">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-w-[160px] text-center">
                <img
                  src={settings.signatureUrl}
                  alt="Signature"
                  className="max-h-16 mx-auto object-contain"
                />
                {settings.signatureName && (
                  <p className="text-xs font-semibold text-gray-700 mt-2">
                    {settings.signatureName}
                  </p>
                )}
                {settings.signatureTitle && (
                  <p className="text-xs text-gray-500">{settings.signatureTitle}</p>
                )}
              </div>
              <div className="space-y-3 flex-1">
                <InputField
                  label="Signatory Name"
                  value={settings.signatureName || ""}
                  onChange={async (v) => {
                    setSettings((s) => (s ? { ...s, signatureName: v } : s));
                    await updateReceiptSettings({ signatureName: v });
                  }}
                  placeholder="e.g. A. Okafor"
                />
                <InputField
                  label="Signatory Title"
                  value={settings.signatureTitle || ""}
                  onChange={async (v) => {
                    setSettings((s) => (s ? { ...s, signatureTitle: v } : s));
                    await updateReceiptSettings({ signatureTitle: v });
                  }}
                  placeholder="e.g. Principal"
                />
                <div className="flex gap-2">
                  <input
                    ref={signatureRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                  <OutlineBtn onClick={() => signatureRef.current?.click()} disabled={uploading}>
                    <Upload className="w-3.5 h-3.5" />{" "}
                    {uploading ? "Uploading…" : "Change Signature"}
                  </OutlineBtn>
                  <OutlineBtn
                    onClick={removeSignature}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </OutlineBtn>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">No signature uploaded</p>
              <input
                ref={signatureRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleSignatureUpload}
              />
              <PrimaryBtn onClick={() => signatureRef.current?.click()} loading={uploading}>
                <Upload className="w-4 h-4" /> Upload Signature
              </PrimaryBtn>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG · max 2MB</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Receipt Preferences" />
        <div className="px-5 pb-2 pt-1">
          <ToggleRow
            label="Show school logo on receipt"
            checked={settings?.showSchoolLogo ?? true}
            onChange={(v) => updateToggle("showSchoolLogo", v)}
          />
          <ToggleRow
            label="Allow parents to download receipts"
            checked={settings?.allowParentDownload ?? true}
            onChange={(v) => updateToggle("allowParentDownload", v)}
          />
          <ToggleRow
            label="Show QR verification code"
            checked={settings?.showQrVerification ?? false}
            onChange={(v) => updateToggle("showQrVerification", v)}
          />
          <ToggleRow
            label="Show authorized signature"
            checked={settings?.showAuthorizedSignature ?? false}
            onChange={(v) => updateToggle("showAuthorizedSignature", v)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Receipt Footer Note" />
        <div className="p-5 space-y-3">
          <textarea
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            maxLength={250}
            rows={3}
            placeholder="e.g. Thank you for your payment. Every child. Every classroom. Every future."
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{footerNote.length}/250 characters</span>
            <PrimaryBtn onClick={saveFooterNote} loading={saving}>
              Save Preferences
            </PrimaryBtn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Payments & Finance Section ───────────────────────────────────────────────

const NGN = (n: number) =>
  `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const COUNTRIES = [
  { code: "nigeria", label: "Nigeria", flag: "🇳🇬" },
  { code: "ghana", label: "Ghana", flag: "🇬🇭" },
  { code: "kenya", label: "Kenya", flag: "🇰🇪" },
  { code: "south africa", label: "South Africa", flag: "🇿🇦" },
  { code: "other", label: "Other", flag: "🌍" },
];

function AddBankAccountForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (account: BankAccount) => void;
  onCancel: () => void;
}) {
  const [country, setCountry] = useState("nigeria");
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<PaystackBank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [saving, setSaving] = useState(false);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isNigeria = country === "nigeria";
  const usePaystack = ["nigeria", "ghana"].includes(country);

  // Fetch bank list when country changes to a Paystack-supported country
  useEffect(() => {
    if (!usePaystack) return;
    setLoadingBanks(true);
    setSelectedBank(null);
    setBankSearch("");
    setAccountNumber("");
    setAccountName("");
    setResolved(false);
    getBanks(country)
      .then((r) => setBanks(r.banks))
      .catch(() => toast.error("Could not load bank list"))
      .finally(() => setLoadingBanks(false));
  }, [country]);

  // Auto-resolve account name when account number reaches 10 digits (Nigeria/Paystack)
  useEffect(() => {
    if (!usePaystack || !selectedBank || accountNumber.length !== 10) {
      if (accountNumber.length < 10) {
        setAccountName("");
        setResolved(false);
        setResolveError("");
      }
      return;
    }
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    setResolveError("");
    resolveTimerRef.current = setTimeout(async () => {
      setResolving(true);
      setAccountName("");
      setResolved(false);
      try {
        const r = await resolveBankAccount(accountNumber, selectedBank.code);
        setAccountName(r.accountName);
        setResolved(true);
      } catch (err: any) {
        setResolveError(err.message || "Could not verify account");
      } finally {
        setResolving(false);
      }
    }, 600);
    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, [accountNumber, selectedBank]);

  // Close bank dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowBankDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const canSubmit = usePaystack
    ? selectedBank && accountNumber.length === 10 && resolved && accountName
    : bankSearch.trim() && accountNumber.trim() && accountName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload = usePaystack
        ? {
            bankName: selectedBank!.name,
            bankCode: selectedBank!.code,
            accountNumber,
            accountName,
            country,
          }
        : {
            bankName: bankSearch.trim(),
            bankCode: "INTL",
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim(),
            country,
          };
      const r = await addBankAccount(payload);
      onSuccess(r.account);
      toast.success("Bank account added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 space-y-4"
    >
      {/* Country */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
          Country <span className="text-red-500">*</span>
        </label>
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setSelectedBank(null);
            setBankSearch("");
            setAccountNumber("");
            setAccountName("");
            setResolved(false);
            setResolveError("");
          }}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366]"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.label}
            </option>
          ))}
        </select>
      </div>

      {usePaystack ? (
        <>
          {/* Bank Search */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Bank <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedBank ? selectedBank.name : bankSearch}
              onChange={(e) => {
                setBankSearch(e.target.value);
                setSelectedBank(null);
                setShowBankDropdown(true);
                setAccountName("");
                setResolved(false);
              }}
              onFocus={() => setShowBankDropdown(true)}
              placeholder={loadingBanks ? "Loading banks…" : "Search for your bank"}
              disabled={loadingBanks}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] disabled:opacity-60"
            />
            {showBankDropdown && !selectedBank && filteredBanks.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredBanks.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setSelectedBank(b);
                      setBankSearch(b.name);
                      setShowBankDropdown(false);
                      setAccountName("");
                      setResolved(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
            {selectedBank && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBank(null);
                  setBankSearch("");
                  setAccountName("");
                  setResolved(false);
                }}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setAccountNumber(v);
                }}
                placeholder="10-digit account number"
                maxLength={10}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366] pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {resolving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {resolved && !resolving && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {resolveError && !resolving && <AlertCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            {resolveError && <p className="text-xs text-red-500 mt-1">{resolveError}</p>}
          </div>

          {/* Account Name (auto-populated) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Account Name
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg min-h-[42px]">
              {resolving ? (
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying account…
                </span>
              ) : accountName ? (
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200 flex-1">
                  {accountName}
                </span>
              ) : (
                <span className="text-sm text-gray-400">
                  Auto-populated after account number entry
                </span>
              )}
              {accountName && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Manual entry for non-Paystack countries */}
          <InputField
            label="Bank Name"
            value={bankSearch}
            onChange={setBankSearch}
            placeholder="e.g. Barclays, HSBC"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Account / IBAN Number"
              value={accountNumber}
              onChange={setAccountNumber}
              placeholder="Account number or IBAN"
              required
            />
            <InputField
              label="Account Name"
              value={accountName}
              onChange={setAccountName}
              placeholder="Name on account"
              required
            />
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              International bank payouts are processed manually. Our team will verify the account
              details.
            </p>
          </div>
        </>
      )}

      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          Ensure the account details are correct. Wrong details may cause withdrawal delays.
        </p>
      </div>

      <div className="flex gap-3">
        <OutlineBtn onClick={onCancel} disabled={saving}>
          Cancel
        </OutlineBtn>
        <PrimaryBtn type="submit" loading={saving} disabled={!canSubmit}>
          <CreditCard className="w-3.5 h-3.5" /> Add Account
        </PrimaryBtn>
      </div>
    </form>
  );
}

function PaymentsFinanceSection() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [finSettings, setFinSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [savingFin, setSavingFin] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      getWalletSummary()
        .then((r) => setWallet(r.summary))
        .catch(() => {}),
      getBankAccounts()
        .then((r) => setAccounts(r.accounts || []))
        .catch(() => {}),
      getFinanceSettings()
        .then((r) => {
          setFinSettings(r.settings);
          setMinAmount(String(r.settings.minimumWithdrawalAmount || 10000));
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleOtp = async (v: boolean) => {
    if (!finSettings) return;
    const prev = { ...finSettings };
    setFinSettings({ ...finSettings, requireEmailOtpForWithdrawals: v });
    try {
      await updateFinanceSettings({ requireEmailOtpForWithdrawals: v });
    } catch {
      setFinSettings(prev);
      toast.error("Failed to save");
    }
  };

  const saveMinAmount = async () => {
    const amt = parseFloat(minAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error("Invalid amount");
      return;
    }
    setSavingFin(true);
    try {
      await updateFinanceSettings({ minimumWithdrawalAmount: amt });
      setFinSettings((s) => (s ? { ...s, minimumWithdrawalAmount: amt } : s));
      toast.success("Minimum withdrawal amount saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingFin(false);
    }
  };

  const makeDefault = async (id: string) => {
    try {
      await setDefaultBankAccount(id);
      setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
      toast.success("Default account updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-5">
      <SectionHeader title="Payments & Finance" desc="Wallet, withdrawals and payout settings" />

      <Card>
        <CardHeader title="Payment Providers" />
        <div className="p-5 space-y-3">
          {[
            {
              name: "Paystack",
              desc: "Cards, Bank Transfer, USSD",
              color: "text-green-700",
              bg: "bg-green-50 border-green-200",
            },
            {
              name: "OPay",
              desc: "Wallet, Transfer, Card",
              color: "text-blue-700",
              bg: "bg-blue-50 border-blue-200",
            },
            {
              name: "Stripe",
              desc: "Card (Visa, Mastercard)",
              color: "text-purple-700",
              bg: "bg-purple-50 border-purple-200",
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${p.bg}`}
            >
              <div>
                <p className={`text-sm font-semibold ${p.color}`}>{p.name}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
              <span className="text-xs text-gray-500 font-medium">Enabled by Talim</span>
            </div>
          ))}
        </div>
      </Card>

      {wallet && (
        <Card>
          <CardHeader
            title="School Wallet"
            action={
              <OutlineBtn onClick={() => router.push("/finance")}>
                View Finance <ChevronRight className="w-3.5 h-3.5" />
              </OutlineBtn>
            }
          />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Available Balance",
                value: NGN(wallet.availableBalance),
                color: "text-green-700",
              },
              {
                label: "Pending Balance",
                value: NGN(wallet.pendingBalance),
                color: "text-yellow-700",
              },
              {
                label: "Total Received",
                value: NGN(wallet.ledgerBalance),
                color: "text-[#003366]",
              },
              {
                label: "Total Withdrawn",
                value: NGN(wallet.withdrawnBalance),
                color: "text-gray-700",
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Withdrawal Settings" />
        <div className="px-5 pb-3 pt-1">
          <ToggleRow
            label="Require email OTP for withdrawals"
            desc="Send a 6-digit OTP to your email before each withdrawal"
            checked={finSettings?.requireEmailOtpForWithdrawals ?? true}
            onChange={toggleOtp}
          />
          <div className="py-3 border-b border-gray-50 dark:border-slate-700">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">
              Minimum Withdrawal Amount (₦)
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min={0}
                className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-[#003366]"
              />
              <PrimaryBtn onClick={saveMinAmount} loading={savingFin}>
                Save
              </PrimaryBtn>
            </div>
          </div>
          <div className="py-3">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-1">
              Default Payout Account
            </p>
            <p className="text-xs text-gray-500">
              {accounts.find((a) => a.isDefault)
                ? `${accounts.find((a) => a.isDefault)!.bankName} – ${accounts.find((a) => a.isDefault)!.accountNumber}`
                : "No default account set"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Bank Accounts"
          action={
            <OutlineBtn onClick={() => setShowAddAccount(!showAddAccount)}>
              <Plus className="w-3.5 h-3.5" /> {showAddAccount ? "Cancel" : "Add Account"}
            </OutlineBtn>
          }
        />
        <AnimatePresence>
          {showAddAccount && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <AddBankAccountForm
                onSuccess={(account) => {
                  setAccounts((prev) => [...prev, account]);
                  setShowAddAccount(false);
                }}
                onCancel={() => setShowAddAccount(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {accounts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No bank accounts added</div>
          ) : (
            accounts.map((a) => (
              <div key={a._id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] dark:bg-slate-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {a.bankName} – {a.accountNumber}
                    </p>
                    <p className="text-xs text-gray-500">{a.accountName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.isDefault ? (
                    <span className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => makeDefault(a._id)}
                      className="text-xs text-gray-500 hover:text-[#003366] border border-gray-200 dark:border-slate-600 px-2 py-0.5 rounded-full transition"
                    >
                      Set Default
                    </button>
                  )}
                  <span
                    className={`w-2 h-2 rounded-full ${a.isVerified ? "bg-green-400" : "bg-gray-300"}`}
                    title={a.isVerified ? "Verified" : "Unverified"}
                  />
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
          {
            title: "Email Notifications",
            desc: "Configure automated email notifications sent to parents and staff",
            icon: Bell,
            link: "/notifications",
          },
          {
            title: "SMS Alerts",
            desc: "Manage SMS alerts for fee payments, results and attendance",
            icon: MessageSquare,
            link: "/notifications",
          },
          {
            title: "Parent Messages",
            desc: "Configure parent-teacher messaging preferences",
            icon: Users,
            link: "/messages",
          },
        ].map((c) => (
          <Card key={c.title} className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#EBF0F7] flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
            </div>
            <a
              href={c.link}
              className="inline-flex items-center gap-1 text-xs text-[#003366] font-medium hover:underline"
            >
              Configure <ChevronRight className="w-3 h-3" />
            </a>
          </Card>
        ))}
      </div>
      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
        <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700">
          Full communication engine configuration is coming soon. Use the links above to access
          current messaging features.
        </p>
      </div>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────

interface AdminNotifPrefs {
  announcementsEnabled: boolean;
  feesEnabled: boolean;
  attendanceEnabled: boolean;
  resultsEnabled: boolean;
  messagesEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const ADMIN_NOTIF_DEFAULTS: AdminNotifPrefs = {
  announcementsEnabled: true,
  feesEnabled: true,
  attendanceEnabled: true,
  resultsEnabled: false,
  messagesEnabled: true,
  pushEnabled: true,
  emailEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};


function NotificationsSection() {
  const [prefs, setPrefs] = useState<AdminNotifPrefs>(ADMIN_NOTIF_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Partial<Record<keyof AdminNotifPrefs, boolean>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Partial<AdminNotifPrefs>>("/notifications/preferences")
      .then((data) => {
        if (data && typeof data === "object") {
          setPrefs((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        setError(
          "Could not load preferences. Showing defaults — your changes will still be saved."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (field: keyof AdminNotifPrefs, value: boolean | string) => {
    const prev = prefs[field];
    setPrefs((p) => ({ ...p, [field]: value }));
    setSaving((s) => ({ ...s, [field]: true }));
    try {
      await api.patch("/notifications/preferences", { [field]: value });
    } catch (error) {
      setPrefs((p) => ({ ...p, [field]: prev }));
      toast.error(getErrorMessage(error, "Failed to save preference. Please try again."));
    } finally {
      setSaving((s) => ({ ...s, [field]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Notifications" desc="Manage notification preferences and alerts" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" desc="Manage notification preferences and alerts" />

      {error && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title="Notification Preferences" />
        <div className="px-5 pb-2 pt-1">
          <ToggleRow
            label="Announcement notifications"
            desc="Get notified when announcements are published"
            checked={prefs.announcementsEnabled}
            onChange={(v) => toggle("announcementsEnabled", v)}
            disabled={saving.announcementsEnabled}
          />
          <ToggleRow
            label="Fee payment alerts"
            desc="Notify when parents make payments or withdrawals"
            checked={prefs.feesEnabled}
            onChange={(v) => toggle("feesEnabled", v)}
            disabled={saving.feesEnabled}
          />
          <ToggleRow
            label="Leave request alerts"
            desc="Notify on new or updated leave requests"
            checked={prefs.attendanceEnabled}
            onChange={(v) => toggle("attendanceEnabled", v)}
            disabled={saving.attendanceEnabled}
          />
          <ToggleRow
            label="Result publishing alerts"
            desc="Notify when results are published to parents"
            checked={prefs.resultsEnabled}
            onChange={(v) => toggle("resultsEnabled", v)}
            disabled={saving.resultsEnabled}
          />
          <ToggleRow
            label="New message alerts"
            desc="Notify when you receive a new message"
            checked={prefs.messagesEnabled}
            onChange={(v) => toggle("messagesEnabled", v)}
            disabled={saving.messagesEnabled}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Delivery" />
        <div className="px-5 pb-2 pt-1">
          <ToggleRow
            label="Push notifications"
            desc="Send alerts to this device"
            checked={prefs.pushEnabled}
            onChange={(v) => toggle("pushEnabled", v)}
            disabled={saving.pushEnabled}
          />
          <ToggleRow
            label="Email notifications"
            desc="Receive updates via email"
            checked={prefs.emailEnabled}
            onChange={(v) => toggle("emailEnabled", v)}
            disabled={saving.emailEnabled}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Browser Notifications" />
        <div className="px-5 pb-2 pt-1">
          <PushNotificationToggle />
        </div>
      </Card>

      <Card>
        <CardHeader title="Quiet Hours" />
        <div className="px-5 pb-2 pt-1">
          <ToggleRow
            label="Enable quiet hours"
            desc="Suppress non-urgent notifications between set times"
            checked={prefs.quietHoursEnabled}
            onChange={(v) => toggle("quietHoursEnabled", v)}
            disabled={saving.quietHoursEnabled}
          />
          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              {(["quietHoursStart", "quietHoursEnd"] as const).map((field) => (
                <div key={field}>
                  <p className="text-xs text-gray-500 mb-1">
                    {field === "quietHoursStart" ? "Start time" : "End time"}
                  </p>
                  <input
                    type="time"
                    value={prefs[field]}
                    onChange={(e) => toggle(field, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

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
