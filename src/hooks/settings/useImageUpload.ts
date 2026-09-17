/**
 * Picking and uploading the small images Settings accepts — the school logo,
 * the admin avatar and the receipt signature. One rule for all three: PNG or
 * JPG, at most 2 MB, uploaded to Cloudinary before the URL is saved.
 */
"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "@/components/CustomToast";
import { uploadToCloudinary } from "@/app/utils/cloudinary";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";

/** Image types Settings accepts. */
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

/** Largest image Settings accepts, in bytes. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Checks a chosen file against the Settings image rule.
 *
 * @param file - The file the user picked.
 * @returns The reason it was rejected, or `null` when it is acceptable.
 */
export function validateSettingsImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG or JPG files are allowed";
  if (file.size > MAX_IMAGE_BYTES) return "File size must be under 2MB";
  return null;
}

/** What {@link useImageUpload} gives a section. */
export interface ImageUpload {
  /** True while the file is being uploaded and saved. */
  uploading: boolean;
  /** `onChange` for the hidden `<input type="file">`. */
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Uploads a picked image, then hands the hosted URL to `save`.
 *
 * Rejected files are reported to the user and never uploaded; a failed upload
 * or save shows a toast and leaves the previous image in place.
 *
 * @param scope - Log scope, e.g. "settings/logo".
 * @param save - Persists the hosted URL (the mutation that stores it).
 * @returns The uploading flag and the input's change handler.
 */
export function useImageUpload(scope: string, save: (url: string) => Promise<unknown>): ImageUpload {
  const [uploading, setUploading] = useState(false);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a failure.
    e.target.value = "";
    if (!file) return;

    const problem = validateSettingsImage(file);
    if (problem) {
      toast.error(problem);
      return;
    }

    setUploading(true);
    uploadToCloudinary(file)
      .then((url) => save(url))
      .catch((err) => {
        logger.error(scope, "image upload failed", err);
        toast.error(getErrorMessage(err, "Upload failed. Please try again."));
      })
      .finally(() => setUploading(false));
  };

  return { uploading, onFileChange };
}
