"use client";

/**
 * The "New Announcement" dialog.
 *
 * The form mirrors `CreateAnnouncementDto`: a title and content, one or more
 * audiences from the backend's `AnnouncementAudience` enum, an optional
 * attachment URL, and a `SCHEDULED` status that must carry a future
 * `scheduledFor`. Everything is validated here before the request goes out, so
 * the API's 400 is never the first thing the user hears about.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  Image as ImageIcon,
  Megaphone,
  Paperclip,
  Plus,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useCreateAnnouncement } from "@/hooks/announcements/useAnnouncements";
import { uploadFileAttachment } from "@/app/services/files.service";
import type { AnnouncementAudience } from "@/app/services/announcement.service";
import { AUDIENCE_OPTIONS } from "./announcement.presentation";

/** Largest attachment the file service accepts. */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

interface AnnouncementForm {
  title: string;
  content: string;
  attachment?: string;
  audience: AnnouncementAudience[];
  schedule: "now" | "later";
  /** `datetime-local` value, converted to ISO before sending. */
  scheduledFor: string;
  preview: boolean;
}

const emptyForm: AnnouncementForm = {
  title: "",
  content: "",
  attachment: undefined,
  audience: ["all_parents"],
  schedule: "now",
  scheduledFor: "",
  preview: false,
};

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Renders the create-announcement dialog.
 *
 * @param props.open - Whether the dialog is shown.
 * @param props.onClose - Closes the dialog; also called after a successful save.
 */
export function CreateAnnouncementModal({ open, onClose }: CreateAnnouncementModalProps) {
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  if (!open) return null;

  const isSubmitting = createAnnouncement.isPending;

  const toggleAudience = (audience: AnnouncementAudience) => {
    setForm((prev) => {
      const next = prev.audience.includes(audience)
        ? prev.audience.filter((item) => item !== audience)
        : [...prev.audience, audience];
      return { ...prev, audience: next.length ? next : [audience] };
    });
  };

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

    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    if (form.schedule === "later") {
      if (!form.scheduledFor) {
        toast.error("Choose a date and time for scheduled announcements.");
        return;
      }
      if (new Date(form.scheduledFor).getTime() <= Date.now()) {
        toast.error("Scheduled announcements must be set for a future time.");
        return;
      }
    }

    try {
      await createAnnouncement.mutateAsync({
        title: form.title.trim(),
        content: form.content.trim(),
        attachment: form.attachment,
        attachments: form.attachment ? [form.attachment] : undefined,
        audience: form.audience,
        status: form.schedule === "later" ? "SCHEDULED" : "PUBLISHED",
        scheduledFor:
          form.schedule === "later" ? new Date(form.scheduledFor).toISOString() : undefined,
      });

      setForm(emptyForm);
      setAttachmentName(null);
      toast.success("Announcement created successfully.");
      onClose();
    } catch (error) {
      logger.error("announcements", "Create announcement failed", error);
      toast.error(getErrorMessage(error, "Failed to create announcement."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Create announcement"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#003366] dark:text-blue-400">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Create Announcement</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Share important updates with your school community.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id="announcement-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-6 overflow-y-auto px-6 py-5"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="announcement-title"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Title
                </label>
                <input
                  id="announcement-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  maxLength={100}
                  placeholder="Enter announcement title..."
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-sm shadow-sm focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                />
                <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                  {form.title.length}/100
                </p>
              </div>

              <div>
                <label
                  htmlFor="announcement-content"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Content
                </label>
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                  <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2">
                    <span className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Plain text
                    </span>
                    <span className="ml-auto flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <ImageIcon className="h-4 w-4" />
                      <Paperclip className="h-4 w-4" />
                    </span>
                  </div>
                  <textarea
                    id="announcement-content"
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    maxLength={2000}
                    rows={7}
                    placeholder="Write your announcement content..."
                    className="w-full resize-none border-0 bg-white dark:bg-slate-700 p-4 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0"
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                  {form.content.length}/2000
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Audience</p>
                <div className="mt-2 grid gap-2">
                  {AUDIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={form.audience.includes(option.value)}
                      onClick={() => toggleAudience(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                        form.audience.includes(option.value)
                          ? "border-[#003366] bg-blue-50 dark:bg-blue-900/30 text-[#003366] dark:text-blue-400 dark:border-blue-700"
                          : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Schedule</p>
                <div className="mt-2 grid gap-2">
                  {[
                    {
                      value: "now" as const,
                      title: "Publish immediately",
                      caption: "Send this announcement right away.",
                    },
                    {
                      value: "later" as const,
                      title: "Schedule for later",
                      caption: "Choose a future date and time.",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={form.schedule === option.value}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          schedule: option.value,
                          scheduledFor: option.value === "now" ? "" : prev.scheduledFor,
                        }))
                      }
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        form.schedule === option.value
                          ? "border-[#003366] bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700"
                          : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{option.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.caption}</p>
                    </button>
                  ))}
                </div>
                {form.schedule === "later" && (
                  <input
                    type="datetime-local"
                    aria-label="Scheduled date and time"
                    value={form.scheduledFor}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, scheduledFor: event.target.value }))
                    }
                    className="mt-3 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Attachment</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-7 text-center hover:border-[#003366] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
              />
              <UploadCloud className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              <span className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                {attachmentName || "Click to upload or drag and drop"}
              </span>
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Images, PDFs, and documents up to 10MB
              </span>
              {isUploading && (
                <span className="mt-4 h-2 w-52 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <span
                    className="block h-full bg-[#003366] dark:bg-blue-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </span>
              )}
            </label>
          </div>

          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, preview: !prev.preview }))}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            Preview {form.preview ? "on" : "off"}
          </button>

          {form.preview && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Recipient preview
              </p>
              <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                {form.title || "Announcement title"}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                {form.content || "Your announcement content will appear here."}
              </p>
            </div>
          )}
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="announcement-form"
            disabled={isSubmitting || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 hover:bg-[#002952] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
