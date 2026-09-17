/**
 * Picking the two images onboarding asks for — the school logo and the
 * administrator's photo.
 *
 * The file is validated, shown immediately as a local preview, then uploaded;
 * the hosted URL is what the step saves. A rejected file or a failed upload
 * restores the previous image and says why, so the step never sits on a
 * preview that was never stored.
 */
"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "@/components/CustomToast";
import { uploadToCloudinary, validateImageFile } from "@/app/utils/cloudinary";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";

/** What {@link useImagePicker} gives a step. */
export interface ImagePicker {
  /** The image to render: a local preview, the uploaded URL, or the stored one. */
  preview: string | null;
  /** The hosted URL to save, or `null` while nothing new has been uploaded. */
  uploadedUrl: string | null;
  /** True while the chosen file is uploading. */
  uploading: boolean;
  /** `onChange` for the hidden `<input type="file">`. */
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Validates, previews and uploads one picked image.
 *
 * @param scope - Log scope, e.g. "onboarding/logo".
 * @param initial - The image already stored on the account, if any.
 * @returns The preview, the uploaded URL and the input's change handler.
 */
export function useImagePicker(scope: string, initial: string | null): ImagePicker {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a failure.
    e.target.value = "";
    if (!file) return;

    const { valid, error } = validateImageFile(file);
    if (!valid) {
      toast.error(error ?? "That file can't be used. Choose a PNG or JPG under 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setUploadedUrl(url);
    } catch (err) {
      logger.error(scope, "image upload failed", err);
      toast.error(getErrorMessage(err, "Upload failed. Please try again."));
      setLocalPreview(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    }
  };

  return {
    preview: localPreview ?? uploadedUrl ?? initial,
    uploadedUrl,
    uploading,
    onFileChange,
  };
}
