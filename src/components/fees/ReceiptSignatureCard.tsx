"use client";

import { useEffect, useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "@/components/CustomToast";
import {
  card,
  dangerGhostButton,
  fieldControl,
  rowButton,
  sectionTitle,
  skeletonBlock,
} from "@/components/tl";
import { useReceiptSettingsAction } from "@/hooks/fees/mutations";
import type { ReceiptSettings } from "@/app/services/fees.service";
import { feesErrorMessage } from "./errors";

/** The upload endpoint rejects anything larger, so stop it here. */
const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024;

/** Props for {@link ReceiptSignatureCard}. */
interface ReceiptSignatureCardProps {
  /** The receipt settings, once loaded. */
  settings?: ReceiptSettings;
  /** True while they load. */
  loading: boolean;
  /** What the load threw, if it failed. */
  error: unknown;
  /** False for an admin without `manage:settings` (the receipt route's permission): the card shows, the controls don't. */
  canEdit: boolean;
}

/**
 * The signature printed on fee receipts: upload an image, name the signatory,
 * or clear it.
 *
 * @param props - The current settings, their load state and whether the user
 *   may change them.
 * @param props.settings - The receipt settings.
 * @param props.loading - Whether they are loading.
 * @param props.error - The load error.
 * @param props.canEdit - Whether the user may change them.
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

  /**
   * Checks the picked image and uploads it with the signatory's name.
   *
   * @param file - The picked file, if any.
   */
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
    <section className={`${card} flex flex-col gap-3`}>
      <div>
        <h2 className={sectionTitle}>Signature for Receipts</h2>
        <p className="mt-1 text-[13px] text-tl-muted">
          This signature will appear on all fee receipts.
        </p>
      </div>

      {loading ? (
        <div aria-hidden className={`${skeletonBlock} h-14 rounded-xl`} />
      ) : error ? (
        <p className="text-[13px] font-semibold text-tl-danger">
          {feesErrorMessage(error, "receipt settings")}
        </p>
      ) : settings?.signatureUrl ? (
        /* A plain <img>: signatures live on an unknown remote host, which
           next/image would need configured in next.config. The white pad keeps
           a dark-ink signature readable in the dark theme. */
        <img
          src={settings.signatureUrl}
          alt="Receipt signature"
          className="h-14 rounded-xl border border-tl-line-soft bg-white object-contain p-1.5"
        />
      ) : (
        <div className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-tl-line text-[13px] text-tl-muted">
          No signature uploaded
        </div>
      )}

      {!canEdit && !loading && !error && (
        <div className="flex flex-col gap-1">
          {(settings?.signatureName || settings?.signatureTitle) && (
            <p className="text-sm font-semibold text-tl-body">
              {[settings?.signatureName, settings?.signatureTitle].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="text-[13px] text-tl-muted">
            Changing the signature needs the Manage Settings permission.
          </p>
        </div>
      )}

      {canEdit && (
        <>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Authorized name"
              aria-label="Authorized name"
              className={fieldControl}
            />
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title / Position"
              aria-label="Signatory title"
              className={fieldControl}
            />
          </div>
          <p className="text-xs text-tl-muted">Recommended size: 300x100px (PNG, JPG)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className={`${rowButton} flex-1`}
            >
              <FiUpload size={13} aria-hidden /> {busy ? "Working..." : "Change Signature"}
            </button>
            <button
              type="button"
              onClick={() => save.mutate({ type: "save", signatureName: name, signatureTitle: title })}
              disabled={busy}
              className={rowButton}
            >
              Save
            </button>
            {settings?.signatureUrl && (
              <button
                type="button"
                onClick={() => save.mutate({ type: "clear" })}
                disabled={busy}
                className={dangerGhostButton}
              >
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
