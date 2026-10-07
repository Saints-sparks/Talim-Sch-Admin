"use client";

import React from "react";
import { GraduationCap, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { eyebrow, iconButton } from "@/components/tl";
import type { TeacherStep } from "./teacherForm";

const STEP_LABELS = ["Basic Information", "Qualifications", "Employment Details"] as const;
const STEP_COUNT = STEP_LABELS.length;

/** Props for {@link TeacherModalHeader}. */
interface TeacherModalHeaderProps {
  /** The current step. */
  step: TeacherStep;
  /** Id that names the dialog for assistive tech. */
  titleId: string;
  /** Closes the dialog. */
  onClose: () => void;
  /** Disables the close button while a create is in flight. */
  busy: boolean;
}

/**
 * The add-teacher dialog's sheet heading: icon, title, close button and the
 * three-stage progress bar.
 *
 * @param props - Current step, title id, close handler and busy flag.
 * @param props.step - The current step.
 * @param props.titleId - The title's id.
 * @param props.onClose - Close handler.
 * @param props.busy - Whether a create is in flight.
 * @returns The header.
 */
export function TeacherModalHeader({ step, titleId, onClose, busy }: TeacherModalHeaderProps) {
  const percent = Math.round(((step + 1) / STEP_COUNT) * 100);

  return (
    <div className="flex-shrink-0 border-b border-tl-line-soft px-[clamp(20px,3vw,30px)] pb-5 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tl-select text-tl-brand"
          >
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[21px] font-extrabold leading-tight tracking-[-0.4px] text-tl-ink"
            >
              Add New Teacher
            </h2>
            <p className="mt-1 text-[13px] text-tl-muted">Create a teacher account and profile</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className={`${iconButton} -mr-2`}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-4" data-guide="teacher-create-progress">
        <Tooltip
          content="Teacher setup has three stages: login account, personal qualifications, then employment and class availability."
          side="bottom"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-tl-body">
              Step {step + 1} of {STEP_COUNT}: {STEP_LABELS[step]}
            </span>
            <span className={eyebrow}>{percent}% Complete</span>
          </div>
        </Tooltip>
        <div
          role="progressbar"
          aria-label="Teacher setup progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2 h-2 overflow-hidden rounded bg-tl-line-soft"
        >
          <div
            className="h-full rounded bg-tl-brand-fill transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
