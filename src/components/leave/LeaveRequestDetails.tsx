"use client";

/**
 * The body of a leave request: who asked, for when, why, and what they
 * attached.
 *
 * The API nulls `studentUser` and `studentProfile` when the student record has
 * been removed, so every field here is rendered through a guard rather than
 * assumed present.
 */
import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { LeaveRequest } from "@/app/services/leave.service";
import { formatDate, leaveTypeLabel } from "./leave.presentation";

/** One label/value pair. */
function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-sm font-medium text-tl-muted">{label}:</span>
      <p className="break-words text-tl-ink">{value}</p>
    </div>
  );
}

/** The file name at the end of an attachment URL. */
function attachmentName(url: string): string {
  try {
    const path = new URL(url, "https://talim.invalid").pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url;
  }
}

interface LeaveRequestDetailsProps {
  request: LeaveRequest;
}

/**
 * Renders the student, parent, leave and attachment sections.
 *
 * @param props.request - The leave request being reviewed.
 */
export function LeaveRequestDetails({ request }: LeaveRequestDetailsProps) {
  const student = request.studentUser;
  const profile = request.studentProfile;
  const parent = profile?.parentContact;
  const attachments = request.attachments ?? [];

  return (
    <>
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <h3 className="mb-3 text-[15px] font-extrabold text-tl-ink">Student Information</h3>
          {student ? (
            <div className="space-y-3">
              <Field label="Grade Level" value={profile?.gradeLevel} />
              <Field label="Student Email" value={student.email} />
              <Field label="Student Phone" value={student.phoneNumber} />
              <Field label="Student ID" value={student.userId} />
            </div>
          ) : (
            <p className="text-sm text-tl-muted">
              This student&apos;s record is no longer available.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="mb-3 text-[15px] font-extrabold text-tl-ink">Parent Information</h3>
          {parent?.fullName || parent?.phoneNumber || parent?.email ? (
            <div className="space-y-3">
              <Field label="Parent Name" value={parent?.fullName} />
              <Field label="Parent Phone" value={parent?.phoneNumber} />
              <Field label="Parent Email" value={parent?.email} />
            </div>
          ) : (
            <p className="text-sm text-tl-muted">No parent contact is on file for this student.</p>
          )}
        </section>
      </div>

      <section className="mb-6">
        <h3 className="mb-3 text-[15px] font-extrabold text-tl-ink">Leave Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Leave Type" value={leaveTypeLabel(request.leaveType)} />
          <Field
            label="Leave Period"
            value={`${formatDate(request.startDate)} - ${formatDate(request.endDate)}`}
          />
          <Field label="Request Submitted" value={formatDate(request.createdAt)} />
          <Field label="Last Updated" value={formatDate(request.updatedAt)} />
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-3 text-[15px] font-extrabold text-tl-ink">Reason for Leave</h3>
        <p className="whitespace-pre-line rounded-2xl bg-tl-subtle p-4 leading-relaxed text-tl-ink">
          {request.reason || "No reason provided."}
        </p>
      </section>

      {request.declineReason && (
        <section className="mb-6">
          <h3 className="mb-3 text-[15px] font-extrabold text-tl-ink">
            Reason given to the parent
          </h3>
          <p className="whitespace-pre-line rounded-2xl bg-tl-danger-bg p-4 leading-relaxed text-tl-danger">
            {request.declineReason}
          </p>
        </section>
      )}

      {attachments.length > 0 && (
        <section className="mb-6">
          <Tooltip
            content="Supporting documents submitted by the parent (e.g. medical certificate)."
            side="right"
          >
            <h3 className="mb-3 inline-block text-[15px] font-extrabold text-tl-ink">
              Attachments
            </h3>
          </Tooltip>
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment}
                className="flex items-center justify-between gap-4 rounded-2xl bg-tl-subtle p-3"
              >
                <span className="min-w-0 truncate text-tl-ink">{attachmentName(attachment)}</span>
                <a
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded bg-tl-brand-fill px-3 py-1 text-sm text-white transition hover:bg-[#123a5e]"
                >
                  Open
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
