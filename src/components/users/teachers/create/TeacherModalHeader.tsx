"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TeacherStep } from "./teacherForm";

const STEP_LABELS = ["Basic Information", "Qualifications", "Employment Details"] as const;
const STEP_COUNT = STEP_LABELS.length;

interface TeacherModalHeaderProps {
  step: TeacherStep;
  /** Id that names the dialog for assistive tech. */
  titleId: string;
  onClose: () => void;
  /** Disables the close button while a create is in flight. */
  busy: boolean;
}

/**
 * Navy header of the add-teacher dialog: title, close button and the
 * three-stage progress bar.
 *
 * @param props - Current step, title id, close handler and busy flag.
 * @returns The header.
 */
export function TeacherModalHeader({ step, titleId, onClose, busy }: TeacherModalHeaderProps) {
  const percent = Math.round(((step + 1) / STEP_COUNT) * 100);

  return (
    <div className="bg-[#003366] p-6 text-white flex-shrink-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <div>
            <h2 id={titleId} className="text-2xl font-bold">
              Add New Teacher
            </h2>
            <p className="text-blue-100 text-sm">Create a teacher account and profile</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-6" data-guide="teacher-create-progress">
        <Tooltip
          content="Teacher setup has three stages: login account, personal qualifications, then employment and class availability."
          side="bottom"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-100">
              Step {step + 1} of {STEP_COUNT}: {STEP_LABELS[step]}
            </span>
            <span className="text-sm text-blue-200">{percent}% Complete</span>
          </div>
        </Tooltip>
        <div className="bg-blue-500/30 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
