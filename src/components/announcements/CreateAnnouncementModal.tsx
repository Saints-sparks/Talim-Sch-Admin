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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,27,46,0.45)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Create announcement"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-tl-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-tl-line px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tl-select text-tl-brand">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-tl-ink">Create Announcement</h2>
              <p className="mt-1 text-sm text-tl-muted">
                Share important updates with your school community.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-tl-track text-tl-muted hover:bg-tl-bg"
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
            className="inline-flex items-center gap-2 rounded-xl border border-tl-line px-4 py-2 text-sm font-semibold text-tl-body hover:bg-tl-bg"
          >
            <Eye className="h-4 w-4" />
            Preview {form.preview ? "on" : "off"}
          </button>

          {form.preview && <RecipientPreview title={form.title} content={form.content} />}
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-tl-line bg-tl-subtle px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-tl-muted hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="announcement-form"
            disabled={isSubmitting || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-tl-brand-fill px-5 py-3 text-sm font-semibold text-white hover:bg-tl-brand-fill-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
