"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Receipt, Trash2, Upload } from "lucide-react";
import { useReceiptSettings, useUpdateReceiptSettings } from "@/hooks/settings/useReceiptSettings";
import { useImageUpload } from "@/hooks/settings/useImageUpload";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import type { ReceiptSettings } from "@/app/services/school-settings.service";
import {
  Card,
  CardHeader,
  InputField,
  OutlineBtn,
  PrimaryBtn,
  SectionError,
  SectionHeader,
  SectionSkeleton,
  ToggleRow,
} from "@/components/settings/ui";

const TITLE = "Fees & Receipts";
const DESC = "Fee categories, invoices and receipt design";

/** Max length the backend accepts for the receipt footer note. */
const FOOTER_MAX = 250;

const TOGGLES: Array<{ field: keyof ReceiptSettings; label: string; fallback: boolean }> = [
  { field: "showSchoolLogo", label: "Show school logo on receipt", fallback: true },
  { field: "allowParentDownload", label: "Allow parents to download receipts", fallback: true },
  { field: "showQrVerification", label: "Show QR verification code", fallback: false },
  { field: "showAuthorizedSignature", label: "Show authorized signature", fallback: false },
];

/**
 * Settings → Fees & Receipts: the signature, logo and footer note that appear
 * on a payment receipt, plus a shortcut into Fees Management.
 *
 * @param props.canManage - False for a role without `manage:settings`: every
 *   control becomes read-only rather than failing at the API.
 */
export function FeesReceiptsSection({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data: settings, isLoading, isError, error, refetch } = useReceiptSettings();
  const { save, saving } = useUpdateReceiptSettings();

  const [footerNote, setFooterNote] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureTitle, setSignatureTitle] = useState("");
  const signatureRef = useRef<HTMLInputElement>(null);

  const { uploading, onFileChange } = useImageUpload("settings/receipt-signature", (signatureUrl) =>
    save({ signatureUrl }, "Signature uploaded")
  );

  useEffect(() => {
    if (!settings) return;
    setFooterNote(settings.footerNote || "");
    setSignatureName(settings.signatureName || "");
    setSignatureTitle(settings.signatureTitle || "");
  }, [settings]);

  if (isLoading) return <SectionSkeleton title={TITLE} desc={DESC} />;
  if (isError || !settings) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={error}
        fallback="Failed to load receipt settings."
        onRetry={() => refetch()}
      />
    );
  }

  const footerTooLong = footerNote.length > FOOTER_MAX;

  /** Saves one signatory field, but only when it actually changed. */
  const saveSignatory = (field: "signatureName" | "signatureTitle", value: string) => {
    if ((settings[field] || "") === value) return;
    void save({ [field]: value }, "Signature details saved");
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      {hasPermission(Permission.MANAGE_FEES) && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tl-select flex items-center justify-center">
                <Receipt className="w-5 h-5 text-tl-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-tl-ink">Fee Categories</p>
                <p className="text-xs text-tl-muted">Manage fee types, invoices and assignments</p>
              </div>
            </div>
            <OutlineBtn onClick={() => router.push("/fees-management")}>
              Go to Fees Management <ChevronRight className="w-3.5 h-3.5" />
            </OutlineBtn>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Receipt Signature" />
        <div className="p-5">
          <input
            ref={signatureRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={onFileChange}
          />
          {settings.signatureUrl ? (
            <div className="flex flex-wrap items-start gap-5">
              <div className="border border-tl-line rounded-lg p-4 bg-tl-subtle min-w-[160px] text-center">
                <img
                  src={settings.signatureUrl}
                  alt="Authorized signature"
                  className="max-h-16 mx-auto object-contain"
                />
                {settings.signatureName && (
                  <p className="text-xs font-semibold text-tl-body mt-2">
                    {settings.signatureName}
                  </p>
                )}
                {settings.signatureTitle && (
                  <p className="text-xs text-tl-muted">{settings.signatureTitle}</p>
                )}
              </div>
              <div className="space-y-3 flex-1 min-w-[240px]">
                <InputField
                  label="Signatory Name"
                  value={signatureName}
                  onChange={setSignatureName}
                  onBlur={() => saveSignatory("signatureName", signatureName)}
                  placeholder="e.g. A. Okafor"
                  disabled={!canManage}
                />
                <InputField
                  label="Signatory Title"
                  value={signatureTitle}
                  onChange={setSignatureTitle}
                  onBlur={() => saveSignatory("signatureTitle", signatureTitle)}
                  placeholder="e.g. Principal"
                  disabled={!canManage}
                />
                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <OutlineBtn onClick={() => signatureRef.current?.click()} disabled={uploading}>
                      <Upload className="w-3.5 h-3.5" />{" "}
                      {uploading ? "Uploading…" : "Change Signature"}
                    </OutlineBtn>
                    <OutlineBtn
                      onClick={() =>
                        void save(
                          { signatureUrl: "", signatureName: "", signatureTitle: "" },
                          "Signature removed"
                        )
                      }
                      disabled={saving}
                      className="text-tl-danger border-tl-danger/30 hover:bg-tl-danger-bg"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </OutlineBtn>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-tl-line rounded-lg">
              <p className="text-sm text-tl-muted mb-3">No signature uploaded</p>
              {canManage && (
                <>
                  <PrimaryBtn
                    onClick={() => signatureRef.current?.click()}
                    loading={uploading}
                    className="mx-auto"
                  >
                    <Upload className="w-4 h-4" /> Upload Signature
                  </PrimaryBtn>
                  <p className="text-xs text-tl-faint mt-2">PNG, JPG · max 2MB</p>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Receipt Preferences" />
        <div className="px-5 pb-2 pt-1">
          {TOGGLES.map((t) => (
            <ToggleRow
              key={t.field}
              label={t.label}
              checked={Boolean(settings[t.field] ?? t.fallback)}
              disabled={!canManage || saving}
              onChange={(v) => void save({ [t.field]: v })}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Receipt Footer Note" />
        <div className="p-5 space-y-3">
          <textarea
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            maxLength={FOOTER_MAX}
            rows={3}
            disabled={!canManage}
            aria-label="Receipt footer note"
            placeholder="e.g. Thank you for your payment. Every child. Every classroom. Every future."
            className="w-full px-3 py-2.5 text-sm border border-tl-control rounded-lg outline-none focus:border-tl-link resize-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-tl-faint">
              {footerNote.length}/{FOOTER_MAX} characters
            </span>
            {canManage && (
              <PrimaryBtn
                onClick={() => void save({ footerNote }, "Footer note saved")}
                loading={saving}
                disabled={footerTooLong || footerNote === (settings.footerNote || "")}
              >
                Save Preferences
              </PrimaryBtn>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
