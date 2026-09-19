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
import React from "react";
import { Eye, Megaphone, Plus, X } from "lucide-react";
import { AttachmentField } from "./create/AttachmentField";
import { AudienceSchedulePanel } from "./create/AudienceSchedulePanel";
import { ContentFields } from "./create/ContentFields";
import { RecipientPreview } from "./create/RecipientPreview";
import { useAnnouncementForm } from "./create/useAnnouncementForm";

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
  const state = useAnnouncementForm(open, onClose);
  const { form, isSubmitting, isUploading } = state;

  if (!open) return null;

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
          onSubmit={state.handleSubmit}
          className="flex-1 space-y-6 overflow-y-auto px-6 py-5"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <ContentFields
              title={form.title}
              content={form.content}
              onTitleChange={(value) => state.setText("title", value)}
              onContentChange={(value) => state.setText("content", value)}
            />
            <AudienceSchedulePanel
              audience={form.audience}
              schedule={form.schedule}
              scheduledFor={form.scheduledFor}
              onToggleAudience={state.toggle}
              onScheduleChange={state.setSchedule}
              onScheduledForChange={(value) => state.setText("scheduledFor", value)}
            />
          </div>

          <AttachmentField
            fileName={state.attachmentName}
            isUploading={isUploading}
            progress={state.uploadProgress}
            disabled={isUploading || isSubmitting}
            onFileChange={state.handleFileChange}
          />

          <button
            type="button"
            onClick={state.togglePreview}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            Preview {form.preview ? "on" : "off"}
          </button>

          {form.preview && <RecipientPreview title={form.title} content={form.content} />}
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
