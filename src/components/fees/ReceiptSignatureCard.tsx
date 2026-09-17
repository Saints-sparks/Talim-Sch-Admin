"use client";

import { useEffect, useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "@/components/CustomToast";
import { SkeletonBox } from "@/components/ui/loading";
import { useReceiptSettingsAction } from "@/hooks/fees/mutations";
import type { ReceiptSettings } from "@/app/services/fees.service";
import { feesErrorMessage } from "./errors";
import { cardClass, inputClass, mutedTextClass, secondaryButtonClass } from "./ui";

/** The upload endpoint rejects anything larger, so stop it here. */
const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024;

interface ReceiptSignatureCardProps {
  settings?: ReceiptSettings;
  loading: boolean;
  error: unknown;
  /** False for an admin without MANAGE_FEES: the card shows, the controls don't. */
  canEdit: boolean;
}

/**
 * The signature printed on fee receipts: upload an image, name the signatory,
 * or clear it.
 *
 * @param props - The current settings, their load state and whether the user
 *   may change them.
 * @returns The sidebar card.
 */
export function ReceiptSignatureCard({
  settings,
  loading,
  error,
  canEdit,
}: ReceiptSignatureCardProps) {
  const [name, setName] = useState(settings?.signatureName ?? "");
  const [title, setTitle] = useState(settings?.signatureTitle ?? "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const save = useReceiptSettingsAction();

  useEffect(() => {
    setName(settings?.signatureName ?? "");
    setTitle(settings?.signatureTitle ?? "");
  }, [settings]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a PNG, JPG, or other image file");
      return;
    }
    if (file.size > MAX_SIGNATURE_BYTES) {
      toast.error("Signature image must be 5MB or smaller");
      return;
    }
    save.mutate(
      { type: "upload", file, signatureName: name, signatureTitle: title },
      {
        onSettled: () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      }
    );
  };

  const busy = save.isPending;

  return (
    <div className={`${cardClass} p-4 space-y-3`}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Signature for Receipts
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        This signature will appear on all fee receipts.
      </p>

      {loading ? (
        <SkeletonBox className="h-12" />
      ) : error ? (
        <p className="text-xs text-red-500">{feesErrorMessage(error, "receipt settings")}</p>
      ) : settings?.signatureUrl ? (
        /* A plain <img>: signatures live on an unknown remote host, which
           next/image would need configured in next.config. */
        <img
          src={settings.signatureUrl}
          alt="Receipt signature"
          className="h-12 object-contain border border-gray-100 dark:border-gray-800 rounded p-1 bg-white"
        />
      ) : (
        <div
          className={`h-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded flex items-center justify-center text-xs ${mutedTextClass}`}
        >
          No signature uploaded
        </div>
      )}

      {canEdit && (
        <>
          <div className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Authorized name"
              aria-label="Authorized name"
              className={`${inputClass} py-1.5 text-xs`}
            />
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title / Position"
              aria-label="Signatory title"
              className={`${inputClass} py-1.5 text-xs`}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Recommended size: 300x100px (PNG, JPG)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg ${secondaryButtonClass}`}
            >
              <FiUpload size={12} /> {busy ? "Working..." : "Change Signature"}
            </button>
            <button
              type="button"
              onClick={() => save.mutate({ type: "save", signatureName: name, signatureTitle: title })}
              disabled={busy}
              className={`flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg ${secondaryButtonClass}`}
            >
              Save
            </button>
            {settings?.signatureUrl && (
              <button
                type="button"
                onClick={() => save.mutate({ type: "clear" })}
                disabled={busy}
                className="flex items-center gap-1 text-xs py-1.5 px-3 border border-red-200 dark:border-red-900 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
