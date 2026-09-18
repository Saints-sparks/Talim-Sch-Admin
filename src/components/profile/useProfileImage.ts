/**
 * Picking, previewing and storing one of the two images on `/profile` — the
 * administrator's photo and the school logo.
 *
 * The picked file is validated, shown at once as a local preview, uploaded
 * with a progress readout, and then saved. Saving immediately is deliberate:
 * the previous screen uploaded into local state and only persisted the URL if
 * the user also pressed "Save Changes" in the card below, so a photo picked on
 * its own was silently lost.
 */
"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "@/components/CustomToast";
import { uploadToCloudinary, validateImageFile } from "@/app/utils/cloudinary";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";

/** What {@link useProfileImage} gives a card. */
export interface ProfileImage {
  /** The image to render: the local preview while uploading, else the stored one. */
  preview: string | null;
  /** True while the file is uploading or being saved. */
  busy: boolean;
  /** Upload progress, 0–100. */
  progress: number;
  /** `onChange` for the hidden `<input type="file">`. */
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Clears the stored image. */
  remove: () => void;
}

/**
 * Uploads a picked image and stores the hosted URL.
 *
 * @param scope - Log scope, e.g. "profile/avatar".
 * @param stored - The image already on the account, if any.
 * @param save - Persists the hosted URL; `""` removes the image.
 * @returns The preview, the busy flags and the input handlers.
 */
export function useProfileImage(
  scope: string,
  stored: string | null,
  save: (url: string) => Promise<void>
): ProfileImage {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a failure.
    e.target.value = "";
    if (!file) return;

    const { valid, error } = validateImageFile(file);
    if (!valid) {
      toast.error(error ?? "That file can't be used. Choose a JPEG, PNG or WebP image.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setBusy(true);
    setProgress(0);
    try {
      const url = await uploadToCloudinary(file, (p) => setProgress(Math.round(p)));
      await save(url);
    } catch (err) {
      logger.error(scope, "image upload failed", err);
      toast.error(getErrorMessage(err, "Failed to upload image"));
      setPreview(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setBusy(false);
      setProgress(0);
    }
  };

  const remove = () => {
    setBusy(true);
    save("")
      .then(() => setPreview(null))
      .catch((err) => logger.error(scope, "image removal failed", err))
      .finally(() => setBusy(false));
  };

  return { preview: preview ?? stored, busy, progress, onFileChange, remove };
}
