"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useCreateAnnouncement } from "@/hooks/announcements/useAnnouncements";
import { uploadFileAttachment } from "@/app/services/files.service";
import type { AnnouncementAudience } from "@/app/services/announcement.service";
import {
  MAX_ATTACHMENT_BYTES,
  emptyForm,
  toAnnouncementPayload,
  toggleAudience,
  validateAnnouncement,
  type AnnouncementForm,
  type Schedule,
} from "./announcementForm";

/**
 * The state and actions of the create-announcement dialog: the form, the
 * attachment upload, validation and the save.
 *
 * Escape closes the dialog and body scroll is locked while it is open.
 *
 * @param open - Whether the dialog is shown.
 * @param onClose - Closes the dialog; also called after a successful save.
 * @returns The form, upload state and handlers.
 */
export function useAnnouncementForm(open: boolean, onClose: () => void) {
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const createAnnouncement = useCreateAnnouncement();

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /** Sets one text field of the form. */
  const setText = (field: "title" | "content" | "scheduledFor", value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggle = (audience: AnnouncementAudience) =>
    setForm((prev) => ({ ...prev, audience: toggleAudience(prev.audience, audience) }));

  /** Picks when to send; choosing "now" forgets any chosen time. */
  const setSchedule = (schedule: Schedule) =>
    setForm((prev) => ({
      ...prev,
      schedule,
      scheduledFor: schedule === "now" ? "" : prev.scheduledFor,
    }));

  const togglePreview = () => setForm((prev) => ({ ...prev, preview: !prev.preview }));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File size must be less than 10MB");
      event.target.value = "";
      return;
    }

    setAttachmentName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const attachment = await uploadFileAttachment(file, setUploadProgress);
      setForm((prev) => ({ ...prev, attachment }));
      toast.success("Attachment uploaded successfully.");
    } catch (error) {
      logger.error("announcements", "Attachment upload failed", error);
      setAttachmentName(null);
      toast.error(getErrorMessage(error, "Failed to upload attachment. Please try again."));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const problem = validateAnnouncement(form);
    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      await createAnnouncement.mutateAsync(toAnnouncementPayload(form));

      setForm(emptyForm);
      setAttachmentName(null);
      toast.success("Announcement created successfully.");
      onClose();
    } catch (error) {
      logger.error("announcements", "Create announcement failed", error);
      toast.error(getErrorMessage(error, "Failed to create announcement."));
    }
  };

  return {
    form,
    attachmentName,
    isUploading,
    uploadProgress,
    isSubmitting: createAnnouncement.isPending,
    setText,
    toggle,
    setSchedule,
    togglePreview,
    handleFileChange,
    handleSubmit,
  };
}
